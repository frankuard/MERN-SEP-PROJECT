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

module.exports = devcorpsMiddleware;
module.exports.DEV_CORPS_PORTAL_ID = DEV_CORPS_PORTAL_ID;