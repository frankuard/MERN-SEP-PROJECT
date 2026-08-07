import React, { useState } from 'react'
import { useTheme } from './context/ThemeContext'
import { themes } from './data/themes';
import Sidebar from './components/common/Sidebar';


const App = () => {

  const {theme, toggleTheme} = useTheme();

 const t = themes[theme];

 console.log(theme);
  return (
    

    <div style={{
        backgroundColor: t.pageBg,
        color: t.textPrimary,
        minHeight: "100vh",
        padding: "20px",
      }}>

        <Sidebar />
    </div>
  )
}

export default App