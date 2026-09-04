import React from 'react';

export const DishSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-200/70 shadow-sm flex flex-col justify-between animate-pulse">
      <div>
        <div className="w-full aspect-[4/3] rounded-2xl bg-stone-200 mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-sm bg-stone-200" />
          <div className="w-20 h-4 rounded-full bg-stone-200" />
        </div>
        <div className="w-3/4 h-5 rounded-md bg-stone-200 mb-2" />
        <div className="w-full h-3 rounded-md bg-stone-100 mb-1" />
        <div className="w-4/5 h-3 rounded-md bg-stone-100 mb-4" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
        <div className="w-16 h-6 rounded-md bg-stone-200" />
        <div className="w-24 h-9 rounded-2xl bg-stone-200" />
      </div>
    </div>
  );
};

export const CategoryNavSkeleton = () => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-3 no-scrollbar">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 w-28 rounded-full bg-stone-200 shrink-0 animate-pulse" />
      ))}
    </div>
  );
};
