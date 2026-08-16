const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // Safety check — roleMiddleware should never run without authMiddleware first
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
    }

    next();
  };
};

module.exports = roleMiddleware;