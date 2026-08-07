import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { themes } from '../../data/themes';
import navConfig from '../../data/navConfig'

const Sidebar = () => {

    // These are all the use state codes for this section

    // Themes
    const {theme, toggleTheme} = useTheme();

    const t = themes[theme];

    // Sidebar States

    const [collapsed, setCollapsed] = useState(false);

    const [activeId, setActiveId] = useState("dashboard");

    const [openSubmenus, setOpenSubmenus] = useState({})

    // Navigation Items

    const items = navConfig.student;

  return (

//  THIS IS THE MAIN DIV

   <div className={`relative min-h-screen transition-all duration-300 border-r flex flex-col ${
    collapsed ? "w-20" : "w-64"
  }`}
        style={{
            backgroundColor: t.sidebarBg,
            borderColor: t.border,
            color: t.textPrimary,
        }}
    >

        {/* Header Portion starts from here */}


        <div
  className={`flex items-center border-b px-4 py-5 ${
    collapsed ? "justify-center" : "gap-3"
  }`}
  style={{ borderColor: t.border }}
>
  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500 text-white font-semibold shrink-0">
    S
  </div>

  {!collapsed && (
    <div className="flex-1">
      <p className="text-[10px] uppercase tracking-widest" style={{ color: t.textMuted }}>
        Student
      </p>

      <h2 className="text-sm font-semibold" style={{ color: t.textPrimary }}>
        Student Portal
      </h2>
    </div>
  )}

  <button
  onClick={() => setCollapsed(!collapsed)}
  className="absolute top-5 right-0 translate-x-1/2 z-50 h-8 w-8 rounded-full border flex items-center justify-center shadow-md"
  style={{
    backgroundColor: t.sidebarBg,
    borderColor: t.border,
    color: t.textPrimary,
  }}
>
  {collapsed ? ">" : "<"}
</button>

</div>

{/* Upto Here It is The section for the avatar logo and the collapse button section from below we will go downward in sidebar section */}

{/* Now starts the part for the theme change section  */}

<div className="px-4 pt-3">
  <button
    onClick={toggleTheme}
    className={`relative h-10 rounded-full transition-all duration-300 ${
      collapsed ? "w-10" : "w-16"
    }`}
    style={{
      backgroundColor: t.hoverBg,
    }}
  >
    <div
      className={`absolute top-1 h-8 w-8 rounded-full bg-white flex items-center justify-center transition-all duration-300 ${
        theme === "dark" ? "left-1" : "left-7"
      }`}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </div>
  </button>
</div>

{/* Upto Here it is the section for the theme change portion */}

{/* Now it is part for the main navigation portion */}


<div className="flex-1 overflow-y-auto px-3 pt-4">

  {!collapsed && (
    <p
      className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: t.textMuted }}
    >
      Main
    </p>
  )}

{/* Upto here we have completed the upto main text tag here now moving towards the mapping of the navigation items  */}

{/* 
Now moving towards the navigation portion of it which uses data from navConfig.js */}


<div className="flex flex-col gap-1">
  {items.map((item) => (
    <button
      key={item.id}
      onClick={() => setActiveId(item.id)}
      className={`flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 ${
        collapsed ? "justify-center" : "gap-3"
      }`}
      style={{
        backgroundColor:
          activeId === item.id ? t.activeBg : "transparent",
        color:
          activeId === item.id ? t.activeText : t.textPrimary,
        border:
          activeId === item.id
            ? `1px solid ${t.activeBorder}`
            : "1px solid transparent",
      }}
    >
      {/* Icon */}
      <item.icon size={19} />

      {/* Label */}
      {!collapsed && (
        <span className="text-sm font-medium">
          {item.label}
        </span>
      )}
    </button>
  ))}
  </div>

</div>


    </div>
  )
}

export default Sidebar