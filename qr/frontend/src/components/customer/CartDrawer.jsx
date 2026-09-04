import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Utensils, Sparkles, MapPin, Gift, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { VegBadge } from '../common/Badge';

export const CartDrawer = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  generalInstructions,
  setGeneralInstructions,
  allItems = [],
}) => {
  const { cart, addToCart, updateQty, removeFromCart, clearCart, subtotal, tax, grandTotal, tableId } = useCart();

  const milestoneTarget = 600;
  const progressPercent = Math.min(100, Math.round((subtotal / milestoneTarget) * 100));
  const amountNeeded = Math.max(0, milestoneTarget - subtotal);

  const hasUnavailableItems = cart.some((i) => i.item.available === false);

  const cartItemIds = new Set(cart.map((i) => i.item.id));
  const suggestedUpsells = allItems
    .filter((i) => !cartItemIds.has(i.id) && i.available)
    .slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Slide-over Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md frosted-drawer shadow-2xl flex flex-col justify-between text-stone-900 dark:text-[#F5EFEB]"
            >
              {/* Header */}
              <div className="p-5 border-b border-stone-200 dark:border-[#E5A93C]/20 bg-stone-50/90 dark:bg-[#120F0D]/90 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E5A93C]/15 text-[#B87310] dark:text-[#F8DC9C] border border-[#E5A93C]/30 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white">Your Dining Feast</h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#E5A93C]" />
                      <span>Serving: <strong className="text-[#B87310] dark:text-[#F8DC9C]">{tableId}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Treat Milestone Progress Bar */}
              {cart.length > 0 && (
                <div className="bg-[#FAF3E8] dark:bg-gradient-to-r dark:from-[#1C160F] dark:via-[#2A2014] dark:to-[#1C160F] px-5 py-3 border-b border-[#E5A93C]/20">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="flex items-center gap-1.5 text-[#965A04] dark:text-[#F8DC9C]">
                      <Gift className="w-4 h-4 text-[#E5A93C]" />
                      {amountNeeded > 0
                        ? `Add ₹${Math.round(amountNeeded)} more for Chef's Treat!`
                        : "🎉 You've unlocked Chef's Complimentary Treat!"}
                    </span>
                    <span className="text-[#B87310] dark:text-[#E5A93C] font-mono text-[11px] font-black">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#F8DC9C] to-[#E5A93C] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(229,169,60,0.6)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Body: Items or Empty State */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg text-stone-900 dark:text-white">Your feast is waiting</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1">
                        Explore our handcrafted culinary catalog and add delicacies to begin dining.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-full gold-btn text-xs font-black shadow-gold-sm"
                    >
                      Browse Offerings
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                        Selected Offerings ({cart.reduce((s, i) => s + i.qty, 0)})
                      </span>
                      <button
                        onClick={clearCart}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear all
                      </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cart.map((cartItem) => {
                        const { item, qty, note } = cartItem;
                        const isSoldOut = item.available === false;

                        return (
                          <div
                            key={item.id}
                            className={`bg-white dark:bg-[#181412] rounded-2xl p-3.5 border shadow-xs flex items-center justify-between gap-3 ${
                              isSoldOut
                                ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20'
                                : 'border-stone-200 dark:border-[#E5A93C]/15'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <VegBadge isVeg={item.is_veg} className="mt-1 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                                  {item.name}
                                </h5>
                                <div className="text-xs text-[#B87310] dark:text-[#F8DC9C] font-black">
                                  ₹{Math.round(item.price)} each
                                </div>
                                {isSoldOut && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800/80 mt-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Sold Out &bull; Remove to proceed
                                  </span>
                                )}
                                {note && (
                                  <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md mt-1 italic border border-amber-200 dark:border-amber-900/40">
                                    "{note}"
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stepper + Subtotal */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900 p-0.5">
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-black text-stone-900 dark:text-white">
                                  {qty}
                                </span>
                                <button
                                  disabled={isSoldOut}
                                  onClick={() => updateQty(item.id, 1)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-sm font-black text-[#B87310] dark:text-[#F8DC9C] w-14 text-right">
                                ₹{Math.round(item.price * qty)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Complete Your Feast - 1-Click Upsells */}
                    {suggestedUpsells.length > 0 && (
                      <div className="bg-stone-50 dark:bg-[#181412] rounded-2xl p-3.5 border border-stone-200 dark:border-[#E5A93C]/20 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#965A04] dark:text-[#F8DC9C]">
                          <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
                          <span>Complete Your Feast (Pairs Wonderfully)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {suggestedUpsells.map((sug) => (
                            <div
                              key={sug.id}
                              className="bg-white dark:bg-[#201B17] p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-1.5 shadow-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                                  {sug.name}
                                </div>
                                <div className="text-[11px] font-black text-[#B87310] dark:text-[#F8DC9C]">
                                  ₹{Math.round(sug.price)}
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(sug, 1)}
                                className="px-2 py-1 gold-btn rounded-lg text-[10px] font-black shrink-0"
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Overall Cooking Instructions */}
                    <div className="bg-stone-50 dark:bg-[#181412] rounded-2xl p-3.5 border border-stone-200 dark:border-stone-800">
                      <label className="block text-xs font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-[#E5A93C]" />
                        Dining Requests & Delivery Notes
                      </label>
                      <textarea
                        rows={2}
                        value={generalInstructions}
                        onChange={(e) => setGeneralInstructions(e.target.value)}
                        placeholder="e.g. Serve food together, extra mint chutney..."
                        className="w-full text-xs p-2.5 bg-white dark:bg-[#120F0D] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none font-medium"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer: Bill Summary & Checkout */}
              {cart.length > 0 && (
                <div className="p-5 bg-stone-50 dark:bg-[#120F0D] border-t border-stone-200 dark:border-[#E5A93C]/20 space-y-4">
                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <div className="flex justify-between font-medium">
                      <span>Item Subtotal</span>
                      <span className="text-stone-900 dark:text-white font-bold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Taxes & GST (5%)</span>
                      <span className="text-stone-900 dark:text-white font-bold">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400">
                      <span>Dine-In Service Charge</span>
                      <span className="font-bold">COMPLIMENTARY</span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-baseline text-base font-black text-stone-900 dark:text-white">
                      <span>Grand Total</span>
                      <span className="text-xl font-black text-[#B87310] dark:text-[#F8DC9C]">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={onProceedToCheckout}
                    disabled={hasUnavailableItems}
                    className="w-full py-3.5 px-4 rounded-2xl gold-btn disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-sm flex items-center justify-between shadow-gold-glow active:scale-98"
                  >
                    <span>
                      {hasUnavailableItems
                        ? 'Remove Sold-Out Items to Proceed'
                        : 'Confirm & Place Feast'}
                    </span>
                    <div className="flex items-center gap-1.5 font-black text-black">
                      <span>₹{grandTotal.toFixed(2)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
