// Dynamic CORS origin check — accepts localhost and any private-network IP
// (192.168.x.x, 10.x.x.x, 172.16-31.x.x) on any port, instead of a hardcoded
// list of specific IP:port combos that breaks every time the network changes.
// Shared between Express's cors() and socket.io's CORS config so both stay
// in sync automatically.
const isAllowedOrigin = (origin) => {
  // No origin header — same-origin requests, curl, Postman, etc. Allow.
  if (!origin) return true;

  try {
    const { hostname } = new URL(origin);

    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    // Private IP ranges (RFC 1918) — covers any device on the same LAN
    // regardless of which specific IP it's been assigned this session.
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

    // 100.64.0.0/10 — CGNAT range, also used by Tailscale VPN. Covers
    // 100.64.x.x through 100.127.x.x.
    if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

    return false;
  } catch (err) {
    return false;
  }
};

// Express cors() middleware expects (origin, callback)
const corsOriginCheck = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};

module.exports = { isAllowedOrigin, corsOriginCheck };