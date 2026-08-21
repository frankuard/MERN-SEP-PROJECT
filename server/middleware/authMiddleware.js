const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User account not found.',
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Account is pending administrator approval.',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Account request was rejected.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired session.',
    });
  }
};

module.exports = authMiddleware;