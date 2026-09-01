import React from 'react';

/**
 * Tight head-only crop of DashboardMascot — used as a small circular
 * "chat head" avatar (like a messaging app profile picture), reusing the
 * exact same face/hair/eyes/smile paths so it's recognizably the same
 * character, just cropped instead of redrawn.
 */
const DashboardMascotFace = ({ className = '' }) => (
  <svg
    viewBox="46 30 68 76"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block', width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    <circle cx="80" cy="72" r="36" fill="#fcd9b6" />
    <path
      d="M44 66 Q46 34 80 30 Q114 34 116 66
         Q109 52 104 56 Q98 48 92 56 Q86 48 80 56 Q74 48 68 56 Q62 48 56 56
         Q51 52 44 66 Z"
      fill="#1e293b"
    />
    <circle cx="68" cy="74" r="5" fill="#1e293b" />
    <circle cx="92" cy="74" r="5" fill="#1e293b" />
    <circle cx="70" cy="72" r="1.5" fill="#fff" />
    <circle cx="94" cy="72" r="1.5" fill="#fff" />
    <path d="M68 86 Q80 96 92 86" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export default DashboardMascotFace;