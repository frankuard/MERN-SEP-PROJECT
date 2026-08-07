import React, { useState } from 'react'
import { useTheme } from './context/ThemeContext'
import { themes } from './data/themes';
import Sidebar from './components/common/Sidebar';


const App = () => {

  const {theme, toggleTheme} = useTheme();

 const t = themes[theme];

 console.log(theme);
  return (
    

    <div  className="flex min-h-screen w-full"
  style={{ backgroundColor: t.pageBg }}
>
        <Sidebar />

    </div>
  )
}

export default App