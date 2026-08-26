const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Same verification as authMiddleware, but never blocks the request.
// If there's no token, or it's invalid/expired, req.user is just left
// undefined and the request continues — used on routes that must stay
// public for logged-out users but still want to know who's logged in.
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.status !== 'pending' && user.status !== 'rejected') {
      req.user = user;
    }

    next();
  } catch (error) {
    // Invalid/expired token on a public route — just proceed as a guest.
    next();
  }
};

module.exports = optionalAuthMiddleware;