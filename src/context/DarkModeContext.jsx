import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext(null);

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('mik_dark') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', dark);
    localStorage.setItem('mik_dark', dark ? '1' : '0');
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDarkMode = () => useContext(DarkModeContext);
