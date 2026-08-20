const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check header exists and uses Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
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
        req.user = {
          userId: demoUser._id.toString(),
          role: demoUser.role,
          username: demoUser.username,
          email: demoUser.email,
        };
        return next();
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;