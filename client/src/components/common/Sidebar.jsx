// import React, { useState } from 'react'
// import { useTheme } from '../../context/ThemeContext'
// import { themes } from '../../data/themes';
// import navConfig from '../../data/navConfig'

// const Sidebar = () => {

//     // These are all the use state codes for this section

//     // Themes
//     const {theme, toggleTheme} = useTheme();

//     const t = themes[theme];

//     // Sidebar States

//     const [collapsed, setCollapsed] = useState(false);

//     const [activeId, setActiveId] = useState("dashboard");

//     const [openSubmenus, setOpenSubmenus] = useState({})

//     // Navigation Items

//     const items = navConfig.student;

//   return (

// //  THIS IS THE MAIN DIV

//    <div className={`relative min-h-screen transition-all duration-300 border-r flex flex-col ${
//     collapsed ? "w-20" : "w-64"
//   }`}
//         style={{
//             backgroundColor: t.sidebarBg,
//             borderColor: t.border,
//             color: t.textPrimary,
//         }}
//     >

//         {/* Header Portion starts from here */}


//         <div
//   className={`flex items-center border-b px-4 py-5 ${
//     collapsed ? "justify-center" : "gap-3"
//   }`}
//   style={{ borderColor: t.border }}
// >
//   <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500 text-white font-semibold shrink-0">
//     S
//   </div>

//   {!collapsed && (
//     <div className="flex-1">
//       <p className="text-[10px] uppercase tracking-widest" style={{ color: t.textMuted }}>
//         Student
//       </p>

//       <h2 className="text-sm font-semibold" style={{ color: t.textPrimary }}>
//         Student Portal
//       </h2>
//     </div>
//   )}

//   <button
//   onClick={() => setCollapsed(!collapsed)}
//   className="absolute top-5 right-0 translate-x-1/2 z-50 h-8 w-8 rounded-full border flex items-center justify-center shadow-md"
//   style={{
//     backgroundColor: t.sidebarBg,
//     borderColor: t.border,
//     color: t.textPrimary,
//   }}
// >
//   {collapsed ? ">" : "<"}
// </button>

// </div>

// {/* Upto Here It is The section for the avatar logo and the collapse button section from below we will go downward in sidebar section */}

// {/* Now starts the part for the theme change section  */}

// <div className="px-4 pt-3">
//   <button
//     onClick={toggleTheme}
//     className={`relative h-10 rounded-full transition-all duration-300 ${
//       collapsed ? "w-10" : "w-16"
//     }`}
//     style={{
//       backgroundColor: t.hoverBg,
//     }}
//   >
//     <div
//       className={`absolute top-1 h-8 w-8 rounded-full bg-white flex items-center justify-center transition-all duration-300 ${
//         theme === "dark" ? "left-1" : "left-7"
//       }`}
//     >
//       {theme === "dark" ? "🌙" : "☀️"}
//     </div>
//   </button>
// </div>

// {/* Upto Here it is the section for the theme change portion */}

// {/* Now it is part for the main navigation portion */}


// <div className="flex-1 overflow-y-auto px-3 pt-4">

//   {!collapsed && (
//     <p
//       className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest"
//       style={{ color: t.textMuted }}
//     >
//       Main
//     </p>
//   )}

// {/* Upto here we have completed the upto main text tag here now moving towards the mapping of the navigation items  */}

// {/* 
// Now moving towards the navigation portion of it which uses data from navConfig.js */}


// <div className="flex flex-col gap-1">
//   {items.map((item) => (
//     <button
//       key={item.id}
//       onClick={() => setActiveId(item.id)}
//       className={`flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 ${
//         collapsed ? "justify-center" : "gap-3"
//       }`}
//       style={{
//         backgroundColor:
//           activeId === item.id ? t.activeBg : "transparent",
//         color:
//           activeId === item.id ? t.activeText : t.textPrimary,
//         border:
//           activeId === item.id
//             ? `1px solid ${t.activeBorder}`
//             : "1px solid transparent",
//       }}
//     >
//       {/* Icon */}
//       <item.icon size={19} />

//       {/* Label */}
//       {!collapsed && (
//         <span className="text-sm font-medium">
//           {item.label}
//         </span>
//       )}
//     </button>
//   ))}
//   </div>

// </div>


//     </div>
//   )
// }

// export default Sidebar

import React, { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { themes } from '../../data/themes'
import navConfig from '../../data/navConfig'

// Fixed brand accent — stays constant across light/dark so the "lab" identity
// of the sidebar doesn't disappear when the theme flips. Everything else
// (backgrounds, borders, text) still comes from `t` so the rest of the app's
// theming system keeps working exactly as before.
const ACCENT = '#168899'
const ACCENT_DARK = '#087b89'
const ACCENT_SOFT = '#8bd4df'

// One accent color per nav item, applied in list order (mirrors the flask /
// gear / molecule / document / tube / target colors in the reference). The
// active item always overrides to the teal accent instead.
const ICON_COLORS = ['#178a99', '#4f9d5b', '#7a8085', '#3b7fc4', '#3f74a8', '#8b5fc7', '#1f8a99']

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme()
  const t = themes[theme] || {}

  const [collapsed, setCollapsed] = useState(false)
  const [activeId, setActiveId] = useState('dashboard')
  const [openSubmenus, setOpenSubmenus] = useState({})
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = navConfig.student

  // Responsive behaviour: auto-collapse to icon-only on tablet widths, and
  // treat the sidebar as an off-canvas drawer on phone widths. This never
  // touches App.jsx's layout — the sidebar still just renders as a normal
  // flex child on desktop.
  useEffect(() => {
    const applyResponsiveState = () => {
      const width = window.innerWidth
      if (width < 768) {
        setCollapsed(false)
        setMobileOpen(false)
      } else if (width < 1024) {
        setCollapsed(true)
      }
    }

    applyResponsiveState()
    window.addEventListener('resize', applyResponsiveState)
    return () => window.removeEventListener('resize', applyResponsiveState)
  }, [])

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768

  // The sidebar's palette is intentionally self-contained rather than pulled
  // from `themes.js` — that file's activeBg/hoverBg/etc. values are shared
  // across the whole app and didn't match this design, which is what made
  // the active row and icon boxes look wrong. `theme` (light/dark) still
  // comes from context as before; only the actual color values are fixed
  // here so the sidebar always renders like the reference regardless of
  // what other components need from the shared theme.
  const isDark = theme === 'dark'
  const sidebarBg = isDark ? '#18252a' : '#f5f5f1'
  const borderColor = isDark ? '#31454a' : '#d7d7d0'
  const textPrimary = isDark ? '#f5f5f1' : '#111820'
  const activeBg = isDark ? '#1b3940' : '#e7f2f3'
  const activeText = ACCENT_DARK
  const activeBorder = ACCENT
  const hoverBg = isDark ? '#253338' : '#eeeeea'

  return (
    <>
      {/* Mobile trigger — only rendered as an off-canvas handle on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm md:hidden"
        style={{
          backgroundColor: sidebarBg,
          borderColor: ACCENT,
          color: ACCENT_DARK,
          display: mobileOpen ? 'none' : undefined,
        }}
      >
        ☰
      </button>

      {/* Backdrop for the mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div
        className={`
          flex min-h-screen flex-col border-r transition-all duration-300
          fixed inset-y-0 left-0 z-40 md:static md:z-auto
          ${collapsed ? 'w-20' : 'w-[276px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          backgroundColor: sidebarBg,
          borderColor: borderColor,
          color: textPrimary,
        }}
      >
        {/* Close handle for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 text-base font-bold md:hidden"
          style={{ borderColor: ACCENT, color: ACCENT_DARK }}
        >
          ✕
        </button>

        {/* Profile */}
        <div
          className={`relative flex shrink-0 items-center border-b px-5 pb-4 pt-7 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          style={{ borderColor }}
        >
          <div
            className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
            style={{ backgroundColor: ACCENT_SOFT, borderColor: ACCENT }}
          >
            {/* Original mascot illustration — a friendly "lab kid" avatar drawn
                from scratch for this app, not a reproduction of any existing
                character/IP. */}
            <svg viewBox="0 0 64 64" className="h-full w-full">
              <circle cx="32" cy="32" r="32" fill="#bfe9ee" />
              {/* neck + collar */}
              <path d="M20 58 Q32 46 44 58 L44 64 L20 64 Z" fill="#ffffff" />
              {/* head */}
              <circle cx="32" cy="30" r="15" fill="#ffd8ae" />
              {/* hair */}
              <path
                d="M17 26 Q16 10 32 10 Q48 10 47 26 Q44 18 38 20 Q34 14 28 20 Q22 17 20 24 Z"
                fill="#7c4fd1"
              />
              {/* glasses */}
              <rect x="18" y="27" width="12" height="9" rx="4" fill="#ffffff" stroke="#172329" strokeWidth="2" />
              <rect x="34" y="27" width="12" height="9" rx="4" fill="#ffffff" stroke="#172329" strokeWidth="2" />
              <line x1="30" y1="31" x2="34" y2="31" stroke="#172329" strokeWidth="2" />
              <circle cx="24" cy="31.5" r="2.4" fill="#172329" />
              <circle cx="40" cy="31.5" r="2.4" fill="#172329" />
              {/* smile */}
              <path d="M26 40 Q32 45 38 40" stroke="#a8633f" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: ACCENT_DARK }}
              >
                Student
              </p>

              <h2
                className="truncate text-[15px] font-black tracking-tight"
                style={{ color: textPrimary }}
              >
                Student Portal
              </h2>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-xl font-bold shadow-md transition-transform hover:scale-105 md:flex"
            style={{ borderColor: ACCENT, color: ACCENT_DARK }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Theme switch */}
        <div className={`shrink-0 px-5 pt-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`relative h-8 rounded-full border ${collapsed ? 'w-9' : 'w-[58px]'}`}
            style={{ backgroundColor: ACCENT, borderColor: ACCENT_DARK }}
          >
            {!collapsed && (
              <>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">☀</span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">☾</span>
              </>
            )}

            <div
              className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-all ${
                theme === 'dark' ? 'left-1' : 'right-1'
              }`}
            >
              {theme === 'dark' ? '☾' : '☀'}
            </div>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2 px-2">
              <span className="h-[2px] w-5" style={{ backgroundColor: ACCENT }} />
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: ACCENT_DARK }}
              >
                Main
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {items.map((item, index) => {
              const isActive = activeId === item.id
              const iconColor = ICON_COLORS[index % ICON_COLORS.length]

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveId(item.id)
                    if (isMobile) setMobileOpen(false)
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-lg border px-2.5 py-2 transition-all duration-200 ${
                    collapsed ? 'justify-center' : 'gap-3'
                  }`}
                  style={{
                    backgroundColor: isActive ? activeBg : 'transparent',
                    borderColor: isActive ? activeBorder : 'transparent',
                    color: isActive ? activeText : textPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = hoverBg
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {isActive ? (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                      style={{ backgroundColor: '#d5edf0', borderColor: '#73bfc8' }}
                    >
                      <item.icon size={17} strokeWidth={2.5} color={ACCENT_DARK} />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                      <item.icon size={19} strokeWidth={2} color={iconColor} />
                    </span>
                  )}

                  {!collapsed && (
                    <span className="flex-1 truncate text-left text-[13px] font-bold">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && isActive && (
                    <span className="text-base leading-none opacity-60">›</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lab illustration */}
        {!collapsed && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24">
            <div
              className="absolute bottom-0 left-0 right-0 h-12"
              style={{
                background:
                  theme === 'dark'
                    ? 'linear-gradient(to top, #15282d, transparent)'
                    : 'linear-gradient(to top, #cddfe1, transparent)',
              }}
            />

            <div className="absolute bottom-1 left-4 flex items-end gap-1.5">
              <div
                className="h-10 w-7 rounded-b-[14px] rounded-t-md border-2"
                style={{ borderColor: ACCENT, background: '#7250a8' }}
              />
              <div
                className="h-7 w-6 rounded-b-lg rounded-t-md border-2"
                style={{ borderColor: ACCENT, background: '#38a9b8' }}
              />
              <div
                className="relative h-14 w-8 rounded-b-[16px] rounded-t-md border-2"
                style={{ borderColor: ACCENT, background: '#6bbf76' }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 h-6 rounded-b-[14px]"
                  style={{ backgroundColor: '#36a4b1' }}
                />
              </div>
              <div
                className="h-9 w-6 rounded-b-lg rounded-t-md border-2"
                style={{ borderColor: ACCENT, background: '#7050a3' }}
              />
              <div
                className="h-16 w-8 rounded-b-[16px] rounded-t-md border-2"
                style={{ borderColor: ACCENT, background: '#6d62c5' }}
              />
            </div>

            <div className="absolute bottom-10 right-5 flex flex-col gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#7bb8d0]" />
              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-[#8ec4d4]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#7bb8d0]" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar