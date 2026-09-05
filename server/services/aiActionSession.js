// In-memory, single-user action session store for the AI action pipeline.
// One active draft per user until it is confirmed, cancelled, or times out.
// Kept server-side so the student never has to pass their own identity or
// a forged payload around — the backend always resolves the real req.user.

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const sessions = new Map();

const getSession = (userId) => {
  const key = String(userId);
  const session = sessions.get(key);
  if (!session) return null;
  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    sessions.delete(key);
    return null;
  }
  return session;
};

const setSession = (userId, session) => {
  const key = String(userId);
  sessions.set(key, { ...session, updatedAt: Date.now() });
  return sessions.get(key);
};

const clearSession = (userId) => {
  sessions.delete(String(userId));
};

const hasSession = (userId) => Boolean(getSession(userId));

// Opportunistic cleanup so idle sessions don't pile up forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(key);
  }
}, SESSION_TTL_MS);

module.exports = { getSession, setSession, clearSession, hasSession };