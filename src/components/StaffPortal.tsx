import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Package,
  Bike,
  CheckCircle2,
  Calendar,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  Filter,
  UserCheck,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus, Reservation, MenuItem } from '../types';
import { localDB } from '../lib/supabase';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';

export const StaffPortal: React.FC = () => {
  const { user } = useAuth();
  const { staffUpdateStatus } = useOrder();

  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = () => {
    setOrders(localDB.getOrders());
    setReservations(localDB.getReservations());
    setMenuItems(localDB.getMenuItems());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // 5s polling for kitchen
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const res = await staffUpdateStatus(orderId, nextStatus);
    if (res.success) {
      loadData();
      setStatusMessage(`Order updated to ${nextStatus.replace(/_/g, ' ').toUpperCase()}`);
      setTimeout(() => setStatusMessage(null), 2500);
    } else {
      alert(res.error || 'Failed to update order');
    }
  };

  const handleUpdateReservation = (resId: string, newStatus: Reservation['status']) => {
    localDB.updateReservationStatus(resId, newStatus, user?.id || 'staff');
    loadData();
    setStatusMessage(`Reservation marked as ${newStatus.toUpperCase()}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleToggleMenuAvailability = (item: MenuItem) => {
    const newAvail =
      item.availability === 'available' ? 'temporarily_unavailable' : 'available';
    localDB.updateMenuItem({ ...item, availability: newAvail }, user?.id);
    loadData();
    setStatusMessage(`"${item.name}" availability set to ${newAvail.toUpperCase()}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.order_status);
    }
    return o.order_status === orderStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-midnight-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Operations & Kitchen Portal
              </h1>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-mono font-bold">
                STAFF LEAST PRIVILEGE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Order Pipeline (Rule 12 & 13) • Table Reservations • Quick Availability Toggle
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-midnight-900 p-1.5 rounded-2xl border border-midnight-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders Pipeline ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reservations'
                ? 'bg-amber-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-midnight-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Item Availability ({menuItems.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 bg-amber-950/80 border border-amber-800 text-amber-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tab 1: Orders Pipeline */}
      {activeTab === 'orders' && (
        <div className="py-8 space-y-6">
          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'active', label: 'Active Pipeline' },
              { id: 'pending', label: 'Pending (New)' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'preparing', label: 'In Kitchen' },
              { id: 'ready', label: 'Ready for Pickup' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'completed', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  orderStatusFilter === f.id
                    ? 'bg-midnight-800 text-amber-400 border border-amber-500/50'
                    : 'bg-midnight-900/60 text-slate-400 hover:text-white border border-midnight-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-midnight-900/40 rounded-3xl border border-midnight-800">
              <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-bold">No orders found in this view</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((ord) => {
                return (
                  <div
                    key={ord.id}
                    className="bg-midnight-900 border border-midnight-800 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-xl"
                  >
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between pb-3 border-b border-midnight-800 mb-3">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {ord.order_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            ord.order_status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : ord.order_status === 'pending'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : ord.order_status === 'preparing'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {ord.order_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Customer & Type */}
                      <div className="text-xs text-slate-300 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 uppercase">
                            {ord.order_type.replace(/_/g, ' ')}
                            {ord.table_number ? ` (Table #${ord.table_number})` : ''}
                          </span>
                          <span className="font-mono font-bold text-gold-400">
                            ₹{ord.total_amount.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {ord.customer_notes && (
                          <div className="mt-1.5 p-2 bg-midnight-950 rounded-lg border border-midnight-800 text-[11px] text-amber-300/90">
                            <strong>Note:</strong> {ord.customer_notes}
                          </div>
                        )}
                      </div>

                      {/* Items list */}
                      <div className="space-y-1.5 py-2 border-t border-midnight-800 text-xs">
                        {ord.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-slate-300">
                            <span>
                              <strong className="text-amber-400 font-mono">{item.quantity}x</strong>{' '}
                              {item.item_name}
                            </span>
                            <span className="font-mono text-slate-400">
                              ₹{item.total_price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Action Buttons (Rule 12 & 13) */}
                    <div className="mt-4 pt-3 border-t border-midnight-800 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Advance Order Status:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ord.order_status === 'pending' && (
                          <button
                            onClick={() => handleAdvanceStatus(ord.id, 'confirmed')}
                            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-midnight-950 font-bold text-xs rounded-lg shadow"
                          >
                            Confirm Order
                          </button>
                        )}
                        {ord.order_status === 'confirmed' && (
                          <button
                            onClick={() => handleAdvanceStatus(ord.id, 'preparing')}
                            className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow"
                          >
                            Start Prep (In Kitchen)
                          </button>
                        )}
                        {ord.order_status === 'preparing' && (
                          <button
                            onClick={() => handleAdvanceStatus(ord.id, 'ready')}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.order_status === 'ready' && ord.order_type === 'delivery' && (
                          <button
                            onClick={() => handleAdvanceStatus(ord.id, 'out_for_delivery')}
                            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow"
                          >
                            Out for Delivery
                          </button>
                        )}
                        {(ord.order_status === 'ready' || ord.order_status === 'out_for_delivery') && (
                          <button
                            onClick={() => handleAdvanceStatus(ord.id, 'completed')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow"
                          >
                            Complete Order
                          </button>
                        )}
                        {!ord.order_status.startsWith('cancelled') && ord.order_status !== 'completed' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for restaurant cancellation:');
                              if (reason) {
                                localDB.updateOrderStatusOperational(ord.id, 'cancelled_by_restaurant', user?.id || 'staff');
                                loadData();
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs rounded-lg border border-rose-800"
                            title="Cancel order"
                          >
                            Cancel
                          </button>
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

      {/* Tab 2: Reservations Management */}
      {activeTab === 'reservations' && (
        <div className="py-8 space-y-4">
          <h2 className="font-serif text-lg font-bold text-white mb-4">
            Guest Table Reservations (Rule 17 & 18)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="bg-midnight-900 border border-midnight-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-midnight-800">
                  <span className="font-bold text-xs text-slate-200">{r.customer_name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      r.status === 'confirmed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : r.status === 'pending'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Date & Time: <strong className="text-slate-200">{r.reservation_date} at {r.reservation_time}</strong></p>
                  <p>Party Size: <strong className="text-slate-200">{r.guest_count} guests</strong></p>
                  <p>Contact: <span className="font-mono">{r.customer_phone}</span></p>
                  {r.special_requests && (
                    <p className="text-amber-300/80">Request: {r.special_requests}</p>
                  )}
                </div>

                {/* Reservation Action Buttons */}
                <div className="pt-3 border-t border-midnight-800 flex flex-wrap gap-2 text-xs">
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateReservation(r.id, 'confirmed')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                    >
                      Confirm Table
                    </button>
                  )}
                  {r.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateReservation(r.id, 'completed')}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow"
                    >
                      Mark Seated/Completed
                    </button>
                  )}
                  {r.status !== 'cancelled' && r.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateReservation(r.id, 'no_show')}
                      className="px-3 py-1.5 bg-midnight-800 hover:bg-midnight-750 text-slate-400 rounded-lg border border-midnight-700"
                    >
                      No Show
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Menu Item Quick Availability Toggle (Rule 4 & 25) */}
      {activeTab === 'menu' && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                Live Kitchen Item Availability (Rule 4)
              </h2>
              <p className="text-xs text-slate-400">
                Instantly mark dishes Available or Temporarily Unavailable when kitchen runs out
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const isAvailable = item.availability === 'available';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isAvailable
                      ? 'bg-midnight-900 border-midnight-800'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                      <span className="text-xs font-mono text-gold-400">₹{item.price}</span>
                      <div className="mt-0.5">
                        {isAvailable ? (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-bold uppercase">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleMenuAvailability(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isAvailable
                        ? 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                    }`}
                  >
                    {isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
