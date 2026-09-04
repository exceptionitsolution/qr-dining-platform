import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAudioNotification } from '../hooks/useAudioNotification';
import { StatusBadge } from '../components/common/Badge';
import { ReviewModal } from '../components/customer/ReviewModal';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  Printer,
  ChevronLeft,
  Star,
  MapPin,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export const OrderStatusPage = () => {
  const { orderId } = useParams();
  const { playReadyChime } = useAudioNotification();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const prevStatusRef = useRef(null);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orderStatus', orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/status`);
      return res.data;
    },
    refetchInterval: 3500,
  });

  useEffect(() => {
    if (order && order.status) {
      if (prevStatusRef.current && prevStatusRef.current !== 'ready' && order.status === 'ready') {
        playReadyChime();
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 }, colors: ['#E5A93C', '#F8DC9C', '#10B981'] });
        } catch {}
      }
      prevStatusRef.current = order.status;
    }
  }, [order?.status, playReadyChime]);

  const steps = [
    { key: 'pending', title: 'Order Received', desc: 'Sent to kitchen counter', icon: Clock },
    { key: 'preparing', title: 'In Kitchen', desc: 'Chefs are preparing your meal', icon: ChefHat },
    { key: 'ready', title: 'Ready for Pickup', desc: 'Collect at counter with your token', icon: BellRing },
    { key: 'completed', title: 'Served & Enjoyed', desc: 'Bon Appetit!', icon: CheckCircle2 },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'completed': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order?.status);

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen ambient-gold-bg flex flex-col items-center justify-center p-4 text-stone-900 dark:text-white">
        <RefreshCw className="w-8 h-8 text-[#E5A93C] animate-spin mb-3" />
        <p className="text-xs font-bold text-stone-600 dark:text-stone-300">Retrieving order token status...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen ambient-gold-bg flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4 text-stone-900 dark:text-white">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-[#201812] border border-stone-200 dark:border-[#E5A93C]/30 text-[#B87310] dark:text-[#F8DC9C] flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="font-display font-black text-2xl text-stone-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          We could not locate this order token.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full gold-btn text-xs font-black"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-gold-bg py-6 sm:py-10 px-4 sm:px-6 pb-24 text-stone-900 dark:text-[#F5EFEB] transition-colors duration-300">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Top Nav Bar */}
        <div className="flex items-center justify-between no-print">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#181412] border border-stone-200 dark:border-[#E5A93C]/25 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-[#E5A93C] transition-all shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 text-[#E5A93C]" />
            <span>Order More</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handlePrintReceipt}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#181412] border border-stone-200 dark:border-[#E5A93C]/25 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-[#E5A93C] transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Master Token Ticket Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="luxury-card rounded-3xl p-6 sm:p-8 relative overflow-hidden print-card text-stone-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-5">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-[#B87310] dark:text-[#E5A93C] block mb-0.5">
                Table Dine-In Token
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-gold-gradient tracking-tight">
                {order.token}
              </h2>
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} />
              <div className="text-[11px] text-stone-500 font-mono mt-1.5">
                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Quick Diner Meta */}
          <div className="grid grid-cols-2 gap-3 py-4 border-b border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E5A93C] shrink-0" />
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-bold block">Table / Location</span>
                <span className="font-extrabold text-[#B87310] dark:text-[#F8DC9C]">{order.table_id}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-[10px] text-stone-600 dark:text-stone-400">
                👤
              </div>
              <div>
                <span className="text-stone-500 text-[10px] uppercase font-bold block">Customer</span>
                <span className="font-extrabold text-stone-900 dark:text-white">{order.customer_name}</span>
              </div>
            </div>
          </div>

          {/* Live Progress Stepper */}
          {order.status !== 'cancelled' ? (
            <div className="py-6 border-b border-stone-200 dark:border-stone-800 no-print">
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStepIdx > idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={step.key} className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-br from-[#F8DC9C] to-[#E5A93C] text-black shadow-gold-sm ring-4 ring-[#E5A93C]/20'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 dark:bg-stone-900 text-stone-400 dark:text-stone-600 border border-stone-200 dark:border-stone-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            className={`w-0.5 h-6 my-1 transition-colors ${
                              isDone ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
                            }`}
                          />
                        )}
                      </div>

                      <div className="pt-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              isCurrent
                                ? 'text-stone-900 dark:text-white font-black'
                                : isDone
                                ? 'text-stone-700 dark:text-stone-300'
                                : 'text-stone-400 dark:text-stone-600'
                            }`}
                          >
                            {step.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#965A04] dark:text-[#F8DC9C] bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-2 py-0.5 rounded-full animate-pulse">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl my-4 text-rose-700 dark:text-rose-300 text-xs font-bold">
              This order was cancelled by the counter staff.
            </div>
          )}

          {/* Receipt Items Breakdown */}
          <div className="pt-5 space-y-3">
            <h4 className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Ordered Offerings ({order.items?.length || 0})
            </h4>
            <div className="space-y-2">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-[#221B15] text-stone-900 dark:text-[#F8DC9C] border border-stone-200 dark:border-[#E5A93C]/20 font-bold flex items-center justify-center">
                      {item.qty}x
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-white">{item.name}</span>
                  </div>
                  <span className="font-black text-[#B87310] dark:text-[#F8DC9C]">₹{Math.round(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            {order.instructions && (
              <div className="bg-[#FAF3E8] dark:bg-[#1F1914] p-3 rounded-xl border border-[#E5A93C]/30 text-xs text-[#965A04] dark:text-[#F8DC9C]">
                <strong>Dining Request:</strong> "{order.instructions}"
              </div>
            )}

            {/* Total Row */}
            <div className="pt-3 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                {order.payment_mode === 'online' ? (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-[#E5A93C]" />
                    <span>Paid Online</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Pay at Counter</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 font-medium block">Total Paid / Due</span>
                <span className="font-black text-xl text-[#B87310] dark:text-[#F8DC9C]">₹{Math.round(order.total)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feedback / Review Trigger */}
        <div className="no-print luxury-card rounded-3xl p-5 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-white">How was your dining feast?</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">Leave a quick rating for our chef & service team.</p>
          </div>
          <button
            onClick={() => setIsReviewOpen(true)}
            className="px-4 py-2.5 rounded-2xl gold-btn text-xs font-black shadow-gold-sm flex items-center gap-1.5 shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-black text-black" />
            <span>Rate Experience</span>
          </button>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        orderId={orderId}
        token={order.token}
        tableId={order.table_id}
      />
    </div>
  );
};
