'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Update actual theme based on theme setting
  const updateActualTheme = useCallback((newTheme: Theme) => {
    let resolvedTheme: 'light' | 'dark';
    
    if (newTheme === 'system') {
      resolvedTheme = getSystemTheme();
    } else {
      resolvedTheme = newTheme;
    }
    
    setActualTheme(resolvedTheme);
    
    // Update document class and data attribute
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
  }, []);

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    updateActualTheme(newTheme);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      // If system, toggle to opposite of current actual theme
      setTheme(actualTheme === 'light' ? 'dark' : 'light');
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get stored theme or default to system
    const storedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = storedTheme || 'system';
    
    setThemeState(initialTheme);
    updateActualTheme(initialTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateActualTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    setMounted(true);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, updateActualTheme]);

  // Update actual theme when theme changes
  useEffect(() => {
    if (mounted) {
      updateActualTheme(theme);
    }
  }, [theme, mounted, updateActualTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'system', actualTheme: 'light', setTheme: () => {}, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
