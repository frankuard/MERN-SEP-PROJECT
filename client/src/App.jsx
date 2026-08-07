import React, { useState } from 'react'
import { useTheme } from './context/ThemeContext'
import { themes } from './data/themes';


const App = () => {

  const {theme, toggleTheme} = useTheme();

 const t = themes[theme];

  return (

    <div style={{
        backgroundColor: t.pageBg,
        color: t.textPrimary,
        minHeight: "100vh",
        padding: "20px",
      }}>
      <h1> 
        Current Theme: {theme} 
      </h1>

      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  )
}

export default App