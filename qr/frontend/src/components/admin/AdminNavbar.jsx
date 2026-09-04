import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  UtensilsCrossed,
  ChefHat,
  Menu,
  BarChart3,
  QrCode,
  Star,
  LogOut,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';

export const AdminNavbar = ({ activeTab, setActiveTab, audioEnabled, setAudioEnabled }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navTabs = [
    { id: 'orders', label: 'Live KDS & Orders', icon: ChefHat },
    { id: 'menu', label: 'Menu Studio', icon: Menu },
    { id: 'stats', label: 'Analytics & Revenue', icon: BarChart3 },
    { id: 'qr', label: 'Table QR Center', icon: QrCode },
    { id: 'reviews', label: 'Guest Reviews', icon: Star },
  ];

  return (
    <header className="sticky top-0 z-40 frosted-dark-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand & Live Clock */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F8DC9C] via-[#E5A93C] to-[#A87122] flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(229,169,60,0.3)]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg sm:text-xl text-stone-900 dark:text-white tracking-tight">
                  ZAIKA KDS
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                  Live
                </span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono hidden sm:block">
                {time.toLocaleTimeString()} &bull; Counter Terminal
              </div>
            </div>
          </div>

          {/* Center Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-stone-100 dark:bg-[#1C1815] p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'gold-btn shadow-gold-sm'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-stone-800 dark:text-emerald-400 dark:border-stone-700'
                  : 'bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-800 dark:text-stone-500 dark:border-stone-700'
              }`}
              title={audioEnabled ? 'Kitchen Sound Alert Active' : 'Sound Alert Muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* View Customer Menu */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-700 dark:bg-stone-800 dark:hover:bg-rose-950 dark:text-stone-400 dark:hover:text-rose-400 border border-stone-200 dark:border-stone-700 transition-all shadow-xs"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-1.5 pb-3 pt-1 border-t border-stone-200 dark:border-stone-800">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'gold-btn'
                    : 'bg-stone-100 text-stone-800 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
