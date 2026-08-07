import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { themes } from '../../data/themes';


const Sidebar = () => {

    // These are all the use state codes for this section

    // Themes
    const {theme, toggleTheme} = useTheme();

    const t = themes[theme];

    // Sidebar States

    const [collapsed, setCollapsed] = useState(false);

    const [activeId, setActiveId] = useState("dashboard");

    const [openSubmenus, setOpenSubmenus] = useState({})



  return (

//  THIS IS THE MAIN DIV

   <div className={`relative h-screen transition-all duration-300 border-r flex flex-col ${
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


    </div>
  )
}

export default Sidebar