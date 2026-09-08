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

module.exports = devcorpsMiddleware;
module.exports.DEV_CORPS_PORTAL_ID = DEV_CORPS_PORTAL_ID;
module.exports.roleOrDevcorpsAdmin = roleOrDevcorpsAdmin;