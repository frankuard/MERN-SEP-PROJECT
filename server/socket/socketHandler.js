const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { Server } = require('socket.io');
const User = require('../models/User');

let io = null;

// Reads the JWT the same way authMiddleware.js does for regular HTTP
// requests — except there's no req.cookies here (that's an Express-only
// convenience added by cookie-parser), so we parse the raw Cookie header
// off the socket handshake ourselves.
const authenticateSocket = async (socket, next) => {
  try {
    const rawCookieHeader = socket.handshake.headers.cookie;
    if (!rawCookieHeader) return next(new Error('No auth cookie'));

    const parsed = cookie.parse(rawCookieHeader);
    const token = parsed.token;
    if (!token) return next(new Error('No auth cookie'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.status === 'pending' || user.status === 'rejected') {
      return next(new Error('Unauthorized'));
    }

    // Stash the authenticated user on the socket so every event handler
    // below can trust socket.user instead of re-verifying anything.
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
};

const init = (server, corsOriginCheck) => {
  io = new Server(server, {
    cors: {
      origin: corsOriginCheck || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Personal room — this is what createNotification.js's emitToUser()
    // already targets via io.to(userId).emit(...), so notifications go
    // real-time the moment this connects, no other change needed there.
    socket.join(userId);

    // ---- Chat: join/leave a specific conversation's room ----
    // The frontend calls these when opening/closing a chat thread, so
    // 'message:new' below only reaches people actually looking at that
    // conversation right now (everyone else still gets it via their
    // personal room / notification badge instead).
    socket.on('conversation:join', (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      // Nothing to clean up manually — socket.io removes the socket from
      // all rooms automatically on disconnect.
    });
  });
};

const getIO = () => io;

module.exports = { init, getIO };