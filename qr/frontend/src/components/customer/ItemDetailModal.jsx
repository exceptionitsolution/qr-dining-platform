import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { VegBadge, BestsellerBadge, SpiceLevelBadge } from '../common/Badge';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, ShoppingBag, MessageSquare, Sparkles, X } from 'lucide-react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export const ItemDetailModal = ({ item, isOpen, onClose, allItems = [] }) => {
  const { cart, addToCart } = useCart();
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const imageUrl = item.image_url
    ? item.image_url.startsWith('http') || item.image_url.startsWith('/')
      ? item.image_url
      : `/uploads/${item.image_url}`
    : DEFAULT_IMAGE;

  const handleAddToCart = () => {
    addToCart(item, quantity, note);
    setNote('');
    setQuantity(1);
    onClose();
  };

  const complementary = allItems
    .filter((i) => i.id !== item.id && i.available && (i.category === 'Breads' || i.category === 'Beverages' || i.category === 'Starters'))
    .slice(0, 2);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 relative">
        
        {/* Large Food Photography with Badges & Top-Right Single Close Button */}
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 shadow-inner">
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />
          
          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
            <VegBadge isVeg={item.is_veg} />
            {item.is_bestseller && <BestsellerBadge />}
          </div>

          {/* Single High-Visibility Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md flex items-center justify-center transition-all shadow-xl active:scale-95 border border-white/40 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-white pointer-events-none" />
          </button>
        </div>

        {/* Title, Category & Price */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#A65D03] dark:text-[#F8DC9C] bg-[#E5A93C]/15 border border-[#E5A93C]/30 px-2.5 py-0.5 rounded-full">
              {item.category}
            </span>
            {item.spice_level > 0 && <SpiceLevelBadge level={item.spice_level} />}
          </div>
          <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 dark:text-white leading-snug">{item.name}</h3>
          <div className="text-xl sm:text-2xl font-black text-[#9A3412] dark:text-[#FBBF24] mt-1">₹{Math.round(item.price)}</div>
        </div>

        {/* Full Culinary Description */}
        {item.description && (
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-100 dark:bg-[#1A1613] p-3 rounded-2xl border border-stone-200 dark:border-stone-800 font-medium">
            {item.description}
          </p>
        )}

        {/* Chef's Pairing Suggestion */}
        {complementary.length > 0 && (
          <div className="bg-[#FAF3E8] dark:bg-[#1C1713] p-3 rounded-2xl border border-[#E5A93C]/30 space-y-2">
            <span className="text-[11px] font-bold text-[#965A04] dark:text-[#F8DC9C] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
              Chef's Recommended Pairing
            </span>
            <div className="flex gap-2">
              {complementary.map((comp) => (
                <div
                  key={comp.id}
                  className="flex-1 bg-white dark:bg-[#241E1A] p-2 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-xs"
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-[11px] font-bold text-stone-900 dark:text-white truncate">{comp.name}</div>
                    <div className="text-[10px] text-[#9A3412] dark:text-[#FBBF24] font-black">₹{Math.round(comp.price)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(comp, 1)}
                    className="px-2 py-0.5 gold-btn rounded-lg text-[10px] font-black shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions Note Input */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#E5A93C]" />
            Special Cooking Request (Optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Mild spice, dressing on side..."
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium"
          />
        </div>

        {/* Quantity Stepper, Cancel & Add Action */}
        <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-[#1A1613] p-1 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center font-black text-[#9A3412] dark:text-[#FBBF24] text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Feast Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl gold-btn text-xs font-black shadow-gold-glow active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>Add to Feast &bull; ₹{Math.round(item.price * quantity)}</span>
            </button>
          </div>

          {/* Explicit Cancel / Back Button for Phone */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          >
            Cancel & Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
