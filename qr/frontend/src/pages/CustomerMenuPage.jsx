import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Navbar } from '../components/common/Navbar';
import { CategoryNav } from '../components/customer/CategoryNav';
import { ChefHighlights } from '../components/customer/ChefHighlights';
import { MenuItemCard } from '../components/customer/MenuItemCard';
import { ItemDetailModal } from '../components/customer/ItemDetailModal';
import { CartDrawer } from '../components/customer/CartDrawer';
import { CheckoutModal } from '../components/customer/CheckoutModal';
import { DishSkeleton, CategoryNavSkeleton } from '../components/common/Skeleton';
import { useCart } from '../context/CartContext';
import { Sparkles, Leaf, Flame, ShoppingBag, ArrowRight, ChefHat, Search, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerMenuPage = () => {
  const {
    cart,
    totalItemCount,
    grandTotal,
    tableId,
    syncWithLatestMenu,
    generalInstructions,
    setGeneralInstructions,
  } = useCart();

  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'non-veg', 'bestseller'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch menu with real-time background sync (every 3 seconds)
  const { data: menuData, isLoading, isError, refetch } = useQuery({
    queryKey: ['publicMenu'],
    queryFn: async () => {
      const res = await api.get('/menu');
      return res.data;
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  const categories = menuData?.categories || [];
  const items = menuData?.items || [];

  // Derive currently opened dish directly from items without useEffect loops
  const selectedDetailItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  // Synchronize cart with latest menu items
  useEffect(() => {
    if (items.length > 0) {
      syncWithLatestMenu(items);
    }
  }, [items, syncWithLatestMenu]);

  // Touch-fallthrough protection for mobile devices
  const lastClosedTimeRef = useRef(0);

  const handleSelectDetail = (item) => {
    if (Date.now() - lastClosedTimeRef.current < 500) return;
    setSelectedItemId(item.id);
  };

  const handleCloseDetail = () => {
    lastClosedTimeRef.current = Date.now();
    document.body.style.pointerEvents = 'none';
    setTimeout(() => {
      document.body.style.pointerEvents = 'auto';
    }, 300);
    setSelectedItemId(null);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (dietaryFilter === 'veg' && !item.is_veg) return false;
      if (dietaryFilter === 'non-veg' && item.is_veg) return false;
      if (dietaryFilter === 'bestseller' && !item.is_bestseller) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [items, activeCategory, dietaryFilter, searchQuery]);

  return (
    <div className="min-h-screen pb-28 ambient-gold-bg text-stone-900 dark:text-white transition-colors duration-300 w-full max-w-full overflow-x-hidden">
      {/* Top Brand Navbar */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
      />

      {/* Luxury Editorial Hero */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-gradient-to-r dark:from-[#171310] dark:via-[#1E1915] dark:to-[#14100D] border border-stone-300 dark:border-[#E5A93C]/30 p-5 sm:p-10 shadow-lg dark:shadow-luxury w-full">
          {/* Subtle golden ambient glow overlay */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E5A93C]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <ChefHat className="w-72 h-72 text-[#E5A93C]" />
          </div>

          <div className="relative z-10 max-w-xl space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5A93C]/20 backdrop-blur-md text-[#9A3412] dark:text-[#F8DC9C] text-xs font-black border border-[#E5A93C]/40 shadow-xs">
              <Crown className="w-3.5 h-3.5 text-[#B45309] dark:text-[#E5A93C]" />
              <span>Table Hospitality &bull; {tableId}</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-5xl leading-tight text-stone-950 dark:text-white tracking-tight">
              Culinary Artistry. <br />
              <span className="text-gold-gradient">Served to Your Table.</span>
            </h1>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-w-md font-medium">
              Explore our masterclass dining catalog. Each delicacy is prepared live to order with slow-roasted spices and served piping hot.
            </p>
          </div>
        </div>
      </div>

      {/* Chef Highlights Carousel */}
      {!isLoading && items.length > 0 && (
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-7 w-full">
          <ChefHighlights
            items={items}
            onSelectDetail={handleSelectDetail}
          />
        </div>
      )}

      {/* Category Pills Header */}
      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <CategoryNavSkeleton />
        </div>
      ) : (
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      )}

      {/* Dietary Filter Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDietaryFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
              dietaryFilter === 'all'
                ? 'bg-gradient-to-r from-[#F8DC9C] to-[#E5A93C] text-black font-black shadow-gold-sm ring-2 ring-[#E5A93C]/30'
                : 'bg-white dark:bg-[#181412] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-[#E5A93C]/20 hover:border-[#E5A93C]'
            }`}
          >
            All Offerings
          </button>
          <button
            onClick={() => setDietaryFilter('veg')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
              dietaryFilter === 'veg'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                : 'bg-white dark:bg-[#181412] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-800 hover:border-emerald-600'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Pure Veg
          </button>
          <button
            onClick={() => setDietaryFilter('non-veg')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
              dietaryFilter === 'non-veg'
                ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/40'
                : 'bg-white dark:bg-[#181412] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-800 hover:border-rose-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />
            Non-Veg
          </button>
          <button
            onClick={() => setDietaryFilter('bestseller')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
              dietaryFilter === 'bestseller'
                ? 'bg-[#FDF3E3] dark:bg-[#2E2316] text-[#9A3412] dark:text-[#F8DC9C] border border-[#E5A93C] shadow-[0_0_12px_rgba(229,169,60,0.25)] font-black ring-2 ring-[#E5A93C]/30'
                : 'bg-white dark:bg-[#181412] text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-800 hover:border-[#E5A93C]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B45309] dark:text-[#E5A93C]" />
            Signatures
          </button>
        </div>

        <span className="text-xs text-stone-600 dark:text-stone-400 font-mono font-black shrink-0 bg-stone-200/70 dark:bg-stone-800 px-3 py-1 rounded-full">
          {filteredItems.length} dishes
        </span>
      </div>

      {/* Menu Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <DishSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-[#181412] rounded-3xl p-8 text-center max-w-md mx-auto border border-rose-300 dark:border-rose-900/60 shadow-md space-y-3 my-12">
            <h3 className="font-display font-bold text-lg text-rose-700 dark:text-rose-300">Unable to load menu</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">Please verify backend connectivity and try again.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 gold-btn rounded-xl text-xs font-black"
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="luxury-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 my-12">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-800 flex items-center justify-center text-stone-500 mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-display font-black text-lg text-stone-900 dark:text-white">No dishes matched</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Try changing dietary filters or search keywords.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setDietaryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 gold-btn rounded-xl text-xs font-black"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelectDetail={handleSelectDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile & Desktop */}
      {totalItemCount > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 z-40"
        >
          <div
            onClick={() => setIsCartOpen(true)}
            className="cursor-pointer bg-white/98 dark:bg-[#14110F]/98 hover:bg-stone-50 dark:hover:bg-[#1A1613] text-stone-900 dark:text-white p-4 rounded-3xl shadow-2xl border border-stone-300 dark:border-[#E5A93C]/40 backdrop-blur-xl flex items-center justify-between transition-all duration-200 active:scale-98 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F8DC9C] to-[#E5A93C] flex items-center justify-center text-black font-black shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-stone-700 dark:text-stone-300">
                  {totalItemCount} {totalItemCount === 1 ? 'offering' : 'offerings'} selected
                </div>
                <div className="text-base font-black text-[#9A3412] dark:text-[#FBBF24]">₹{grandTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 gold-btn px-4 py-2 rounded-2xl text-xs font-black shadow-gold-sm">
              <span>View Feast</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedDetailItem}
        allItems={items}
        isOpen={!!selectedDetailItem}
        onClose={handleCloseDetail}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        allItems={items}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        generalInstructions={generalInstructions}
        setGeneralInstructions={setGeneralInstructions}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        instructions={generalInstructions}
      />
    </div>
  );
};
