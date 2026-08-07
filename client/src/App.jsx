import React from 'react'
import { useTheme } from './context/ThemeContext'


const App = () => {

  const {theme} = useTheme();

  console.log(theme);
  return (
    <div>App</div>
  )
}

export default App