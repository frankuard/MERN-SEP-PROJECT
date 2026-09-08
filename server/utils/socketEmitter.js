// Shared Socket.IO broadcast helper. Lazily requires socketHandler so this
// module can be imported by controllers without creating a circular
// dependency (same pattern as createNotification.js).
let getIO = null;
try {
  const socketHandler = require('../socket/socketHandler');
  if (typeof socketHandler.getIO === 'function') {
    getIO = socketHandler.getIO;
  }
} catch (err) {
  // Socket layer unavailable — broadcast is silently disabled.
}

const emitToAll = (event, payload) => {
  if (!getIO) return;
  try {
    const io = getIO();
    if (io) io.emit(event, payload);
  } catch (err) {
    console.error('Failed to emit real-time event (non-fatal):', err.message);
  }
};

module.exports = { emitToAll };