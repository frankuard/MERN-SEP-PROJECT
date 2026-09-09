const CommunityConstitution = require('../models/CommunityConstitution');
const CommunityMembership = require('../models/CommunityMembership');
const { getImageKit, isImageKitConfigured } = require('../config/imagekit');
const { emitToAll } = require('../utils/socketEmitter');
const {
  DEV_CORPS_PORTAL_ID,
  resolveCommunityIdForUser,
} = require('../middleware/devcorpsMiddleware');

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

/**
 * Whether the requesting user may READ a community's constitution:
 *   - DevCorps portal admin: every community
 *   - DevCorps member account: only its own resolved community
 *   - campus user (student/teacher): only communities where they have an
 *     accepted membership
 */
const canAccessConstitution = async (user, communityId) => {
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

// GET /api/devcorps/constitutions — every community's constitution
// Requires: DevCorps portal admin (used by the Communities overview).
const listConstitutions = async (req, res) => {
  try {
    const constitutions = await CommunityConstitution.find({
      communityId: { $in: Object.keys(COMMUNITY_NAMES) },
    })
      .sort({ updatedAt: -1 })
      .select('-__v');
    res.status(200).json({ constitutions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/devcorps/constitution/:communityId — the owning community account
// (or the portal admin, or a member via the community-portal route) reads it.
// Requires: devcorpsMemberScope (filters to the caller's own community).
const getConstitution = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    const constitution = await CommunityConstitution.findOne({ communityId }).select('-__v');
    if (!constitution) {
      return res.status(404).json({ message: 'No constitution uploaded yet' });
    }
    res.status(200).json({ constitution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/community-portal/:communityId/constitution — read-only access for
// the community's approved members (student/teacher panels), plus the owning
// community account and the portal admin.
// Requires: any authenticated approved user (membership checked inside).
const getMemberConstitution = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Invalid community id' });
    }

    const allowed = await canAccessConstitution(req.user, communityId);
    if (!allowed) {
      return res.status(403).json({
        message: 'You must be an approved community member to view this constitution.',
      });
    }

    const constitution = await CommunityConstitution.findOne({ communityId }).select('-__v');
    if (!constitution) {
      return res.status(404).json({ message: 'No constitution uploaded yet' });
    }
    res.status(200).json({ constitution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/devcorps/constitution/:communityId (multipart, field: 'file')
// Uploads the community's constitution the first time, or REPLACES it with a
// new copy (old file removed from ImageKit, version incremented). Works for
// the owning community account and the portal admin.
const upsertConstitution = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!isImageKitConfigured()) {
      return res.status(503).json({
        message: 'Upload is not configured. Add ImageKit environment variables.',
      });
    }

    const existing = await CommunityConstitution.findOne({ communityId });

    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: `/devcorps-constitution/${communityId}`,
    });

    // Keep exactly one live file per community — drop the previous copy so
    // the storage folder never accumulates replaced constitutions.
    if (existing && existing.fileId) {
      try {
        await imagekit.deleteFile(existing.fileId);
      } catch (err) {
        console.error('ImageKit delete failed (non-fatal):', err.message);
      }
    }

    const constitution = await CommunityConstitution.findOneAndUpdate(
      { communityId },
      {
        $set: {
          communityId,
          communityName: COMMUNITY_NAMES[communityId],
          fileName: req.file.originalname,
          url: result.url,
          fileId: result.fileId || '',
          size: req.file.size,
          mimetype: req.file.mimetype,
          updatedBy: req.user._id,
        },
        $setOnInsert: {
          uploadedBy: req.user._id,
          version: 1,
        },
        ...(existing ? { $inc: { version: 1 } } : {}),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select('-__v');

    await emitToAll('community:constitution', { communityId, constitution });

    res.status(200).json({
      constitution,
      message: existing ? 'Constitution replaced' : 'Constitution uploaded',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/devcorps/constitution/:communityId
// Removes the community's constitution from storage and the database.
const deleteConstitution = async (req, res) => {
  try {
    const { communityId } = req.params;
    if (!isValidCommunityId(communityId)) {
      return res.status(400).json({ message: 'Unknown community' });
    }

    const constitution = await CommunityConstitution.findOne({ communityId });
    if (!constitution) {
      return res.status(404).json({ message: 'No constitution uploaded yet' });
    }

    if (constitution.fileId && isImageKitConfigured()) {
      try {
        await getImageKit().deleteFile(constitution.fileId);
      } catch (err) {
        console.error('ImageKit delete failed (non-fatal):', err.message);
      }
    }

    await constitution.deleteOne();
    await emitToAll('community:constitution', { communityId, constitution: null });

    res.status(200).json({ message: 'Constitution deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listConstitutions,
  getConstitution,
  getMemberConstitution,
  upsertConstitution,
  deleteConstitution,
};