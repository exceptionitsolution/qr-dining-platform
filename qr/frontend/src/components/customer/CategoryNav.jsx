import React from 'react';

export const CategoryNav = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <div className="sticky top-16 sm:top-20 z-30 frosted-dark-nav py-2.5 px-4 sm:px-6 shadow-md transition-all">
      <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shrink-0 transition-all ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-[#F8DC9C] to-[#E5A93C] text-black shadow-[0_0_15px_rgba(229,169,60,0.35)]'
              : 'bg-white text-stone-800 border border-stone-200 hover:border-[#B87310]/40 dark:bg-[#181412] dark:text-stone-300 dark:border-[#E5A93C]/15 dark:hover:text-white shadow-xs'
          }`}
        >
          All Offerings
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shrink-0 transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-[#F8DC9C] to-[#E5A93C] text-black shadow-[0_0_15px_rgba(229,169,60,0.35)]'
                : 'bg-white text-stone-800 border border-stone-200 hover:border-[#B87310]/40 dark:bg-[#181412] dark:text-stone-300 dark:border-[#E5A93C]/15 dark:hover:text-white shadow-xs'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
