import React from 'react';
import { Flame, Star, Sparkles } from 'lucide-react';

export const VegBadge = ({ isVeg, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border p-[2px] shadow-sm ${
        isVeg ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-[#0C1A14]' : 'border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-[#1A0C0E]'
      } ${className}`}
      title={isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isVeg ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
        }`}
      />
    </div>
  );
};

export const BestsellerBadge = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF3E3] text-[#965A04] border border-[#E5A93C]/50 dark:bg-[#231C13] dark:text-[#F8DC9C] dark:border-[#E5A93C]/40 shadow-xs ${className}`}
    >
      <Sparkles className="w-3 h-3 text-[#B87310] dark:text-[#E5A93C] fill-current" />
      Chef's Signature
    </span>
  );
};

export const SpiceLevelBadge = ({ level = 1, className = '' }) => {
  if (!level || level <= 0) return null;
  return (
    <div
      className={`inline-flex items-center gap-0.5 text-xs text-amber-500 dark:text-amber-400 font-medium ${className}`}
      title={`Spice Level: ${level}/3`}
    >
      {[...Array(Math.min(3, level))].map((_, i) => (
        <Flame key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
      ))}
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'Order Received', bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-600/40', dot: 'bg-amber-500 animate-pulse' },
    preparing: { label: 'In Kitchen', bg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-600/40', dot: 'bg-blue-500 animate-pulse' },
    ready: { label: 'Ready for Pickup', bg: 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/20 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-500/60', dot: 'bg-emerald-500 animate-ping' },
    completed: { label: 'Served', bg: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-700', dot: 'bg-stone-500' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/50', dot: 'bg-rose-500' },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
