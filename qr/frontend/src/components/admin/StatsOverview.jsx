import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  DollarSign,
  Utensils,
  Star,
  Sparkles,
  MapPin,
  BarChart3,
  Calendar,
  XCircle,
} from 'lucide-react';

export const StatsOverview = () => {
  const [period, setPeriod] = useState('today'); // 'today', 'week', 'all'

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', period],
    queryFn: async () => {
      const res = await api.get(`/admin/stats?period=${period}`);
      return res.data;
    },
    refetchInterval: 5000,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 luxury-card rounded-3xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: `${period === 'today' ? "Today's" : period === 'week' ? 'Weekly' : 'All-Time'} Revenue`,
      value: `₹${Math.round(stats.total_revenue || 0)}`,
      sub: `COD: ₹${Math.round(stats.cod_revenue || 0)} | Online: ₹${Math.round(stats.online_revenue || 0)}`,
      icon: TrendingUp,
      color: 'from-amber-500 to-[#D94625]',
      accent: 'border-[#E5A93C]/40',
    },
    {
      label: 'Orders Placed',
      value: stats.total_orders || 0,
      sub: `Avg Order Value: ₹${stats.average_order_value || 0}`,
      icon: ShoppingBag,
      color: 'from-blue-600 to-indigo-600',
      accent: 'border-blue-500/40',
    },
    {
      label: 'Fulfillment & Served',
      value: stats.completed_orders || 0,
      sub: `${stats.total_orders ? Math.round((stats.completed_orders / stats.total_orders) * 100) : 0}% success rate`,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-teal-600',
      accent: 'border-emerald-500/40',
    },
    {
      label: 'Active Kitchen Queue',
      value: stats.pending_orders || 0,
      sub: `${stats.cancelled_orders || 0} cancelled`,
      icon: Clock,
      color: 'from-orange-500 to-rose-600',
      accent: 'border-rose-500/40',
    },
  ];

  const maxDishQty = Math.max(1, ...(stats.top_dishes || []).map((d) => d.qty));

  return (
    <div className="space-y-6">
      
      {/* Top Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 luxury-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] shadow-[0_0_10px_rgba(229,169,60,0.8)] animate-pulse" />
            <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
              Live Restaurant Analytics
            </h3>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Real-time insights on revenue streams, peak dining hours, and bestsellers.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700/80 self-start sm:self-auto shadow-inner">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'all', label: 'All Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                period === t.id
                  ? 'gold-btn'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="luxury-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-stone-600 dark:text-stone-400 uppercase tracking-wider">{c.label}</span>
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight">
                  {c.value}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 font-semibold">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Top Dishes & Table Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Top Selling Dishes */}
        <div className="luxury-card rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <h4 className="font-display font-black text-lg text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B45309] dark:text-amber-400" />
              <span>Top Selling Delicacies</span>
            </h4>
            <span className="text-xs text-[#A65D03] dark:text-[#F8DC9C] font-black uppercase tracking-wider font-mono">By Orders</span>
          </div>

          {(stats.top_dishes || []).length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center font-medium">No orders recorded in this timeframe yet.</p>
          ) : (
            <div className="space-y-4 pt-1">
              {(stats.top_dishes || []).map((dish, idx) => {
                const percent = Math.round((dish.qty / maxDishQty) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {idx + 1}. {dish.name}
                      </span>
                      <span className="font-mono text-stone-700 dark:text-stone-300 font-black">
                        {dish.qty} orders &bull; <span className="text-[#A65D03] dark:text-[#FBBF24]">₹{Math.round(dish.revenue)}</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[#F8DC9C] via-[#E5A93C] to-[#C2410C] rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Highest Revenue Tables & Customer Satisfaction */}
        <div className="luxury-card rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 mb-4">
              <h4 className="font-display font-black text-lg text-stone-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B45309] dark:text-[#D94625]" />
                <span>Table Performance</span>
              </h4>
              <span className="text-xs text-stone-500 font-extrabold uppercase">Top Dining Zones</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(stats.top_tables || []).slice(0, 4).map((tbl, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1E1916] p-4 rounded-2xl border border-stone-200 dark:border-stone-700/60 shadow-sm flex flex-col justify-between"
                >
                  <span className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">{tbl.table}</span>
                  <div className="text-lg font-black text-[#A65D03] dark:text-[#FBBF24] mt-1">
                    ₹{Math.round(tbl.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Satisfaction Score Widget */}
          <div className="bg-white dark:bg-[#1E1916] p-4 rounded-2xl border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-[#A65D03] dark:text-amber-400 flex items-center justify-center font-black shadow-xs">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-xs font-black text-stone-900 dark:text-stone-200 uppercase tracking-wider block">Diner Satisfaction</span>
                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Based on {stats.total_reviews || 0} reviews
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display font-black text-2xl text-[#A65D03] dark:text-[#FBBF24]">
                {stats.avg_rating || '5.0'} / 5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="luxury-card rounded-3xl p-6 sm:p-7 space-y-4">
        <h4 className="font-display font-black text-lg text-stone-900 dark:text-white">Payment Method Distribution</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#1E1916] p-4 rounded-2xl border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#A65D03] dark:text-amber-400 flex items-center justify-center font-bold">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">Counter Cash & Desk UPI</span>
                <div className="text-base sm:text-lg font-black text-stone-900 dark:text-white">₹{Math.round(stats.cod_revenue || 0)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1916] p-4 rounded-2xl border border-stone-200 dark:border-stone-700/60 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-stone-700 dark:text-stone-300">Online Gateway (Razorpay/Cards)</span>
                <div className="text-base sm:text-lg font-black text-stone-900 dark:text-white">₹{Math.round(stats.online_revenue || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
