import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminNavbar } from '../components/admin/AdminNavbar';
import { KDSBoard } from '../components/admin/KDSBoard';
import { MenuManager } from '../components/admin/MenuManager';
import { StatsOverview } from '../components/admin/StatsOverview';
import { QRGenerator } from '../components/admin/QRGenerator';
import { ReviewsList } from '../components/admin/ReviewsList';
import { Loader2 } from 'lucide-react';

export const AdminDashboardPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen ambient-gold-bg flex items-center justify-center text-stone-900 dark:text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5A93C]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen ambient-gold-bg text-stone-900 dark:text-white flex flex-col transition-colors duration-300">
      {/* Admin Navbar */}
      <AdminNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
      />

      {/* Main Tab Panels */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'orders' && <KDSBoard audioEnabled={audioEnabled} />}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'stats' && <StatsOverview />}
        {activeTab === 'qr' && <QRGenerator />}
        {activeTab === 'reviews' && <ReviewsList />}
      </main>
    </div>
  );
};
