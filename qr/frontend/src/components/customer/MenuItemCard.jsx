import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { VegBadge, BestsellerBadge, SpiceLevelBadge } from '../common/Badge';
import { useCart } from '../../context/CartContext';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export const MenuItemCard = ({ item, onSelectDetail }) => {
  const { cart, addToCart, updateQty } = useCart();
  const cartEntry = cart.find((i) => i.item.id === item.id);
  const qty = cartEntry ? cartEntry.qty : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(item, 1);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQty(item.id, 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQty(item.id, -1);
  };

  const imageUrl = getImageUrl(item.image_url) || DEFAULT_IMAGE;

  // Sensory culinary flavor notes based on category & name
  const getFlavorNote = () => {
    const name = item.name.toLowerCase();
    const cat = item.category.toLowerCase();
    if (name.includes('butter') || name.includes('makhani')) return 'Creamy & velvety';
    if (name.includes('tikka') || name.includes('tandoor')) return 'Smoky clay-oven roasted';
    if (name.includes('biryani')) return 'Slow-dum saffron aromatics';
    if (name.includes('lassi')) return 'Thick & chilled alphonso';
    if (name.includes('naan')) return 'Hand-rolled butter glazed';
    if (cat.includes('starter')) return 'Crisp & fragrant';
    return 'Crafted with authentic spices';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group luxury-card rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between ${
        !item.available ? 'opacity-50 grayscale' : ''
      }`}
    >
      {/* Top Media & Content Area */}
      <div className="cursor-pointer" onClick={() => onSelectDetail(item)}>
        {/* Photo Container */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-900 mb-3.5 shadow-inner">
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <VegBadge isVeg={item.is_veg} />
            {item.is_bestseller && <BestsellerBadge />}
          </div>

          {/* Spice Level & Flavor Tag */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            {item.spice_level > 0 ? (
              <div className="bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20">
                <SpiceLevelBadge level={item.spice_level} />
              </div>
            ) : <span />}

            <span className="text-[10px] font-bold text-white bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs">
              {getFlavorNote()}
            </span>
          </div>

          {!item.available && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-black text-xs uppercase tracking-wider bg-rose-800 border border-rose-600 px-3 py-1 rounded-full shadow-lg">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Dish Title & Description */}
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h4 className="font-display font-black text-base sm:text-lg text-stone-900 dark:text-white leading-snug group-hover:text-[#B45309] dark:group-hover:text-[#F8DC9C] transition-colors line-clamp-1">
              {item.name}
            </h4>
          </div>
          {item.description && (
            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed mb-3 font-medium">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Pricing and Add to Cart Row */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-stone-500 dark:text-stone-400 tracking-wider">Price</span>
          <div className="text-lg sm:text-xl font-black text-[#9A3412] dark:text-[#FBBF24]">
            ₹{Math.round(item.price)}
          </div>
        </div>

        {/* Action Button */}
        {item.available ? (
          qty === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 gold-btn px-4 py-2 rounded-full text-xs font-black shadow-gold-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-[#E5A93C] text-black rounded-full p-1 shadow-[0_0_15px_rgba(229,169,60,0.4)] font-bold">
              <button
                onClick={handleDecrement}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-black">{qty}</span>
              <button
                onClick={handleIncrement}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        ) : (
          <span className="text-xs font-bold text-stone-400 dark:text-stone-500">Unavailable</span>
        )}
      </div>
    </motion.div>
  );
};
