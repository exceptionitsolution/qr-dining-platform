import React from 'react';
import { Sparkles, Plus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { VegBadge } from '../common/Badge';
import { getImageUrl } from '../../utils/imageUrl';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export const ChefHighlights = ({ items = [], onSelectDetail }) => {
  const { cart, addToCart } = useCart();

  const highlights = items
    .filter((i) => i.available)
    .slice(0, 5);

  if (highlights.length === 0) return null;

  return (
    <div className="space-y-3 pt-2 w-full max-w-full">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] shadow-[0_0_10px_rgba(229,169,60,0.8)] animate-pulse" />
          <h3 className="font-display font-black text-base sm:text-xl text-stone-900 dark:text-white tracking-tight">
            Chef's Masterclass Signatures
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-black text-[#9A3412] dark:text-[#E5A93C] tracking-wider uppercase font-mono bg-[#E5A93C]/15 px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 shrink-0">
          Handcrafted Today
        </span>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar pb-2 w-full max-w-full">
        {highlights.map((item) => {
          const inCart = cart.some((i) => i.item.id === item.id);
          const img = getImageUrl(item.image_url) || DEFAULT_IMAGE;

          return (
            <div
              key={item.id}
              onClick={() => onSelectDetail(item)}
              className="group cursor-pointer w-60 sm:w-72 shrink-0 luxury-card rounded-3xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo with soft rounded corners */}
                <div className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-900 mb-2.5 sm:mb-3 shadow-inner">
                  <img
                    src={img}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <VegBadge isVeg={item.is_veg} />
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/80 text-[#FBBF24] border border-white/20 backdrop-blur-md shadow-sm">
                      ★ Must Try
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-bold">
                    <span className="bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] text-stone-100 border border-white/15">
                      {item.category}
                    </span>
                    <span className="font-mono text-base font-black text-[#FBBF24] drop-shadow-md">
                      ₹{Math.round(item.price)}
                    </span>
                  </div>
                </div>

                <h4 className="font-display font-black text-sm sm:text-base text-stone-900 dark:text-white leading-snug group-hover:text-[#A65D03] dark:group-hover:text-[#F8DC9C] transition-colors line-clamp-1">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Add action */}
              <div className="pt-2.5 mt-2 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                  ⚡ Kitchen Favorite
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item, 1);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                    inCart
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'gold-btn shadow-gold-sm active:scale-95'
                  }`}
                >
                  {inCart ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
