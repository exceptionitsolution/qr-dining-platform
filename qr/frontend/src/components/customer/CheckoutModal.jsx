import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCart } from '../../context/CartContext';
import api from '../../api/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle2, CreditCard, Banknote, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutModal = ({ isOpen, onClose, instructions }) => {
  const { cart, grandTotal, tableId, clearCart, customer, updateCustomerInfo } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState(customer.name || 'Aarav Sharma');
  const [phone, setPhone] = useState(customer.phone || '9876543210');
  const [paymentMode, setPaymentMode] = useState('cod'); // 'cod' = Pay at Counter, 'online' = Online
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState(customer.otpToken || '');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await api.post('/otp/send', { phone: phone.trim() });
      setOtpSent(true);
      if (res.data.demo_otp) {
        setDemoOtpCode(res.data.demo_otp);
        toast.info(`Demo Code: ${res.data.demo_otp} (Click autofill or type 1234)`);
      } else {
        toast.success(res.data.message || 'OTP dispatched to your phone');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to dispatch OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length < 4) {
      toast.error('Enter the 4-digit code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await api.post('/otp/verify', { phone: phone.trim(), otp: code.trim() });
      setOtpToken(res.data.otp_token);
      updateCustomerInfo({ name, phone, otpToken: res.data.otp_token });
      toast.success('Phone verified successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAutoFillDemoOtp = () => {
    const code = demoOtpCode || '1234';
    setOtpCode(code);
    handleVerifyOtp(code);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide your name for the order token');
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
        phone: phone.trim(),
        otp_token: otpToken || undefined,
        payment_mode: paymentMode,
        instructions: instructions || '',
        items: cart.map((i) => ({
          item_id: i.item.id,
          qty: i.qty,
        })),
      };

      const res = await api.post('/orders', payload);
      const orderData = res.data;

      updateCustomerInfo({ name, phone, otpToken });

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

        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Your Name (for Token Calling) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aarav Sharma"
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium"
          />
        </div>

        {/* Phone & OTP Verification */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Phone Number (for Live SMS Updates)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Smartphone className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setOtpToken('');
                  setOtpSent(false);
                }}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-[#1A1613] text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C] font-medium"
              />
            </div>
            {!otpToken ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || phone.length < 10}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-40 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all shrink-0 border border-stone-300 dark:border-stone-700"
              >
                {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </div>
            )}
          </div>
        </div>

        {/* OTP Input & Demo Autofill Pill */}
        {otpSent && !otpToken && (
          <div className="bg-stone-50 dark:bg-[#1C1713] p-3.5 rounded-2xl border border-stone-200 dark:border-[#E5A93C]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Enter 4-digit OTP:</span>
              <button
                type="button"
                onClick={handleAutoFillDemoOtp}
                className="text-[11px] font-bold text-[#965A04] dark:text-[#F8DC9C] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-[#E5A93C]" />
                Auto-fill Demo Code (1234)
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="1234"
                className="w-32 px-3 py-2 text-center tracking-widest font-mono font-bold text-base bg-white dark:bg-[#120F0D] text-stone-900 dark:text-[#F8DC9C] border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:border-[#E5A93C]"
              />
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp || otpCode.length < 4}
                className="flex-1 py-2 gold-btn rounded-xl text-xs font-black disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Verify Code'}
              </button>
            </div>
          </div>
        )}

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
