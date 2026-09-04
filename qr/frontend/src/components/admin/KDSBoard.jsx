import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { OrderCard } from './OrderCard';
import { useAudioNotification } from '../../hooks/useAudioNotification';
import { toast } from 'sonner';
import {
  ChefHat,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Clock,
  Layers,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';

export const KDSBoard = ({ audioEnabled }) => {
  const queryClient = useQueryClient();
  const { playNewOrderChime } = useAudioNotification();

  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'pending', 'preparing', 'ready', 'completed', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const prevOrderCountRef = useRef(0);

  // Poll orders every 4 seconds
  const { data: orders = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders');
      return res.data;
    },
    refetchInterval: 4000,
  });

  // Sound chime when a new order arrives
  useEffect(() => {
    if (orders.length > 0) {
      if (prevOrderCountRef.current > 0 && orders.length > prevOrderCountRef.current) {
        if (audioEnabled) {
          playNewOrderChime();
        }
        toast.info('🔔 New order received on KDS!');
      }
      prevOrderCountRef.current = orders.length;
    }
  }, [orders.length, audioEnabled, playNewOrderChime]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success(`Order ${data.token} marked as ${variables.status}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update order status');
    },
  });

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filtering
      if (statusFilter === 'active') {
        if (['completed', 'cancelled'].includes(order.status)) return false;
      } else if (statusFilter !== 'all') {
        if (order.status !== statusFilter) return false;
      }

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesToken = (order.token || '').toLowerCase().includes(q);
        const matchesTable = (order.table_id || '').toLowerCase().includes(q);
        const matchesCustomer = (order.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (order.phone || '').toLowerCase().includes(q);
        if (!matchesToken && !matchesTable && !matchesCustomer && !matchesPhone) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const activeCount = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Filter Tabs, Search & Manual Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 luxury-card p-4 sm:p-5 rounded-3xl">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'gold-btn'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <span>Active Queue</span>
            <span className="bg-black/20 dark:bg-black/40 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black font-black shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <span>Pending</span>
            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('preparing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              statusFilter === 'preparing'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <span>In Kitchen</span>
            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {preparingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              statusFilter === 'ready'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <span>Ready</span>
            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              statusFilter === 'all'
                ? 'bg-stone-800 text-white font-black'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            All Logs ({orders.length})
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token (#420), table, guest..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#120F0D] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium placeholder:text-stone-400"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors shrink-0 border border-stone-300 dark:border-stone-700"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#E5A93C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 luxury-card rounded-3xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="luxury-card rounded-3xl p-16 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display font-black text-lg text-stone-900 dark:text-white">Kitchen Queue Clear</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {searchQuery
              ? 'No orders matched your search query.'
              : 'All incoming customer orders have been fulfilled! New orders will pop in live.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={(orderId, status) =>
                updateStatusMutation.mutate({ orderId, status })
              }
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};
