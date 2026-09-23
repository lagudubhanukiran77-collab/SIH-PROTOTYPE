import React, { useState, useEffect } from 'react';
import {
  User,
  ShoppingBag,
  Calendar,
  Heart,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useOrder } from '../context/OrderContext';
import { localDB } from '../lib/supabase';
import { canCancelReservation } from '../lib/businessRules';
import { Reservation, Review, MenuItem, Order } from '../types';

interface CustomerDashboardProps {
  onSelectOrder: (order: Order) => void;
  onBrowseMenu: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onSelectOrder,
  onBrowseMenu,
}) => {
  const { user, updateProfile } = useAuth();
  const { settings } = useSettings();
  const { orders } = useOrder();

  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'favorites' | 'profile'>('orders');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Review submission modal / inline state (Rule 20)
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [reviewStatusMsg, setReviewStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setReservations(localDB.getReservations(user.id));
      const favIds = localDB.getFavorites(user.id);
      const allItems = localDB.getMenuItems();
      setFavorites(allItems.filter((i) => favIds.includes(i.id)));
      setUserReviews(localDB.getReviews().filter((r) => r.customer_id === user.id));
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName, phone });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleCancelReservation = (res: Reservation) => {
    // Rule 19: Check cancellation window
    const check = canCancelReservation({
      reservationDate: res.reservation_date,
      reservationTime: res.reservation_time,
      settings,
    });

    if (!check.allowed) {
      alert(check.reason);
      return;
    }

    if (confirm('Are you sure you wish to cancel this table reservation?')) {
      localDB.updateReservationStatus(res.id, 'cancelled', user?.id || 'customer');
      if (user) setReservations(localDB.getReservations(user.id));
    }
  };

  const handleSubmitReview = (orderId: string) => {
    if (!comment.trim() || !user) return;
    const res = localDB.submitReview({
      order_id: orderId,
      customer_id: user.id,
      customer_name: user.full_name,
      rating,
      comment: comment.trim(),
    });

    if (res.success) {
      setReviewStatusMsg('Review submitted for moderation! Thank you (Rule 20).');
      setComment('');
      setReviewOrderId(null);
      setUserReviews(localDB.getReviews().filter((r) => r.customer_id === user.id));
      setTimeout(() => setReviewStatusMsg(null), 3500);
    } else {
      setReviewStatusMsg(res.error || 'Failed to submit review.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-midnight-800">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={user?.full_name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gold-500/40 shadow-xl"
          />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {user?.full_name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer Account • {user?.phone || 'No phone added'}
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 bg-midnight-900 p-1.5 rounded-2xl border border-midnight-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-gold-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reservations'
                ? 'bg-gold-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Reservations ({reservations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'favorites'
                ? 'bg-gold-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-gold-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {reviewStatusMsg && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{reviewStatusMsg}</span>
        </div>
      )}

      {/* Tab 1: Orders (Rule 2, 20, 26, 33) */}
      {activeTab === 'orders' && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-white">Your Orders History (Rule 33)</h2>
            <span className="text-xs text-slate-500 font-mono">
              Protected by Customer RLS (Rule 26)
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-midnight-900/50 rounded-3xl border border-midnight-800">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-300">No orders placed yet</p>
              <button
                onClick={onBrowseMenu}
                className="mt-4 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs rounded-xl shadow"
              >
                Browse Midnight Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const alreadyReviewed = userReviews.some((r) => r.order_id === order.id);

                return (
                  <div
                    key={order.id}
                    className="p-5 bg-midnight-900 border border-midnight-800 rounded-2xl hover:border-gold-500/30 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-midnight-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gold-400">
                            {order.order_number}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Type: <strong className="uppercase text-slate-200">{order.order_type}</strong>{' '}
                          • Total: <strong className="text-gold-400 font-mono">₹{order.total_amount.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                            order.order_status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : order.order_status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              : order.order_status.startsWith('cancelled')
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {order.order_status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => onSelectOrder(order)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-midnight-800 hover:bg-midnight-750 text-slate-200 text-xs font-bold rounded-xl border border-midnight-700 transition-colors"
                        >
                          <span>Track</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {order.items?.map((item) => (
                        <span
                          key={item.id}
                          className="bg-midnight-950 px-2.5 py-1 rounded-lg border border-midnight-800"
                        >
                          {item.quantity}x {item.item_name}
                        </span>
                      ))}
                    </div>

                    {/* Review Eligible Completed Orders (Rule 20) */}
                    {order.order_status === 'completed' && (
                      <div className="pt-2 border-t border-midnight-800/60">
                        {alreadyReviewed ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Review submitted for this purchase.</span>
                          </div>
                        ) : reviewOrderId === order.id ? (
                          <div className="p-4 bg-midnight-950 rounded-xl border border-midnight-800 space-y-3">
                            <p className="text-xs font-bold text-slate-200">
                              Write a Review for Order {order.order_number} (Rule 20)
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Rating:</span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="text-gold-400 p-0.5"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      star <= rating ? 'fill-gold-500' : 'text-slate-600'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={2}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="How was the midnight dining experience?"
                              className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSubmitReview(order.id)}
                                className="px-3.5 py-1.5 bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs rounded-lg"
                              >
                                Submit for Moderation
                              </button>
                              <button
                                onClick={() => setReviewOrderId(null)}
                                className="text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewOrderId(order.id);
                              setRating(5);
                              setComment('');
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:text-gold-300"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Rate & Review this order</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reservations (Rule 17, 18, 19) */}
      {activeTab === 'reservations' && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-white">Your Table Reservations</h2>
            <span className="text-xs text-slate-400">
              Cancellation permitted up to {settings.reservation_cancel_window_hours} hours prior
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16 bg-midnight-900/50 rounded-3xl border border-midnight-800">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-300">No reservations requested</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map((res) => {
                const canCancel =
                  res.status === 'pending' || res.status === 'confirmed';

                return (
                  <div
                    key={res.id}
                    className="p-5 bg-midnight-900 border border-midnight-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gold-500" />
                        <span className="text-xs font-bold text-slate-200">
                          {res.reservation_date} • {res.reservation_time}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          res.status === 'confirmed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : res.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Guests: <strong className="text-slate-200">{res.guest_count} persons</strong></p>
                      {res.special_requests && (
                        <p>Special Request: <em className="text-slate-300">{res.special_requests}</em></p>
                      )}
                    </div>

                    {/* Cancellation Action (Rule 19) */}
                    {canCancel && (
                      <div className="pt-2 border-t border-midnight-800 flex justify-end">
                        <button
                          onClick={() => handleCancelReservation(res)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Cancel Reservation (Rule 19)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Favorites (Rule 21) */}
      {activeTab === 'favorites' && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-white">Your Saved Favorites (Rule 21)</h2>
            <p className="text-xs text-slate-400">
              Unavailable dishes remain visible with real-time status
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-16 bg-midnight-900/50 rounded-3xl border border-midnight-800">
              <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-300">No favorite dishes added</p>
              <button
                onClick={onBrowseMenu}
                className="mt-4 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs rounded-xl shadow"
              >
                Browse Menu to Favorite Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((item) => {
                const isAvail = item.availability === 'available';
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-midnight-900 border border-midnight-800 rounded-2xl flex items-center gap-4"
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                      <p className="text-xs font-mono font-bold text-gold-400 mt-0.5">
                        ₹{item.price.toFixed(2)}
                      </p>
                      <div className="mt-1">
                        {isAvail ? (
                          <span className="text-[10px] text-emerald-400 font-bold">● Available Tonight</span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold">● Currently Sold Out</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile & Security (Rule 2: Customers cannot change role) */}
      {activeTab === 'profile' && (
        <div className="py-8 max-w-xl space-y-6">
          <h2 className="font-serif text-lg font-bold text-white">Profile Details (Rule 2)</h2>

          {profileSaved && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 bg-midnight-900 p-6 rounded-2xl border border-midnight-800">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Role (Strictly Locked)</label>
              <input
                type="text"
                value="customer"
                disabled
                className="w-full px-3.5 py-2.5 bg-midnight-950/60 border border-midnight-800 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rule 2: Customers cannot alter their assigned role or access staff/admin panels.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs rounded-xl transition-all shadow"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
