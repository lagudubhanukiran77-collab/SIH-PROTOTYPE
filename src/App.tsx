import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { OperatingStatusBanner } from './components/OperatingStatusBanner';
import { MenuCatalog } from './components/MenuCatalog';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracker } from './components/OrderTracker';
import { ReservationModal } from './components/ReservationModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { StaffPortal } from './components/StaffPortal';
import { AdminPortal } from './components/AdminPortal';
import { ReviewsView } from './components/ReviewsView';
import { Order, Reservation } from './types';
import { Moon, Sparkles, Shield, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isStaff, isAdmin } = useAuth();

  const [activeView, setActiveView] = useState<'menu' | 'dashboard' | 'staff' | 'admin' | 'reviews'>('menu');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const handleOrderSuccess = (order: Order) => {
    setTrackingOrder(order);
    setActiveView('menu');
  };

  const handleReservationCreated = (_res: Reservation) => {
    setActiveView('dashboard');
  };

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 flex flex-col justify-between selection:bg-gold-500 selection:text-midnight-950">
      <div>
        {/* Navigation & Status Header */}
        <Navbar
          onOpenCart={() => setIsCartOpen(true)}
          onOpenReservations={() => setIsReservationOpen(true)}
          activeView={activeView}
          setActiveView={(view) => {
            // Role Guard (Rule 2 & 3)
            if (view === 'admin' && !isAdmin) {
              alert('Access Restricted: Admin role required (Rule 3). Use the role selector in the navbar to test Admin.');
              return;
            }
            if (view === 'staff' && !isStaff) {
              alert('Access Restricted: Staff or Admin role required (Rule 3). Use the role selector in the navbar to test Staff.');
              return;
            }
            setTrackingOrder(null);
            setActiveView(view);
          }}
        />

        {/* Dynamic Business Status Banner (Rule 1 & 23) */}
        <OperatingStatusBanner />

        {/* Main Content Area */}
        <main className="pb-16">
          {trackingOrder ? (
            <OrderTracker
              order={trackingOrder}
              onBackToMenu={() => setTrackingOrder(null)}
            />
          ) : activeView === 'menu' ? (
            <MenuCatalog />
          ) : activeView === 'dashboard' ? (
            <CustomerDashboard
              onSelectOrder={(ord) => setTrackingOrder(ord)}
              onBrowseMenu={() => setActiveView('menu')}
            />
          ) : activeView === 'reviews' ? (
            <ReviewsView />
          ) : activeView === 'staff' ? (
            <StaffPortal />
          ) : activeView === 'admin' ? (
            <AdminPortal />
          ) : null}
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        onReservationCreated={handleReservationCreated}
      />

      {/* Footer */}
      <footer className="bg-midnight-900 border-t border-midnight-800/80 py-12 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-white tracking-wider">MIDNIGHT FEAST</span>
              <p className="text-[10px] text-slate-500">Fine Late-Night Dining • 6:00 PM – 2:00 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="text-gold-500/80 font-mono">37 Business Rules Enforced</span>
            <span>PostgreSQL & RLS Compliant</span>
            <span>Authoritative Server Pricing</span>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Midnight Feast. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <OrderProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </OrderProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
