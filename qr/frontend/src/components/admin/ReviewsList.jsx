import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Star, MessageSquareHeart, MapPin, Clock, Utensils, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ReviewsList = () => {
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'

  const { data: reviews = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: async () => {
      const res = await api.get('/admin/reviews');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    return reviews.filter((r) => r.rating === parseInt(starFilter));
  }, [reviews, starFilter]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Average Rating Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 luxury-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] shadow-[0_0_10px_rgba(229,169,60,0.8)] animate-pulse" />
            <h3 className="font-display font-black text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
              Live Diner Feedback & Ratings
            </h3>
            {isFetching && <RefreshCw className="w-4 h-4 text-[#E5A93C] animate-spin ml-1" />}
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Real-time reviews and comments submitted by customers from their table tokens.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-stone-800/90 px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400 block">
              Overall Score
            </span>
            <div className="text-lg font-black text-[#A65D03] dark:text-amber-400 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span>{avgRating} / 5.0</span>
            </div>
          </div>
          <span className="text-xs font-black text-stone-600 dark:text-stone-400">
            ({reviews.length} reviews)
          </span>
        </div>
      </div>

      {/* Star Filter Tabs & Rating Breakdown Strip */}
      <div className="luxury-card p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setStarFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 shadow-xs ${
              starFilter === 'all'
                ? 'gold-btn'
                : 'bg-white text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
            }`}
          >
            All Ratings ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s.toString())}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs ${
                starFilter === s.toString()
                  ? 'bg-amber-500 text-black font-black'
                  : 'bg-white text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
              }`}
            >
              <span>{s}★</span>
              <span className="text-[10px] opacity-75">({ratingCounts[s] || 0})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors self-end sm:self-auto shadow-xs"
          title="Refresh Reviews"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#E5A93C]' : ''}`} />
        </button>
      </div>

      {/* Reviews Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-stone-500 font-medium">Loading guest reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="luxury-card rounded-3xl p-16 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mx-auto">
            <Star className="w-8 h-8" />
          </div>
          <h4 className="font-display font-bold text-lg text-stone-900 dark:text-white">No reviews found</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {starFilter !== 'all'
              ? `No ${starFilter}-star reviews found in the system.`
              : 'Guest star ratings and feedback will appear here as orders are completed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((r) => {
            const timeAgo = r.created_at
              ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true })
              : 'Recently';

            return (
              <div
                key={r.id}
                className="luxury-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-3 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800/80 pb-3 mb-3">
                    <div className="flex items-center gap-1 text-[#A65D03] dark:text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < r.rating ? 'fill-current' : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono font-bold">{timeAgo}</span>
                  </div>

                  {r.comment ? (
                    <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed italic font-medium">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic">No written comment provided.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-black text-stone-900 dark:text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-[#B45309] dark:text-[#E5A93C]" />
                    <span>{r.table_id || 'Table'}</span>
                  </div>
                  {r.token && (
                    <span className="font-mono bg-white dark:bg-stone-800 px-2.5 py-0.5 rounded-lg text-[#9A3412] dark:text-amber-400 font-black border border-stone-200 dark:border-stone-700 shadow-xs">
                      {r.token}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
