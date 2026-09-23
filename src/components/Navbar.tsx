import React, { useState } from 'react';
import {
  Moon,
  ShoppingBag,
  Clock,
  User,
  ShieldCheck,
  ChefHat,
  Bell,
  Calendar,
  Heart,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenReservations: () => void;
  activeView: 'menu' | 'dashboard' | 'staff' | 'admin' | 'reviews';
  setActiveView: (view: 'menu' | 'dashboard' | 'staff' | 'admin' | 'reviews') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenReservations,
  activeView,
  setActiveView,
}) => {
  const { user, role, switchRole, isStaff, isAdmin } = useAuth();
  const { settings, isOpen } = useSettings();
  const { totalItemCount, calculation } = useCart();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getStatusBadge = () => {
    switch (settings.operating_status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OPEN TONIGHT
          </span>
        );
      case 'accepting_preorders':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Clock className="w-3 h-3" />
            PRE-ORDERS
          </span>
        );
      case 'temporarily_closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/60">
            PAUSED
          </span>
        );
      case 'closed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60">
            CLOSED
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-midnight-950/90 backdrop-blur-md border-b border-midnight-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('menu')}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 via-ember-500 to-amber-700 flex items-center justify-center shadow-lg shadow-gold-500/10">
              <Moon className="w-7 h-7 text-midnight-950 fill-midnight-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-wider text-slate-100">
                  MIDNIGHT FEAST
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-gold-500/80 tracking-widest uppercase font-mono">
                Gourmet Dining • 6:00 PM – 2:00 AM
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveView('menu')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'menu'
                  ? 'text-gold-400 bg-midnight-850 border border-midnight-700'
                  : 'text-slate-300 hover:text-white hover:bg-midnight-900'
              }`}
            >
              Menu
            </button>
            <button
              onClick={onOpenReservations}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-midnight-900 transition-colors"
            >
              <Calendar className="w-4 h-4 text-gold-500" />
              Table Reservation
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'text-gold-400 bg-midnight-850 border border-midnight-700'
                  : 'text-slate-300 hover:text-white hover:bg-midnight-900'
              }`}
            >
              My Orders & Account
            </button>
            <button
              onClick={() => setActiveView('reviews')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'reviews'
                  ? 'text-gold-400 bg-midnight-850 border border-midnight-700'
                  : 'text-slate-300 hover:text-white hover:bg-midnight-900'
              }`}
            >
              Reviews
            </button>

            {/* Operational Role Views */}
            {isStaff && (
              <button
                onClick={() => setActiveView('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ml-2 ${
                  activeView === 'staff'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-midnight-850 text-amber-400/80 hover:bg-amber-500/10 border border-midnight-700'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Staff Portal
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ml-1 ${
                  activeView === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-midnight-850 text-purple-400/80 hover:bg-purple-500/10 border border-midnight-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            )}
          </nav>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (unreadCount > 0) markAllAsRead();
                }}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-midnight-850 transition-colors border border-transparent hover:border-midnight-800"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gold-500 ring-2 ring-midnight-950 animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-midnight-900 border border-midnight-700/80 rounded-2xl shadow-2xl py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-midnight-800 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Order Notifications
                    </span>
                    <span className="text-[10px] text-gold-500/80 font-mono">Rule 34</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-midnight-850/80 border border-midnight-800 text-xs">
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button with Total & Count */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-600/20 to-amber-600/20 border border-gold-500/30 text-gold-400 hover:border-gold-500/60 hover:bg-gold-500/30 transition-all shadow-md group"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold-500 text-midnight-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold tracking-wide">
                ₹{calculation.subtotal.toFixed(2)}
              </span>
            </button>

            {/* Role Switcher Widget (Rule 2 & 3 demonstration) */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-midnight-850 hover:bg-midnight-800 border border-midnight-700/80 transition-colors"
                title="Switch active role"
              >
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={user?.full_name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-gold-500/50"
                />
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-200 line-clamp-1">{user?.full_name}</p>
                  <p className="text-[10px] text-gold-400 uppercase font-mono tracking-wider font-bold">
                    {role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-midnight-900 border border-midnight-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-midnight-800 mb-1">
                    <p className="text-xs font-semibold text-slate-300">System Role Simulator</p>
                    <p className="text-[10px] text-slate-500">Test permissions per Rule 3</p>
                  </div>

                  <button
                    onClick={() => {
                      switchRole('customer');
                      setShowRoleMenu(false);
                      setActiveView('menu');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      role === 'customer'
                        ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                        : 'text-slate-300 hover:bg-midnight-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-bold">Customer Role</p>
                      <p className="text-[10px] text-slate-400">Order, Cart, Track, Reviews</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('staff');
                      setShowRoleMenu(false);
                      setActiveView('staff');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors mt-1 ${
                      role === 'staff'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-300 hover:bg-midnight-800'
                    }`}
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-bold">Staff Role</p>
                      <p className="text-[10px] text-slate-400">Orders, Kitchen, Reservations</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('admin');
                      setShowRoleMenu(false);
                      setActiveView('admin');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors mt-1 ${
                      role === 'admin'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'text-slate-300 hover:bg-midnight-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-bold">Admin Role</p>
                      <p className="text-[10px] text-slate-400">Settings, Menu CRUD, Audits</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
