'use client';

import { useTheme } from '@/app/contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <ComputerDesktopIcon className={iconSizeClasses[size]} />;
    }
    return actualTheme === 'dark' ? 
      <MoonIcon className={iconSizeClasses[size]} /> : 
      <SunIcon className={iconSizeClasses[size]} />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return actualTheme === 'dark' ? 'Dark' : 'Light';
  };

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: SunIcon },
    { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
    { value: 'system' as const, label: 'System', icon: ComputerDesktopIcon }
  ];

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg border border-gray-200 bg-white opacity-50`}>
        {/* Placeholder while mounting */}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Simple Toggle Button */}
      <button
        onClick={showLabel ? () => setShowDropdown(!showDropdown) : toggleTheme}
        className={`
          ${sizeClasses[size]} 
          flex items-center justify-center
          rounded-lg border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
          text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          shadow-sm hover:shadow-md
        `}
        aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Current theme: ${getThemeLabel()}`}
      >
        <div className="transition-transform duration-200 ease-in-out">
          {getThemeIcon()}
        </div>
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {getThemeLabel()}
          </span>
        )}
      </button>

      {/* Dropdown Menu for detailed theme selection */}
      {showLabel && showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setShowDropdown(false);
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-sm text-left
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  first:rounded-t-lg last:rounded-b-lg
                  transition-colors duration-150
                  ${theme === option.value 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                {option.label}
                {theme === option.value && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

// Simple theme toggle hook for quick usage
export function useThemeToggle() {
  const { actualTheme, toggleTheme } = useTheme();
  
  return {
    isDark: actualTheme === 'dark',
    toggle: toggleTheme
  };
}
