import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 sm:p-2.5 rounded-full border transition-all duration-300 ${
        isDark
          ? 'bg-[#181512] text-[#F8DC9C] border-[#E5A93C]/30 hover:border-[#E5A93C]/60 hover:bg-[#221D1A]'
          : 'bg-white text-[#B87310] border-stone-200 hover:border-[#B87310]/40 hover:bg-stone-50 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Warm Light Mode' : 'Switch to Luxury Dark Mode'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-[#F8DC9C] drop-shadow-[0_0_8px_rgba(248,220,156,0.6)]" />
        ) : (
          <Moon className="w-4 h-4 text-[#B87310]" />
        )}
      </motion.div>
    </button>
  );
};
