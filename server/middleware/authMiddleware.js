const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary: Extract token from secure HttpOnly cookies
    if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.token || req.cookies.jwt;
    }

    // 2. Secondary fallback: Extract from Authorization Bearer header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No session token provided.' });
    }

    // Support dev demo token seamlessly by mapping to a real MongoDB user record
    if (token.startsWith('dev-token-')) {
      let demoUser = await User.findOne({ email: 'demo@campusconnect.local' });
      if (!demoUser) {
        try {
          demoUser = await User.create({
            username: 'Demo Student',
            email: 'demo@campusconnect.local',
            password: '$2a$10$demoHashedPasswordPlaceHolderString',
            role: 'student',
            status: 'approved',
            department: 'Computer Science',
            semester: 'Level 4',
          });
        } catch {
          demoUser = await User.findOne({ email: 'demo@campusconnect.local' });
        }
      }

      if (demoUser) {
        req.user = demoUser;
        return next();
      }
    }

    // 3. Verify JWT signature cryptographically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Verify user identity against fresh database record (prevents privilege escalation)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User account not found or deactivated' });
    }

    // 5. Enforce account approval status
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Account is pending administrator approval' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Account request was rejected' });
    }

    // 6. Attach fresh, verified user record to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token' });
  }
};

module.exports = authMiddleware;