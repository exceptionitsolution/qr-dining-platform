import React, { useState } from 'react';
import { UtensilsCrossed, ShoppingBag, MapPin, Search, ChevronDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { Modal } from './Modal';
import { motion } from 'framer-motion';

export const Navbar = ({ onOpenCart, searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen }) => {
  const { tableId, setTableId, totalItemCount } = useCart();
  const { isDark } = useTheme();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tempTable, setTempTable] = useState(tableId);

  const handleSaveTable = (e) => {
    e.preventDefault();
    if (tempTable.trim()) {
      const formatted = tempTable.toLowerCase().startsWith('table') ? tempTable.trim() : `Table ${tempTable.trim()}`;
      setTableId(formatted);
      setIsTableModalOpen(false);
    }
  };

  const quickTables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Table 9', 'Table 10', 'Bar 1', 'Takeaway'];

  return (
    <>
      <header className="sticky top-0 z-40 frosted-dark-nav transition-all w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#F8DC9C] via-[#E5A93C] to-[#A87122] flex items-center justify-center shadow-[0_0_20px_rgba(229,169,60,0.35)] text-black shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className={`font-display font-black text-lg sm:text-2xl tracking-tight truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  ZAIKA
                </span>
                <span className="hidden xs:inline-block text-[8px] sm:text-[9px] tracking-widest uppercase font-extrabold text-[#B87310] dark:text-[#F8DC9C] bg-[#E5A93C]/15 border border-[#E5A93C]/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                  Dining
                </span>
              </div>
              <p className={`text-[10px] font-medium hidden sm:block tracking-wide uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Artisanal Haute Cuisine &bull; QR Order
              </p>
            </div>
          </div>

          {/* Table Pill + Theme Switcher + Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Table Selector Pill */}
            <button
              onClick={() => {
                setTempTable(tableId);
                setIsTableModalOpen(true);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-bold transition-all shadow-xs ${
                isDark
                  ? 'bg-[#181512] border-[#E5A93C]/25 hover:border-[#E5A93C]/60 text-stone-200'
                  : 'bg-white border-stone-200 hover:border-[#C88218]/40 text-stone-800'
              }`}
              title="Click to switch table"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E5A93C] shrink-0" />
              <span className="font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[70px] sm:max-w-none">{tableId}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Search Icon Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all ${
                isSearchOpen
                  ? 'bg-[#E5A93C] text-black border-[#E5A93C]'
                  : isDark
                  ? 'bg-[#181512] border-stone-800 text-stone-300 hover:text-white'
                  : 'bg-white border-stone-200 text-stone-700 hover:text-stone-950'
              }`}
              title="Search Dishes"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2 sm:p-2.5 rounded-2xl gold-btn text-black shadow-gold-sm transition-all"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C83416] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#0C0A09] animate-scale-in">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Row */}
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#15120F] px-4 py-3"
          >
            <div className="max-w-xl mx-auto relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tender butter chicken, fragrant biryani, drinks..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#1D1814] text-stone-900 dark:text-white border border-stone-300 dark:border-[#E5A93C]/30 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400"
              />
            </div>
          </motion.div>
        )}
      </header>

      {/* Switch Table Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Switch Table Number"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Your orders will be delivered to this designated table. Select from the active dining zone below or enter your number.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {quickTables.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTempTable(t)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  tempTable === t
                    ? 'gold-btn'
                    : isDark
                    ? 'bg-[#1C1815] border-stone-800 text-stone-300 hover:border-stone-700'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Or Custom Table Name
            </label>
            <input
              type="text"
              value={tempTable}
              onChange={(e) => setTempTable(e.target.value)}
              placeholder="e.g. Table 15 or Rooftop 4"
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTableModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl gold-btn text-xs font-black shadow-gold-sm"
            >
              Confirm Table
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
