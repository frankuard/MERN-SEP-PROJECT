const User = require('../models/User');
const CommunityMembership = require('../models/CommunityMembership');
const CommunityWorkshop = require('../models/CommunityWorkshop');
const CommunityProfile = require('../models/CommunityProfile');
const {
  createNotification,
  createNotificationForUsers,
} = require('../utils/createNotification');
const { emitToAll } = require('../utils/socketEmitter');
const {
  resolveCommunityIdForUser,
} = require('../middleware/devcorpsMiddleware');

const DEV_CORPS_PORTAL_ID = 'devcorpsCommunity';

// Canonical community ids -> display names. IDs must match the client's
// DEV_CORPS_COMMUNITIES exactly.
const COMMUNITY_NAMES = {
  'ai-horizon': 'AI Horizon',
  devsphere: 'DevSphere',
  'bic-converge': 'BIC Converge',
  lenspire: 'Lenspire',
  incognitous: 'Incognitous',
};

const isValidCommunityId = (id) => Boolean(COMMUNITY_NAMES[id]);

const escapeRegex = (value) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Broadcast each community's real-time member stats to every connected
 * client — the ACCEPTED member count plus the PENDING request count — so the
 * DevCorps Communities cards (which mirror each community portal's About
 * Community screen) refresh the moment a request is sent, approved, or
 * rejected. Never throws — a real-time hiccup must not fail the action that
 * triggered it.
 */
const emitMemberCounts = async () => {
  try {
    const [accepted, pending] = await Promise.all([
      CommunityMembership.aggregate([
        { $match: { status: 'accepted' } },
        { $group: { _id: '$communityId', count: { $sum: 1 } } },
      ]),
      CommunityMembership.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$communityId', count: { $sum: 1 } } },
      ]),
    ]);
    const byAccepted = {};
    const byPending = {};
    for (const row of accepted) byAccepted[row._id] = row.count;
    for (const row of pending) byPending[row._id] = row.count;
    emitToAll('community:memberCount', { counts: byAccepted, pendingCounts: byPending });
  } catch (err) {
    console.error('Failed to broadcast member counts (non-fatal):', err.message);
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Community About Community profiles (single source of truth)
// ──────────────────────────────────────────────────────────────────────────

/**
 * The About Community content that was already configured for each community
 * (previously held on the client). These seed values are written into the
 * CommunityProfile collection on first read, after which Managed Users edits
 * are the single source of truth — the same collection the DevCorps
 * Communities Portal dropdowns render.
 */
const COMMUNITY_ABOUT_SEEDS = {
  'ai-horizon': {
    description:
      'AI community focused on practical AI learning — AI tools, automation, intelligent projects, and AI events that help members understand and apply artificial intelligence in real-world situations.',
  },
  devsphere: {
    description:
      'Web and software development community focused on coding, web technologies, programming, software projects, hands-on workshops, and modern development practices.',
  },
  'bic-converge': {
    description:
      'Business and entrepreneurship community focused on business ideas, startups, marketing, management, strategy, networking, and practical entrepreneurial knowledge.',
  },
  lenspire: {
    description:
      'Social media and content community focused on content creation, storytelling, digital branding, design, social media strategy, and audience engagement.',
  },
  incognitous: {
    description:
      'Cybersecurity community focused on digital security, cyber threats, ethical security practices, vulnerability awareness, security workshops, challenges, and responsible defense.',
  },
};

/**
 * Ensure the CommunityProfile docs exist for all five communities, creating
 * any that are missing from the seed values above. Idempotent and safe to run
 * on every read — new environments get the same about content that was already
 * configured, while existing deployments keep whatever Managed Users edited.
 */
const ensureCommunityProfiles = async () => {
  const existing = await CommunityProfile.find({
    communityId: { $in: Object.keys(COMMUNITY_NAMES) },
  }).lean();
  const existingIds = new Set(existing.map((p) => p.communityId));
  const toCreate = Object.keys(COMMUNITY_NAMES)
    .filter((id) => !existingIds.has(id))
    .map((id) => ({
      communityId: id,
      communityName: COMMUNITY_NAMES[id],
      ...COMMUNITY_ABOUT_SEEDS[id],
    }));
  if (toCreate.length) {
    await CommunityProfile.insertMany(toCreate);
  }
  return CommunityProfile.find({ communityId: { $in: Object.keys(COMMUNITY_NAMES) } }).lean();
};

/**
 * Full About Community content for every community, straight from the
 * CommunityProfile collection (created from the originally configured text on
 * first access). This is what both the Managed Users About tab and the
 * DevCorps Communities Portal dropdowns render — one source, no duplication.
 *
 * GET /api/community-portal/communities
 * Requires: any authenticated approved user.
 */
const getCommunityProfiles = async (req, res) => {
  try {
    const profiles = await ensureCommunityProfiles();
    res.status(200).json({ profiles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const normalizeProfileList = (value) => {
  if (!Array.isArray(value)) {
    value = String(value || '').split(/[\n,;]+/);
  }
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
};

/**
 * Edit one community's About Community content from Managed Users. The change
 * lands in the shared CommunityProfile collection and is broadcast in
 * real time, so the DevCorps Communities Portal dropdown for that community
 * updates immediately — no refresh needed.
 *
 * PUT /api/community-portal/communities/:communityId
 * Body: { description?, purpose?, activities?, workshops?, learningAreas? }
 * Requires: devcorpsMemberScope (community members edit their own community;
 * the DevCorps admin can edit any).
 */
const updateCommunityProfile = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const profile = await CommunityProfile.findOne({ communityId });
    if (!profile) {
      return res.status(404).json({ message: 'Community profile not found' });
    }

    const { description, purpose, activities, workshops, learningAreas } = req.body || {};
    if (typeof description === 'string') profile.description = description.trim();
    if (typeof purpose === 'string') profile.purpose = purpose.trim();
    if (activities !== undefined) {
      profile.activities = normalizeProfileList(activities);
    }
    if (workshops !== undefined) {
      profile.workshops = normalizeProfileList(workshops);
    }
    if (learningAreas !== undefined) {
      profile.learningAreas = normalizeProfileList(learningAreas);
    }
    profile.updatedBy = req.user.id;

    await profile.save();
    await emitToAll('community:profile', { communityId, profile });

    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// User search + membership requests (community portal side)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Live member stats per community, straight from the database — accepted
 * members (Total Members) and pending requests. Drives the DevCorps
 * Communities cards, which render the same content as each community portal's
 * About Community screen. Every community is included so clients can render
 * 0 for the ones with no activity.
 *
 * GET /api/community-portal/counts
 * Requires: any authenticated approved user.
 */
const getCommunityMemberCounts = async (req, res) => {
  try {
    const [accepted, pending] = await Promise.all([
      CommunityMembership.aggregate([
        { $match: { status: 'accepted' } },
        { $group: { _id: '$communityId', count: { $sum: 1 } } },
      ]),
      CommunityMembership.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$communityId', count: { $sum: 1 } } },
      ]),
    ]);

    const countsByCommunity = {};
    const pendingByCommunity = {};
    for (const communityId of Object.keys(COMMUNITY_NAMES)) {
      countsByCommunity[communityId] = 0;
      pendingByCommunity[communityId] = 0;
    }
    for (const row of accepted) {
      if (isValidCommunityId(row._id)) countsByCommunity[row._id] = row.count;
    }
    for (const row of pending) {
      if (isValidCommunityId(row._id)) pendingByCommunity[row._id] = row.count;
    }

    res.status(200).json({ counts: countsByCommunity, pendingCounts: pendingByCommunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Search approved campus users by name/email/department for the community's
 * "Member Requests" screen. Attaches the existing membership state for the
 * requesting community, so the UI can show Pending/Accepted/Rejected instead
 * of a send button where a request already exists.
 *
 * GET /api/community-portal/users/search?q=
 * Requires: community member account.
 */
const searchUsers = async (req, res) => {
  try {
    const myCommunity = resolveCommunityIdForUser(req.user);
    if (!myCommunity) {
      return res.status(403).json({ message: 'No community account resolved' });
    }

    const query = String(req.query.q || '').trim();
    // Candidate users are the Student/Teacher panels (the user side of the
    // workflow) — those dashboards own the approval UI, so keeping the pool
    // there guarantees every invitable user can actually approve/reject.
    const filter = {
      status: 'approved',
      role: { $in: ['student', 'teacher'] },
      portal: { $ne: DEV_CORPS_PORTAL_ID },
    };

    if (query) {
      const rx = new RegExp(escapeRegex(query), 'i');
      filter.$or = [{ username: rx }, { email: rx }, { department: rx }];
    }

    const users = await User.find(filter)
      .select('username email role department semester profileImage')
      .sort({ username: 1 })
      .limit(12);

    const ids = users.map((u) => u._id);
    const existing = await CommunityMembership.find({
      communityId: myCommunity,
      user: { $in: ids },
    }).select('_id user status');

    const statusByUser = new Map(
      existing.map((m) => [String(m.user), { status: m.status, membershipId: m._id }])
    );

    const results = users.map((u) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      department: u.department,
      semester: u.semester,
      profileImage: u.profileImage,
      membershipStatus: statusByUser.get(String(u._id))?.status || null,
      membershipId: statusByUser.get(String(u._id))?.membershipId || null,
    }));

    res.status(200).json({ results, communityId: myCommunity, communityName: COMMUNITY_NAMES[myCommunity] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * List every membership record for a community (accepted members + pending +
 * rejected requests), populated with the invited user's basic info. The
 * Members Management screen filters to 'accepted'; Member Requests uses the
 * full history.
 *
 * GET /api/community-portal/:communityId/memberships
 * Requires: member of that community (or portal admin).
 */
const getMemberships = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const memberships = await CommunityMembership.find({ communityId })
      .populate('user', 'username email role department semester profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ memberships });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Send a membership request to a user on behalf of the community's account.
 * Duplicates are prevented while a request is pending; accepted users cannot
 * be re-requested. A previously rejected request may be sent again (it is
 * flipped back to pending so the user gets a fresh notification).
 *
 * POST /api/community-portal/:communityId/memberships  { userId }
 * Requires: member of that community (or portal admin).
 */
const sendMembershipRequest = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId } = req.body;

    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const target = await User.findById(userId);
    if (!target || target.status !== 'approved') {
      return res.status(404).json({ message: 'Approved user not found' });
    }
    if (target.portal === DEV_CORPS_PORTAL_ID) {
      return res.status(400).json({ message: 'Community portal accounts cannot be invited' });
    }

    const communityName = COMMUNITY_NAMES[communityId];

    let membership = await CommunityMembership.findOne({ communityId, user: userId });

    if (membership) {
      if (membership.status === 'pending') {
        return res.status(409).json({ message: 'A request is already pending for this user.' });
      }
      if (membership.status === 'accepted') {
        return res.status(409).json({ message: 'This user is already a member of the community.' });
      }

      // Rejected before — re-send and let the user decide again.
      membership.status = 'pending';
      membership.requestedBy = req.user._id;
      await membership.save();
    } else {
      membership = await CommunityMembership.create({
        communityId,
        communityName,
        user: userId,
        status: 'pending',
        requestedBy: req.user._id,
      });
    }

    await createNotification(userId, {
      type: 'community_membership',
      title: `Community membership request from ${communityName}`,
      message: `${communityName} has invited you to join their community. Tap to review the request.`,
      link: 'community-requests',
      meta: {
        membershipId: membership._id,
        communityId,
        communityName,
      },
    });

    // Real-time: pending request count for this community changed.
    await emitMemberCounts();

    res.status(201).json({ membership, message: `Membership request sent to ${target.username}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// User side — incoming requests + approval/rejection
// ──────────────────────────────────────────────────────────────────────────

/**
 * The signed-in user's own membership requests (all statuses). Powers the
 * "Community Requests" page where pending requests are approved/rejected.
 *
 * GET /api/community-portal/my/requests
 * Requires: any authenticated approved user.
 */
const getMyMembershipRequests = async (req, res) => {
  try {
    const requests = await CommunityMembership.find({ user: req.user._id })
      .select('communityId communityName status requestedBy createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * The signed-in user's accepted community memberships (used to build the
 * sidebar's Community section and to verify access to community content).
 *
 * GET /api/community-portal/my/memberships
 * Requires: any authenticated approved user.
 */
const getMyMemberships = async (req, res) => {
  try {
    const memberships = await CommunityMembership.find({
      user: req.user._id,
      status: 'accepted',
    })
      .select('communityId communityName status approvedAt updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({ memberships });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Approve or reject an incoming membership request. Only the recipient user
 * may decide. On accept the User doc gains a permanent communityMembership
 * entry (the sidebar's Community section appears); on reject nothing is
 * added. The community account is notified either way.
 *
 * PATCH /api/community-portal/requests/:membershipId  { action: 'accept' | 'reject' }
 * Requires: any authenticated approved user.
 */
const respondToMembershipRequest = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }

    const membership = await CommunityMembership.findOne({
      _id: membershipId,
      user: req.user._id,
    });

    if (!membership) {
      return res.status(404).json({ message: 'Membership request not found' });
    }
    if (membership.status !== 'pending') {
      return res.status(409).json({ message: `This request has already been ${membership.status}.` });
    }

    if (action === 'accept') {
      membership.status = 'accepted';
      await membership.save();

      await User.updateOne(
        { _id: req.user._id },
        {
          $addToSet: {
            communityMemberships: {
              communityId: membership.communityId,
              communityName: membership.communityName,
              approvedAt: new Date(),
            },
          },
        }
      );
    } else {
      membership.status = 'rejected';
      await membership.save();
    }

    // Real-time: accepted member / pending request counts changed for this
    // community — broadcast fresh values to every connected client (no polling
    // / no page refresh). Counts are recomputed from the DB so they always
    // reflect the true number of memberships — duplicates can never double-count.
    await emitMemberCounts();

    if (membership.requestedBy) {
      await createNotification(membership.requestedBy, {
        type: 'community_membership',
        title: action === 'accept'
          ? `${req.user.username} accepted your membership request`
          : `${req.user.username} declined your membership request`,
        message: action === 'accept'
          ? `${req.user.username} is now a member of ${membership.communityName}.`
          : `${req.user.username} declined the invite to ${membership.communityName}.`,
        link: 'manage-user',
        meta: {
          membershipId: membership._id,
          communityId: membership.communityId,
          communityName: membership.communityName,
        },
      });
    }

    res.status(200).json({
      membership,
      message: action === 'accept'
        ? 'Membership approved. Community section unlocked.'
        : 'Membership request rejected.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Workshops
// ──────────────────────────────────────────────────────────────────────────

/**
 * Whether the requesting user is allowed to read a community's workshops:
 *   - community portal member of that communityId, or the portal admin
 *   - a campus user with an accepted membership in that community
 */
const canAccessCommunity = async (user, communityId) => {
  if (user.portal === DEV_CORPS_PORTAL_ID) {
    if (user.portalRole === 'admin') return true;
    return resolveCommunityIdForUser(user) === communityId;
  }
  const membership = await CommunityMembership.findOne({
    communityId,
    user: user._id,
    status: 'accepted',
  });
  return Boolean(membership);
};

/**
 * List a community's released workshops (newest first).
 *
 * GET /api/community-portal/:communityId/workshops
 * Requires: community owner, portal admin, or an approved member user.
 */
const listWorkshops = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const allowed = await canAccessCommunity(req.user, communityId);
    if (!allowed) {
      return res.status(403).json({
        message: 'You must be an approved community member to view workshops.',
      });
    }

    const workshops = await CommunityWorkshop.find({ communityId }).sort({ createdAt: -1 });
    res.status(200).json({ workshops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Release a new workshop on behalf of the community. Automatically notified
 * to the community's current approved members so they can pick it up in
 * their Community section.
 *
 * POST /api/community-portal/:communityId/workshops
 * Requires: member of that community (or portal admin).
 */
const createWorkshop = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const { title, description, date, time, venue, image, instructor, capacity, duration } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Workshop title is required' });
    }

    const workshop = await CommunityWorkshop.create({
      communityId,
      communityName: COMMUNITY_NAMES[communityId],
      title: String(title).trim(),
      description: String(description || '').trim(),
      date: String(date || '').trim(),
      time: String(time || '').trim(),
      venue: String(venue || '').trim(),
      image: String(image || '').trim(),
      instructor: String(instructor || '').trim(),
      capacity: Number(capacity) || 0,
      duration: String(duration || '').trim(),
      releasedBy: req.user._id,
    });

    // Notify the community's approved members about the release.
    const members = await CommunityMembership.find({
      communityId,
      status: 'accepted',
    }).select('user');
    const memberIds = members.map((m) => m.user);

    if (memberIds.length > 0) {
      await createNotificationForUsers(memberIds, {
        type: 'community_workshop',
        title: `New workshop released by ${COMMUNITY_NAMES[communityId]}`,
        message: `${workshop.title}${workshop.date ? ` · ${workshop.date}` : ''}${workshop.venue ? ` · ${workshop.venue}` : ''}`,
        link: `community-${communityId}`,
        meta: {
          workshopId: workshop._id,
          communityId,
          communityName: COMMUNITY_NAMES[communityId],
        },
      });
    }

    res.status(201).json({ workshop, message: 'Workshop released successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete one of the community's own workshops.
 *
 * DELETE /api/community-portal/:communityId/workshops/:workshopId
 * Requires: member of that community (or portal admin).
 */
const deleteWorkshop = async (req, res) => {
  try {
    const { communityId, workshopId } = req.params;

    const workshop = await CommunityWorkshop.findOne({
      _id: workshopId,
      communityId,
    });
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    await workshop.deleteOne();
    res.status(200).json({ message: 'Workshop deleted', id: workshop._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCommunityMemberCounts,
  getCommunityProfiles,
  updateCommunityProfile,
  searchUsers,
  getMemberships,
  sendMembershipRequest,
  getMyMembershipRequests,
  getMyMemberships,
  respondToMembershipRequest,
  listWorkshops,
  createWorkshop,
  deleteWorkshop,
};