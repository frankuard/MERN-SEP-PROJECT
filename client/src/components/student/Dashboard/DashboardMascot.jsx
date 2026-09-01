import React from 'react';

/** Friendly flat cartoon student mascot for dashboard hero */
const DashboardMascot = ({ className = '' }) => (
  <svg
    viewBox="0 0 160 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* shadow */}
    <ellipse cx="80" cy="168" rx="42" ry="8" fill="#000" opacity="0.12" />
    {/* body */}
    <rect x="48" y="98" width="64" height="58" rx="20" fill="#ffffff" />
    <rect x="56" y="106" width="48" height="36" rx="12" fill="#dbeafe" />
    {/* backpack */}
    <rect x="38" y="108" width="18" height="36" rx="8" fill="#fbbf24" />
    <rect x="42" y="114" width="10" height="8" rx="3" fill="#f59e0b" />
    {/* head */}
    <circle cx="80" cy="72" r="36" fill="#fcd9b6" />
    {/* hair — normal short boy haircut, cap shape with a light textured fringe */}
    <path
      d="M44 66 Q46 34 80 30 Q114 34 116 66
         Q109 52 104 56 Q98 48 92 56 Q86 48 80 56 Q74 48 68 56 Q62 48 56 56
         Q51 52 44 66 Z"
      fill="#1e293b"
    />
    {/* eyes */}
    <circle cx="68" cy="74" r="5" fill="#1e293b" />
    <circle cx="92" cy="74" r="5" fill="#1e293b" />
    <circle cx="70" cy="72" r="1.5" fill="#fff" />
    <circle cx="94" cy="72" r="1.5" fill="#fff" />
    {/* smile */}
    <path d="M68 86 Q80 96 92 86" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* arms */}
    <rect x="28" y="104" width="18" height="10" rx="5" fill="#fcd9b6" transform="rotate(-20 37 109)" />
    <rect x="114" y="104" width="18" height="10" rx="5" fill="#fcd9b6" transform="rotate(20 123 109)" />
    {/* book */}
    <rect x="118" y="98" width="22" height="16" rx="4" fill="#2563eb" />
    <rect x="122" y="102" width="14" height="2" rx="1" fill="#93c5fd" />
    {/* legs */}
    <rect x="58" y="152" width="16" height="18" rx="8" fill="#1e40af" />
    <rect x="86" y="152" width="16" height="18" rx="8" fill="#1e40af" />
    {/* shoes */}
    <ellipse cx="66" cy="170" rx="12" ry="6" fill="#ffffff" />
    <ellipse cx="94" cy="170" rx="12" ry="6" fill="#ffffff" />
    {/* wave sparkle */}
    <circle cx="130" cy="58" r="6" fill="#fbbf24" opacity="0.9" />
    <circle cx="138" cy="70" r="4" fill="#f472b6" opacity="0.8" />
    <circle cx="24" cy="62" r="5" fill="#38bdf8" opacity="0.8" />
  </svg>
);

export default DashboardMascot;
