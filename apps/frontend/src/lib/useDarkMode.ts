import { useState, useCallback } from 'react';

/**
 * Shared dark mode hook — single source of truth for theme state.
 * Reads initial value from classList (set by localStorage on page load).
 */
export function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return [dark, toggle];
}
