import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Settings,
  BookOpen,
  DollarSign,
  MessageSquare,
  Users,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { localDB } from '../lib/supabase';
import {
  RestaurantSettings,
  MenuItem,
  Category,
  Order,
  Review,
  AuditLog,
  RestaurantStatus,
} from '../types';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<
    'settings' | 'menu' | 'orders' | 'reviews' | 'audit'
  >('settings');

  // Settings form state
  const [formData, setFormData] = useState<RestaurantSettings>(settings);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // Orders and refunds state (Rule 16)
  const [orders, setOrders] = useState<Order[]>([]);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('Customer cancellation request');

  // Reviews moderation state (Rule 20)
  const [reviews, setReviews] = useState<Review[]>([]);

  // Audit logs state (Rule 30)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadAll = () => {
    setMenuItems(localDB.getMenuItems());
    setCategories(localDB.getCategories());
    setOrders(localDB.getOrders());
    setReviews(localDB.getReviews());
    setAuditLogs(localDB.getAuditLogs());
  };

  useEffect(() => {
    loadAll();
    setFormData(settings);
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2500);
  };

  const handleSaveMenuItem = (item: MenuItem) => {
    localDB.updateMenuItem(item, user?.id);
    setShowItemModal(false);
    setEditingItem(null);
    loadAll();
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this menu item?')) {
      localDB.deleteMenuItem(id, user?.id);
      loadAll();
    }
  };

  const handleRefund = (orderId: string) => {
    if (!refundReason.trim()) return;
    localDB.processRefund(orderId, refundReason, user?.id || 'admin');
    setRefundOrderId(null);
    loadAll();
  };

  const handleModerateReview = (reviewId: string, status: 'approved' | 'rejected') => {
    localDB.moderateReview(reviewId, status, user?.id || 'admin');
    loadAll();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-midnight-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Restaurant Administration
              </h1>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-mono font-bold">
                FULL ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rules Configuration (Rule 1, 6, 8, 9, 29) • Menu Management • Refunds • Moderation • Audit Logs
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-midnight-900 p-1.5 rounded-2xl border border-midnight-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Menu CRUD</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Orders & Refunds</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reviews'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reviews ({reviews.filter((r) => r.status === 'pending_approval').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {settingsSuccess && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Restaurant settings updated and logged to audit system!</span>
        </div>
      )}

      {/* Tab 1: Restaurant Settings (Rule 1, 6, 8, 9, 11, 18, 19, 23, 29) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="py-8 space-y-8 max-w-4xl">
          {/* Operating Status & Business Hours */}
          <div className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <span>Operating Status & Hours (Rule 1 & 23)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Current Operating Status
                </label>
                <select
                  value={formData.operating_status}
                  onChange={(e) =>
                    setFormData({ ...formData, operating_status: e.target.value as RestaurantStatus })
                  }
                  className="w-full px-3.5 py-2.5 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="open">Open (Standard service)</option>
                  <option value="accepting_preorders">Accepting Pre-orders (Advance ordering)</option>
                  <option value="temporarily_closed">Temporarily Closed (Kitchen pause)</option>
                  <option value="closed">Closed (Full closure)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Open Time</label>
                  <input
                    type="time"
                    value={formData.open_time.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value + ':00' })}
                    className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Close Time</label>
                  <input
                    type="time"
                    value={formData.close_time.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value + ':00' })}
                    className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_late_ordering}
                  onChange={(e) => setFormData({ ...formData, allow_late_ordering: e.target.checked })}
                  className="rounded text-purple-600"
                />
                Allow Late Ordering (Outside regular hours)
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_advance_ordering}
                  onChange={(e) => setFormData({ ...formData, allow_advance_ordering: e.target.checked })}
                  className="rounded text-purple-600"
                />
                Allow Advance Scheduled Orders (Rule 24)
              </label>
            </div>
          </div>

          {/* Pricing, Tax & Delivery Rules (Rule 6, 8, 9) */}
          <div className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-white">
              Pricing, Tax & Delivery Configurations (Rule 6, 8, 9)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Tax Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Configurable, never hardcoded</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Minimum Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Cart restriction (Rule 8)</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Base Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Free Delivery Threshold (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.free_delivery_threshold}
                  onChange={(e) => setFormData({ ...formData, free_delivery_threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reservation Rules (Rule 18 & 19) */}
          <div className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-white">
              Dining & Reservation Configuration (Rule 18 & 19)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Total Tables</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_tables}
                  onChange={(e) => setFormData({ ...formData, total_tables: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.seating_capacity}
                  onChange={(e) => setFormData({ ...formData, seating_capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Max Guests / Party</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_guests_per_reservation}
                  onChange={(e) => setFormData({ ...formData, max_guests_per_reservation: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Cancel Window (Hours)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reservation_cancel_window_hours}
                  onChange={(e) => setFormData({ ...formData, reservation_cancel_window_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Restaurant Settings</span>
          </button>
        </form>
      )}

      {/* Tab 2: Menu CRUD (Rule 4) */}
      {activeTab === 'menu' && (
        <div className="py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-white">Menu Item Catalog</h3>
            <button
              onClick={() => {
                setEditingItem({
                  id: 'item-' + Date.now(),
                  category_id: categories[0]?.id || 'cat-1',
                  name: '',
                  description: '',
                  price: 299,
                  image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                  is_vegetarian: true,
                  availability: 'available',
                  prep_time_minutes: 20,
                  stock_quantity: 50,
                  is_inventory_tracked: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                setShowItemModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-midnight-900 border border-midnight-800 rounded-2xl p-4 flex gap-4 items-start"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                  <p className="text-xs font-mono font-bold text-gold-400 mt-1">₹{item.price}</p>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                      item.availability === 'available'
                        ? 'bg-emerald-950 text-emerald-400'
                        : item.availability === 'hidden'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {item.availability.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowItemModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white bg-midnight-800 rounded-lg"
                    title="Edit item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-midnight-800 rounded-lg"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit / Add Modal */}
          {showItemModal && editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-midnight-900 border border-midnight-800 rounded-2xl p-6 space-y-4">
                <h4 className="font-serif text-base font-bold text-white">
                  {editingItem.id.startsWith('item-') ? 'Edit Menu Item' : 'Create Menu Item'}
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Dish Name</label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        value={editingItem.price}
                        onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Prep Time (mins)</label>
                      <input
                        type="number"
                        min="1"
                        value={editingItem.prep_time_minutes}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, prep_time_minutes: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Availability</label>
                      <select
                        value={editingItem.availability}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            availability: e.target.value as MenuItem['availability'],
                          })
                        }
                        className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200"
                      >
                        <option value="available">Available</option>
                        <option value="temporarily_unavailable">Temporarily Unavailable</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Dietary</label>
                      <select
                        value={editingItem.is_vegetarian ? 'veg' : 'nonveg'}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, is_vegetarian: e.target.value === 'veg' })
                        }
                        className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200"
                      >
                        <option value="veg">Vegetarian</option>
                        <option value="nonveg">Non-Vegetarian</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Image URL</label>
                    <input
                      type="text"
                      value={editingItem.image_url}
                      onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveMenuItem(editingItem)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Orders & Refund Rules (Rule 16) */}
      {activeTab === 'orders' && (
        <div className="py-8 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white mb-4">
            Orders & Controlled Refunds (Rule 16)
          </h3>

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-midnight-900 border border-midnight-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400">{ord.order_number}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-bold uppercase">
                      {ord.order_status.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded font-mono ${
                        ord.payment_status === 'refunded'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : ord.payment_status === 'paid'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {ord.payment_status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    Amount: <strong className="text-gold-400 font-mono">₹{ord.total_amount}</strong> • Customer: {ord.delivery_address?.full_name || 'Guest'}
                  </p>
                  {ord.cancellation_reason && (
                    <p className="text-rose-400 text-[11px] mt-0.5">{ord.cancellation_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ord.payment_status !== 'refunded' ? (
                    refundOrderId === ord.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="Refund reason..."
                          className="px-2 py-1 bg-midnight-950 border border-midnight-800 rounded text-xs text-slate-200"
                        />
                        <button
                          onClick={() => handleRefund(ord.id)}
                          className="px-2.5 py-1 bg-purple-600 text-white rounded font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setRefundOrderId(null)}
                          className="text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRefundOrderId(ord.id)}
                        className="px-3 py-1.5 bg-midnight-800 hover:bg-midnight-750 text-purple-300 rounded-xl border border-midnight-700"
                      >
                        Initiate Refund (Rule 16)
                      </button>
                    )
                  ) : (
                    <span className="text-purple-400 font-bold font-mono">Refund Complete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Reviews Moderation (Rule 20) */}
      {activeTab === 'reviews' && (
        <div className="py-8 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white mb-2">
            Review Moderation Queue (Rule 20)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Only approved reviews are publicly displayed on the restaurant storefront.
          </p>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-midnight-900 border border-midnight-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{rev.customer_name || 'Customer'}</span>
                    <span className="text-gold-400 font-bold">★ {rev.rating}/5</span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${
                        rev.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400'
                          : rev.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {rev.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 italic">"{rev.comment}"</p>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleModerateReview(rev.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                    >
                      Approve Public
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerateReview(rev.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl border border-rose-800"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs (Rule 30) */}
      {activeTab === 'audit' && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-white">
              System Audit Logs (Rule 30)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Immutable Admin Activity Log
            </span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-midnight-900 border border-midnight-800 rounded-xl font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-purple-400">[{log.action}]</span>{' '}
                  <span className="text-slate-300">{log.resource}</span>{' '}
                  {log.resource_id && <span className="text-slate-500">#{log.resource_id}</span>}
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
