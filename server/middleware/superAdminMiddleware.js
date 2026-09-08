const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin' || req.user.adminSection !== 'super') {
    return res.status(403).json({ message: 'Access forbidden: super admin only' });
  }

  next();
};

module.exports = superAdminOnly;