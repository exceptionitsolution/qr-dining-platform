import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api from '../../api/client';
import { toast } from 'sonner';
import { Star, MessageSquareHeart, Send, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ReviewModal = ({ isOpen, onClose, orderId, token, tableId }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const quickTags = ['Delicious Food', 'Lightning Fast Service', 'Great Ambience', 'Fresh Ingredients', 'Loved the Presentation'];

  const handleAddTag = (tag) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/reviews', {
        order_id: orderId,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      toast.success('Thank you for your review! ⭐');
      try {
        confetti({ particleCount: 50, spread: 60, colors: ['#E5A93C', '#F8DC9C', '#10B981'] });
      } catch {}
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Dining Experience" maxWidth="max-w-md">
      {submitted ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-[#201812] border border-[#E5A93C]/40 text-[#B87310] dark:text-[#E5A93C] mx-auto flex items-center justify-center shadow-gold-sm">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <h4 className="font-display font-bold text-xl text-stone-900 dark:text-white">Review Received!</h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto">
            Your review helps our chefs and counter staff continually refine your culinary experience.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-400 text-center">
            How was your order <strong className="text-[#B87310] dark:text-[#F8DC9C]">{token}</strong> at <strong className="text-stone-900 dark:text-white">{tableId}</strong>?
          </p>

          {/* Star Selector */}
          <div className="flex justify-center items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1.5 focus:outline-none transition-transform hover:scale-125"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-[#E5A93C] fill-[#E5A93C] drop-shadow-[0_0_8px_rgba(229,169,60,0.6)]'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Quick Compliment Tags */}
          <div>
            <label className="block text-[10px] font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Quick Compliments
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 dark:bg-[#1C1713] dark:hover:bg-[#2A221B] dark:text-stone-300 dark:border-stone-800 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment text */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#E5A93C]" />
              Write a Note to Chef
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved or how we can improve..."
              className="w-full text-xs p-3 bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium resize-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl gold-btn text-xs font-black shadow-gold-sm transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-black" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
