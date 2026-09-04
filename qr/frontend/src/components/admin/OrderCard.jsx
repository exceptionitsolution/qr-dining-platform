import React from 'react';
import { StatusBadge } from '../common/Badge';
import {
  Clock,
  ChefHat,
  BellRing,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
  Banknote,
  Phone,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const OrderCard = ({ order, onUpdateStatus, isUpdating }) => {
  const timeAgo = order.created_at
    ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true })
    : 'Just now';

  return (
    <div
      className={`bg-white dark:bg-[#181412] border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md ${
        order.status === 'ready'
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
          : order.status === 'preparing'
          ? 'border-blue-500/60'
          : order.status === 'pending'
          ? 'border-amber-500/60'
          : 'border-stone-200 dark:border-stone-800 opacity-75'
      }`}
    >
      <div>
        {/* Top Token & Table Row */}
        <div className="flex items-start justify-between border-b border-stone-200 dark:border-stone-800 pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-2xl sm:text-3xl text-stone-900 dark:text-white tracking-tight">
              {order.token}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-[#9A3412] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <MapPin className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400" />
              <span>{order.table_id}</span>
            </div>
          </div>

          <div className="text-right">
            <StatusBadge status={order.status} />
            <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-1 justify-end">
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 pb-3 mb-3 border-b border-stone-200 dark:border-stone-800/60">
          <span className="font-bold text-stone-800 dark:text-stone-200">
            👤 {order.customer_name || 'Guest Diner'}
          </span>
          {order.phone && (
            <span className="flex items-center gap-1 text-stone-500 dark:text-stone-400 font-mono">
              <Phone className="w-3 h-3" />
              {order.phone}
            </span>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-2 mb-4">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-xs gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-black shrink-0 border border-stone-200 dark:border-stone-700">
                  {item.qty}x
                </span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">{item.name}</span>
              </div>
              <span className="font-black text-[#9A3412] dark:text-[#FBBF24] shrink-0">
                ₹{Math.round(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Cooking Notes */}
        {order.instructions && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-2.5 rounded-xl text-xs text-amber-900 dark:text-amber-300 mb-4 flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="italic leading-snug font-medium">"{order.instructions}"</span>
          </div>
        )}
      </div>

      {/* Footer: Amount, Payment Mode & Status Progression Actions */}
      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
            {order.payment_mode === 'online' ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40 font-bold">
                <CreditCard className="w-3 h-3" /> Online Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 font-bold">
                <Banknote className="w-3 h-3" /> Pay at Counter
              </span>
            )}
          </div>
          <div className="text-base font-black text-stone-900 dark:text-white">
            ₹{Math.round(order.total)}
          </div>
        </div>

        {/* Action Buttons based on status */}
        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold transition-all"
              >
                Reject
              </button>
              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
                <span>Start Prep</span>
              </button>
            </>
          )}

          {order.status === 'preparing' && (
            <button
              disabled={isUpdating}
              onClick={() => onUpdateStatus(order.id, 'ready')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
              <span>Mark Ready & Chime Customer</span>
            </button>
          )}

          {order.status === 'ready' && (
            <button
              disabled={isUpdating}
              onClick={() => onUpdateStatus(order.id, 'completed')}
              className="w-full py-2.5 rounded-xl bg-[#B45309] hover:bg-[#9A3412] dark:bg-[#E5A93C] dark:hover:bg-[#D49B45] text-white dark:text-black text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Mark Served (Complete)</span>
            </button>
          )}

          {(order.status === 'completed' || order.status === 'cancelled') && (
            <div className="w-full py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-center text-xs font-bold text-stone-500 dark:text-stone-400">
              Archived Order
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
