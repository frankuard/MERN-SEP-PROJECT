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