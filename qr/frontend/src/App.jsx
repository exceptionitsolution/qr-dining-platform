import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CustomerMenuPage } from './pages/CustomerMenuPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Customer Facing Routes */}
              <Route path="/" element={<CustomerMenuPage />} />
              <Route path="/menu" element={<CustomerMenuPage />} />
              <Route path="/order/:orderId" element={<OrderStatusPage />} />

              {/* Kitchen & Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: '16px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
