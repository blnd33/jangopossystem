import { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, saveTheme } from '../data/store';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#1a1d21' : '#F4F5F6';
  }, [theme]);

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    saveTheme(newTheme);
    setTheme(newTheme);
  }

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}