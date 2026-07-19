'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check initial state from html element classlist
    const isDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(isDarkClass);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!mounted) {
    // Return empty placeholder button to prevent layout shift during server/client render mismatch
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-800/40 border border-slate-700/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white transition-all duration-300 scale-100 active:scale-95 cursor-pointer shadow-sm relative overflow-hidden group"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4">
        {/* Sun Icon (Visible in dark mode, rotate out in light) */}
        <Sun className={`w-4 h-4 absolute inset-0 transition-all duration-500 transform ${
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        } text-amber-400`} />
        
        {/* Moon Icon (Visible in light mode, rotate out in dark) */}
        <Moon className={`w-4 h-4 absolute inset-0 transition-all duration-500 transform ${
          !isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        } text-indigo-400`} />
      </div>
    </button>
  );
}
