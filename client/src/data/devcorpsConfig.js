export const DEV_CORPS_PORTAL_ID = 'devcorpsCommunity';
export const DEV_CORPS_PORTAL_NAME = 'DevCorps Community Portal';

// The five member communities of the DevCorps Community Portal. Used by the
// sidebar's "Communities" expandable menu and the DevCorps Communities view.
export const DEV_CORPS_COMMUNITIES = [
  { id: 'ai-horizon', name: 'AI Horizon' },
  { id: 'devsphere', name: 'DevSphere' },
  { id: 'bic-converge', name: 'BIC Converge' },
  { id: 'lenspire', name: 'Lenspire' },
  { id: 'incognitous', name: 'Incognitous' },
];

// Sidebar nav id for a community (e.g. 'community-ai-horizon').
export const communityNavId = (community) => `community-${community.id}`;

// Reverse lookup: nav id -> community object (undefined if not a community).
export const communityByNavId = (navId) =>
  DEV_CORPS_COMMUNITIES.find((c) => communityNavId(c) === navId);

const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Maps a DevCorps member account to its specific community by matching the
// account's email/username against each community's name (e.g.
// 'ai.horizon@bicnepal.edu.np' -> AI Horizon). Returns the community object,
// or null for the DevCorps admin (portalRole 'admin') and unresolved accounts.
export const communityByAccount = (user = {}) => {
  if (user.portalRole !== 'member') return null;
  const haystacks = [user.email, user.username].filter(Boolean).map(normalizeKey);
  return DEV_CORPS_COMMUNITIES.find((c) => {
    const key = normalizeKey(c.id);
    return haystacks.some((haystack) => haystack.includes(key));
  }) || null;
};