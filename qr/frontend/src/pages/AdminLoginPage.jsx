import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { toast } from 'sonner';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@restaurant.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back to Zaika Control Center');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('admin@restaurant.com');
    setPassword('admin123');
    toast.info('Demo credentials loaded');
  };

  return (
    <div className="min-h-screen ambient-gold-bg text-stone-900 dark:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#181412] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F8DC9C] to-[#E5A93C] text-black flex items-center justify-center mx-auto shadow-gold-sm font-black">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900 dark:text-white tracking-tight">
            Zaika Counter & KDS
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Kitchen Display System & Restaurant Management
          </p>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 p-3 rounded-2xl flex items-center justify-between text-xs shadow-xs">
          <div>
            <div className="font-black text-[#9A3412] dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Default Admin Demo
            </div>
            <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 font-mono">admin@restaurant.com / admin123</div>
          </div>
          <button
            type="button"
            onClick={fillDemoCreds}
            className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-[11px] font-bold rounded-lg transition-colors"
          >
            Auto Fill
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restaurant.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-[#120F0D] border border-stone-300 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-[#E5A93C] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 dark:bg-[#120F0D] border border-stone-300 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-[#E5A93C] font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl gold-btn font-black text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-98"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <>
                <span>Access Management Center</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors font-bold"
          >
            &larr; Return to Customer Ordering Menu
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
