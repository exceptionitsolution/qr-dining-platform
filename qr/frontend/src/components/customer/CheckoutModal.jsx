import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCart } from '../../context/CartContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CreditCard, Banknote, ArrowRight, Loader2, User } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutModal = ({ isOpen, onClose, instructions }) => {
  const { cart, grandTotal, tableId, clearCart, customer, updateCustomerInfo } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [paymentMode, setPaymentMode] = useState('cod'); // 'cod' = Pay at Counter, 'online' = Online
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name for the order token');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        table_id: tableId,
        customer_name: name.trim(),
        phone: phone.trim() || '',
        payment_mode: paymentMode,
        instructions: instructions || '',
        items: cart.map((i) => ({
          item_id: i.item.id,
          qty: i.qty,
        })),
      };

      const res = await api.post('/orders', payload);
      const orderData = res.data;

      updateCustomerInfo({ name: name.trim(), phone: phone.trim() });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E5A93C', '#F8DC9C', '#10B981', '#F43F5E'],
        });
      } catch {}

      clearCart();
      onClose();

      if (paymentMode === 'online' && orderData.razorpay_order_id) {
        await api.post('/payments/verify', { order_id: orderData.order_id });
        toast.success(`Online Payment Authorized! Order Token Created.`);
        navigate(`/order/${orderData.order_id}`);
      } else {
        toast.success(`Order Placed Successfully! Token: ${orderData.token}`);
        navigate(`/order/${orderData.id || orderData.order_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Table Order Checkout" maxWidth="max-w-lg">
      <form onSubmit={handlePlaceOrder} className="space-y-4">
        
        {/* Table & Bill Quick Bar */}
        <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-[#1C1713] border border-stone-200 dark:border-[#E5A93C]/30 rounded-2xl">
          <div>
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Dine-In Location
            </span>
            <span className="text-sm font-black text-stone-900 dark:text-white">{tableId}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-base font-black text-[#B87310] dark:text-[#F8DC9C]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Name (Mandatory) */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Your Name <span className="text-rose-500 font-black">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma (Required)"
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium"
            />
          </div>
        </div>

        {/* Phone Number (Optional) */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Mobile Number <span className="text-stone-500 dark:text-stone-400 text-[10px] normal-case font-normal">(Optional — for updates)</span>
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210 (Optional)"
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium"
            />
          </div>
        </div>

        {/* Payment Choice Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Pay at Counter */}
            <div
              onClick={() => setPaymentMode('cod')}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                paymentMode === 'cod'
                  ? 'border-[#E5A93C] bg-[#FAF3E8] dark:bg-[#221B14] ring-2 ring-[#E5A93C]/20 shadow-[0_0_15px_rgba(229,169,60,0.15)]'
                  : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-[#161311] hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className={`w-5 h-5 ${paymentMode === 'cod' ? 'text-[#B87310] dark:text-[#E5A93C]' : 'text-stone-400'}`} />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMode === 'cod' ? 'border-[#E5A93C] bg-[#E5A93C]' : 'border-stone-300 dark:border-stone-700'
                  }`}
                >
                  {paymentMode === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-white">Pay at Counter</div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">Cash / UPI at Desk</div>
              </div>
            </div>

            {/* Pay Online */}
            <div
              onClick={() => setPaymentMode('online')}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                paymentMode === 'online'
                  ? 'border-[#E5A93C] bg-[#FAF3E8] dark:bg-[#221B14] ring-2 ring-[#E5A93C]/20 shadow-[0_0_15px_rgba(229,169,60,0.15)]'
                  : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-[#161311] hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <CreditCard className={`w-5 h-5 ${paymentMode === 'online' ? 'text-[#B87310] dark:text-[#E5A93C]' : 'text-stone-400'}`} />
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMode === 'online' ? 'border-[#E5A93C] bg-[#E5A93C]' : 'border-stone-300 dark:border-stone-700'
                  }`}
                >
                  {paymentMode === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-white">Pay Online</div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">UPI / Cards / NetBanking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl gold-btn disabled:opacity-40 font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold-glow active:scale-98"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <>
                <span>Confirm & Generate Order Token</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
