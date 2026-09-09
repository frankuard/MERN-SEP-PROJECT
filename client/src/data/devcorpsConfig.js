export const DEV_CORPS_PORTAL_ID = 'devcorpsCommunity';
export const DEV_CORPS_PORTAL_NAME = 'DevCorps Community Portal';

// The five member communities of the DevCorps Community Portal. Used by the
// sidebar's "Communities" expandable menu, the DevCorps Communities view, and
// the Manage User / Workshop Release flows.
//
// `logo` uses the community's actual stored logo where one exists in the
// project (the ImageKit organizer logo already attached to that community's
// events). Communities without a stored logo intentionally fall back to the
// letter-tile avatar — no generic icons are substituted for real ones.
//
// About Community content is NOT duplicated here: it lives in the shared
// CommunityProfile collection (server), which BOTH the Managed Users About
// screen and the DevCorps Communities dropdowns read — so edits made in
// Managed Users show up everywhere automatically.
export const DEV_CORPS_COMMUNITIES = [
  {
    id: 'ai-horizon',
    name: 'AI Horizon',
    logo: 'https://ik.imagekit.io/ltf9bjszh/logos/bicaihorizon.jpg',
  },
  {
    id: 'devsphere',
    name: 'DevSphere',
    logo: '',
  },
  {
    id: 'bic-converge',
    name: 'BIC Converge',
    logo: '',
  },
  {
    id: 'lenspire',
    name: 'Lenspire',
    logo: '',
  },
  {
    id: 'incognitous',
    name: 'Incognitous',
    logo: '',
  },
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