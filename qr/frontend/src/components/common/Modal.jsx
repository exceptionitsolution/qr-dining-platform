import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col bg-white dark:bg-[#14110F] text-stone-900 dark:text-[#F5EFEB] rounded-3xl shadow-2xl border border-stone-200 dark:border-[#E5A93C]/25 overflow-hidden z-10`}
          >
            {/* Top Header if title provided */}
            {title && (
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50 dark:bg-[#1A1613] shrink-0">
                <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5 pointer-events-none" />
                </button>
              </div>
            )}

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
