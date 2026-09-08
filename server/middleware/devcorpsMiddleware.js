const DEV_CORPS_PORTAL_ID = 'devcorpsCommunity';

/**
 * Restricts a route to users whose account is a member of the DevCorps
 * Community Portal (User.portal === 'devcorpsCommunity').
 *
 * Authorization is enforced here on the backend — the frontend routing is
 * only a convenience layer on top of this, never the authority.
 *
 * Must run after authMiddleware (so req.user exists).
 */
const devcorpsMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.portal !== DEV_CORPS_PORTAL_ID) {
    return res.status(403).json({
      message: 'Access forbidden: DevCorps Community Portal only',
    });
  }

  next();
};

/**
 * Restricts a route to DevCorps Community Portal members (User.portalRole
 * === 'member' — the five member communities: AI Horizon, DevSphere, BIC
 * Converge, Lenspire, Incognitous). These are the communities that submit
 * event requests. The DevCorps admin (portalRole 'admin') is excluded, and
 * every other account is blocked.
 *
 * Must run after authMiddleware (so req.user exists).
 */
const communityMemberMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (
    req.user.portal === DEV_CORPS_PORTAL_ID &&
    req.user.portalRole === 'member'
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'Access forbidden: community member accounts only',
  });
};

/**
 * Restricts a route to the DevCorps Community Portal admin (User.portalRole
 * === 'admin'). This is the single account (devcorps BIC) allowed to review
 * and approve community event requests. Every other account is blocked.
 *
 * Must run after authMiddleware (so req.user exists).
 */
const devcorpsAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (
    req.user.portal === DEV_CORPS_PORTAL_ID &&
    req.user.portalRole === 'admin'
  ) {
    return next();
  }

  return res.status(403).json({
    message: 'Access forbidden: DevCorps admin only',
  });
};

/**
 * Lets a shared campus resource (e.g. events) be managed by either the
 * standard campus roles OR a DevCorps portal admin (User.portalRole ===
 * 'admin'). Regular DevCorps members and every other account are blocked,
 * so moderation powers stay exclusive to DevCorps.
 *
 * Must run after authMiddleware (so req.user exists).
 */
const roleOrDevcorpsAdmin = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    if (req.user.portal === DEV_CORPS_PORTAL_ID && req.user.portalRole === 'admin') {
      return next();
    }

    return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
  };
};

// The five member communities. IDs must match the client-side
// DEV_CORPS_COMMUNITIES identifiers exactly.
const COMMUNITY_IDS = [
  'ai-horizon',
  'devsphere',
  'bic-converge',
  'lenspire',
  'incognitous',
];

const normalizeKey = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Resolves which community a DevCorps portal account belongs to, matched
 * against the account's email/username (community membership isn't stored
 * on the User doc — only portal/portalRole). Returns the canonical
 * community id, or null for the DevCorps admin (portalRole 'admin') and any
 * unresolved account.
 */
const resolveCommunityIdForUser = (user = {}) => {
  if (
    !user ||
    user.portal !== DEV_CORPS_PORTAL_ID ||
    user.portalRole !== 'member'
  ) {
    return null;
  }
  const haystacks = [user.email, user.username]
    .filter(Boolean)
    .map(normalizeKey);
  return (
    COMMUNITY_IDS.find((id) => {
      const key = normalizeKey(id);
      return haystacks.some((haystack) => haystack.includes(key));
    }) || null
  );
};

/**
 * Restricts a per-community resource (identified by req.params.communityId)
 * to either the DevCorps admin (portalRole 'admin' — full access to every
 * community) or a community member whose own resolved community matches the
 * requested id. Members can never read another community's board/files.
 *
 * Must run after authMiddleware (so req.user exists).
 */
const devcorpsMemberScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.portalRole === 'admin') {
    return next();
  }

  if (req.user.portal !== DEV_CORPS_PORTAL_ID) {
    return res.status(403).json({
      message: 'Access forbidden: DevCorps Community Portal only',
    });
  }

  const myCommunity = resolveCommunityIdForUser(req.user);
  if (!myCommunity || myCommunity !== req.params.communityId) {
    return res.status(403).json({
      message: 'Access forbidden: this documentation belongs to another community',
    });
  }

  next();
};

module.exports = devcorpsMiddleware;
module.exports.DEV_CORPS_PORTAL_ID = DEV_CORPS_PORTAL_ID;
module.exports.roleOrDevcorpsAdmin = roleOrDevcorpsAdmin;
module.exports.communityMemberMiddleware = communityMemberMiddleware;
module.exports.devcorpsAdminMiddleware = devcorpsAdminMiddleware;
module.exports.devcorpsMemberScope = devcorpsMemberScope;
module.exports.resolveCommunityIdForUser = resolveCommunityIdForUser;