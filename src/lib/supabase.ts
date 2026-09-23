import { createClient } from '@supabase/supabase-js';
import {
  RestaurantSettings,
  MenuItem,
  Category,
  Order,
  Reservation,
  Review,
  Coupon,
  Profile,
  AuditLog,
  Notification,
  UserAddress,
  UserRole,
} from '../types';
import { calculateOrderTotals } from './businessRules';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =============================================================================
// LOCAL IN-MEMORY / LOCALSTORAGE REACTIVE DATA ENGINE (DEVELOPMENT & DEMO MODE)
// =============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'mf_settings',
  CATEGORIES: 'mf_categories',
  MENU_ITEMS: 'mf_menu_items',
  ORDERS: 'mf_orders',
  RESERVATIONS: 'mf_reservations',
  REVIEWS: 'mf_reviews',
  COUPONS: 'mf_coupons',
  FAVORITES: 'mf_favorites',
  ADDRESSES: 'mf_addresses',
  AUDIT_LOGS: 'mf_audit_logs',
  NOTIFICATIONS: 'mf_notifications',
  CURRENT_USER: 'mf_current_user',
};

// Default seed data
const DEFAULT_SETTINGS: RestaurantSettings = {
  id: 1,
  restaurant_name: 'Midnight Feast',
  logo_url: '',
  address: '42 Starlight Boulevard, Gourmet District',
  phone: '+91 98765 43210',
  email: 'concierge@midnightfeast.com',
  operating_status: 'open',
  open_time: '18:00:00', // 6:00 PM
  close_time: '02:00:00', // 2:00 AM
  allow_late_ordering: false,
  allow_advance_ordering: true,
  tax_percentage: 5.0,
  delivery_fee: 40.0,
  free_delivery_threshold: 499.0,
  min_order_amount: 199.0,
  max_delivery_radius_km: 15.0,
  estimated_delivery_time_mins: 35,
  enable_delivery: true,
  enable_pickup: true,
  enable_dinein: true,
  total_tables: 24,
  seating_capacity: 96,
  max_guests_per_reservation: 12,
  reservation_duration_minutes: 90,
  reservation_cancel_window_hours: 2,
  enabled_payment_methods: ['razorpay_online', 'upi', 'card', 'cash_on_delivery', 'pay_at_restaurant'],
  updated_at: new Date().toISOString(),
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Late-Night Signatures',
    slug: 'signatures',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Wood-Fired Pizzas',
    slug: 'pizzas',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Gourmet Small Plates',
    slug: 'small-plates',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Artisanal Desserts',
    slug: 'desserts',
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Midnight Elixirs',
    slug: 'beverages',
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    category_id: 'cat-1',
    name: 'Truffle Wagyu Midnight Burger',
    description: 'Double smashed wagyu patty, black truffle aioli, smoked aged cheddar, activated charcoal brioche bun.',
    price: 549.0,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: false,
    availability: 'available',
    prep_time_minutes: 20,
    stock_quantity: 50,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-2',
    category_id: 'cat-1',
    name: 'Smoked Butter Chicken Slider Trio',
    description: 'Slow-cooked spiced tandoori pulled chicken in rich makhan gravy between mini butter-toasted milk buns.',
    price: 389.0,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: false,
    availability: 'available',
    prep_time_minutes: 25,
    stock_quantity: 40,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-3',
    category_id: 'cat-1',
    name: 'Wild Mushroom & Burrata Brioche',
    description: 'Pan-seared foraged wild mushrooms, whole artisanal burrata, rosemary garlic emulsion on toasted sourdough.',
    price: 429.0,
    image_url: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 15,
    stock_quantity: 30,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-4',
    category_id: 'cat-2',
    name: 'Midnight Black Truffle Pizza',
    description: 'Activated charcoal sourdough crust, white truffle oil, buffalo mozzarella, wild porcini, roasted garlic.',
    price: 599.0,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 22,
    stock_quantity: 25,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-5',
    category_id: 'cat-2',
    name: 'Spicy Pepperoni & Hot Honey',
    description: 'San Marzano tomato base, slow-cured spicy pork pepperoni, fior di latte, artisanal hot chili honey drizzle.',
    price: 529.0,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: false,
    availability: 'available',
    prep_time_minutes: 20,
    stock_quantity: 35,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-6',
    category_id: 'cat-2',
    name: 'Classic Margherita Di Bufala',
    description: 'Sweet Italian San Marzano tomatoes, fresh basil leaves, buffalo mozzarella, cold-pressed EVOO.',
    price: 449.0,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 18,
    stock_quantity: 50,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-7',
    category_id: 'cat-3',
    name: 'Parmesan Truffle Midnight Fries',
    description: 'Hand-cut triple-cooked potatoes tossed with shaved Grana Padano, parsley, and white truffle oil.',
    price: 249.0,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 12,
    stock_quantity: 100,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-8',
    category_id: 'cat-3',
    name: 'Crispy Golden Calamari Rings',
    description: 'Flash-fried coastal squid with garlic sea salt, smoked paprika, served with kaffir lime aioli.',
    price: 349.0,
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: false,
    availability: 'available',
    prep_time_minutes: 15,
    stock_quantity: 20,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-9',
    category_id: 'cat-3',
    name: 'Fire-Roasted Paneer Tikka Skewers',
    description: 'Cottage cheese cubes marinated in smoked hung curd, carom seeds, and crushed Himalayan spices.',
    price: 299.0,
    image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 18,
    stock_quantity: 40,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-10',
    category_id: 'cat-3',
    name: 'Tokyo Midnight Pork Gyoza',
    description: 'Pan-crisped handmade dumplings stuffed with Berkshire pork, scallions, ginger, chili rayu dip.',
    price: 329.0,
    image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: false,
    availability: 'temporarily_unavailable',
    prep_time_minutes: 16,
    stock_quantity: 0,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-11',
    category_id: 'cat-4',
    name: '70% Valrhona Dark Molten Lava',
    description: 'Warm Belgian chocolate cake with a molten truffle center, accompanied by Madagascar vanilla bean gelato.',
    price: 299.0,
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 14,
    stock_quantity: 25,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-12',
    category_id: 'cat-4',
    name: '24K Saffron Pistachio Panna Cotta',
    description: 'Silky Kashmiri saffron cream layered with crushed Iranian pistachios and edible 24-karat gold leaf.',
    price: 349.0,
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 10,
    stock_quantity: 15,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-13',
    category_id: 'cat-5',
    name: 'Smoked Rosemary & Blackberry Fizz',
    description: 'Clarified blackberry reduction, smoked rosemary syrup, botanical tonic, sparkling mountain water.',
    price: 189.0,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 8,
    stock_quantity: 80,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item-14',
    category_id: 'cat-5',
    name: 'Velvet Nitro Cold Brew',
    description: '18-hour cold steeped Ethiopian single-origin coffee infused with nitrogen for a silky Guinness-like cascade.',
    price: 169.0,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    is_vegetarian: true,
    availability: 'available',
    prep_time_minutes: 5,
    stock_quantity: 60,
    is_inventory_tracked: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'c-1',
    code: 'MIDNIGHT50',
    discount_type: 'percentage',
    discount_value: 20.0,
    min_order_amount: 399.0,
    max_discount_amount: 150.0,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 90).toISOString(),
    usage_limit: 500,
    per_user_limit: 1,
    times_used: 12,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-2',
    code: 'FEAST100',
    discount_type: 'fixed',
    discount_value: 100.0,
    min_order_amount: 599.0,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 90).toISOString(),
    usage_limit: 200,
    per_user_limit: 1,
    times_used: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-3',
    code: 'LATEOWL',
    discount_type: 'percentage',
    discount_value: 15.0,
    min_order_amount: 299.0,
    max_discount_amount: 100.0,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    usage_limit: 1000,
    per_user_limit: 1,
    times_used: 88,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    order_id: 'ord-initial-1',
    customer_id: 'user-customer-1',
    customer_name: 'Aarav Patel',
    rating: 5,
    comment: 'The Truffle Wagyu Burger was an absolute revelation at 1:00 AM! Unbelievably juicy and packaging arrived piping hot.',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev-2',
    order_id: 'ord-initial-2',
    customer_id: 'user-customer-2',
    customer_name: 'Dr. Priya Rao',
    rating: 5,
    comment: 'Midnight Black Truffle Pizza with that charcoal crust is Michelin-level late night luxury. Outstanding quality.',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

// Helper to get from local storage or set default
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

// Local simulation database
export const localDB = {
  getSettings(): RestaurantSettings {
    return getStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
  updateSettings(newSettings: Partial<RestaurantSettings>, userId?: string): RestaurantSettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings, updated_at: new Date().toISOString() };
    setStored(STORAGE_KEYS.SETTINGS, updated);

    this.logAudit({
      user_id: userId,
      action: 'UPDATE',
      resource: 'restaurant_settings',
      resource_id: '1',
      old_data: current as unknown as Record<string, unknown>,
      new_data: updated as unknown as Record<string, unknown>,
    });
    return updated;
  },

  getCategories(): Category[] {
    return getStored(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  },

  getMenuItems(): MenuItem[] {
    return getStored(STORAGE_KEYS.MENU_ITEMS, DEFAULT_MENU_ITEMS);
  },
  updateMenuItem(item: MenuItem, userId?: string): MenuItem {
    const items = this.getMenuItems();
    const idx = items.findIndex((i) => i.id === item.id);
    let oldItem: MenuItem | undefined;
    if (idx >= 0) {
      oldItem = items[idx];
      items[idx] = { ...item, updated_at: new Date().toISOString() };
    } else {
      items.push({ ...item, updated_at: new Date().toISOString() });
    }
    setStored(STORAGE_KEYS.MENU_ITEMS, items);

    this.logAudit({
      user_id: userId,
      action: idx >= 0 ? 'UPDATE' : 'INSERT',
      resource: 'menu_items',
      resource_id: item.id,
      old_data: oldItem as unknown as Record<string, unknown>,
      new_data: item as unknown as Record<string, unknown>,
    });
    return item;
  },

  deleteMenuItem(id: string, userId?: string): void {
    const items = this.getMenuItems();
    const oldItem = items.find((i) => i.id === id);
    const filtered = items.filter((i) => i.id !== id);
    setStored(STORAGE_KEYS.MENU_ITEMS, filtered);

    this.logAudit({
      user_id: userId,
      action: 'DELETE',
      resource: 'menu_items',
      resource_id: id,
      old_data: oldItem as unknown as Record<string, unknown>,
    });
  },

  getCoupons(): Coupon[] {
    return getStored(STORAGE_KEYS.COUPONS, DEFAULT_COUPONS);
  },

  getOrders(customerId?: string): Order[] {
    const all = getStored<Order[]>(STORAGE_KEYS.ORDERS, []);
    if (customerId) {
      return all.filter((o) => o.customer_id === customerId);
    }
    return all;
  },

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  },

  // Authoritative Trusted Order Creation (Server-Side Simulation of create_order_secure RPC)
  createOrderSecure(params: {
    customer_id: string;
    order_type: Order['order_type'];
    payment_method: string;
    items: Array<{ menu_item_id: string; quantity: number }>;
    applied_coupon_code?: string;
    delivery_address?: UserAddress;
    table_number?: number;
    customer_notes?: string;
    idempotency_key?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const orders = this.getOrders();

    // Idempotency check (Rule 32)
    if (params.idempotency_key) {
      const existing = orders.find((o) => o.idempotency_key === params.idempotency_key);
      if (existing) {
        return { success: true, order: existing };
      }
    }

    const settings = this.getSettings();
    const menuItems = this.getMenuItems();

    // Revalidate each item against DB authoritative data
    const calculationItems: Array<{ menuItem: MenuItem; quantity: number }> = [];
    for (const reqItem of params.items) {
      const dbItem = menuItems.find((m) => m.id === reqItem.menu_item_id);
      if (!dbItem) {
        return { success: false, error: `Menu item with ID ${reqItem.menu_item_id} not found.` };
      }
      if (dbItem.availability !== 'available') {
        return { success: false, error: `Item "${dbItem.name}" is currently unavailable.` };
      }
      calculationItems.push({ menuItem: dbItem, quantity: reqItem.quantity });
    }

    // Lookup coupon
    let coupon: Coupon | undefined;
    if (params.applied_coupon_code) {
      coupon = this.getCoupons().find(
        (c) => c.code.toUpperCase() === params.applied_coupon_code?.toUpperCase() && c.is_active
      );
    }

    // Authoritative recalculation (Rule 5, 6, 8, 9)
    const calculation = calculateOrderTotals({
      items: calculationItems,
      coupon,
      orderType: params.order_type,
      settings,
    });

    if (!calculation.meetsMinOrder) {
      return {
        success: false,
        error: `Order subtotal ₹${calculation.subtotal} does not meet minimum order of ₹${settings.min_order_amount}.`,
      };
    }

    const orderNumber = `MF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      order_number: orderNumber,
      customer_id: params.customer_id,
      order_type: params.order_type,
      order_status: 'pending',
      payment_status: 'pending',
      payment_method: params.payment_method,
      idempotency_key: params.idempotency_key,
      subtotal: calculation.subtotal,
      discount_amount: calculation.discount,
      applied_coupon_code: coupon ? coupon.code : undefined,
      tax_amount: calculation.tax,
      delivery_fee: calculation.deliveryFee,
      total_amount: calculation.total,
      delivery_address: params.delivery_address,
      table_number: params.table_number,
      customer_notes: params.customer_notes,
      items: calculationItems.map((c) => ({
        id: 'oi-' + Math.random().toString(36).substr(2, 9),
        order_id: 'ord-' + Date.now(),
        menu_item_id: c.menuItem.id,
        item_name: c.menuItem.name,
        item_price: c.menuItem.price,
        quantity: c.quantity,
        total_price: Number((c.menuItem.price * c.quantity).toFixed(2)),
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    setStored(STORAGE_KEYS.ORDERS, orders);

    // Create Notification
    this.addNotification({
      user_id: params.customer_id,
      title: `Order Received: ${orderNumber}`,
      message: `Your order for ₹${calculation.total} has been placed and is currently pending confirmation.`,
      type: 'order_status',
    });

    // Log Audit
    this.logAudit({
      user_id: params.customer_id,
      action: 'ORDER_CREATED',
      resource: 'orders',
      resource_id: newOrder.id,
      new_data: { total: newOrder.total_amount, order_number: orderNumber },
    });

    return { success: true, order: newOrder };
  },

  // Customer Cancellation RPC Simulation (Rule 13)
  customerCancelOrder(orderId: string, customerId: string, reason: string): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };
    if (order.customer_id !== customerId) {
      return { success: false, error: 'Unauthorized to cancel this order' };
    }
    // Strict Rule 13: Customer can cancel ONLY in 'pending' status
    if (order.order_status !== 'pending') {
      return {
        success: false,
        error: `Cancellation disabled: Food preparation has already started (status: ${order.order_status}).`,
      };
    }

    order.order_status = 'cancelled_by_customer';
    order.cancellation_reason = reason;
    order.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.ORDERS, orders);

    this.addNotification({
      user_id: customerId,
      title: `Order Cancelled: ${order.order_number}`,
      message: 'Your order was successfully cancelled.',
      type: 'order_status',
    });

    return { success: true };
  },

  // Operational Order Status Update Simulation (Rule 13: Staff / Admin)
  updateOrderStatusOperational(orderId: string, newStatus: Order['order_status'], staffId: string): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const oldStatus = order.order_status;
    order.order_status = newStatus;
    if (newStatus === 'completed' && order.payment_status === 'pending') {
      order.payment_status = 'paid';
    }
    order.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.ORDERS, orders);

    this.logAudit({
      user_id: staffId,
      action: 'STATUS_TRANSITION',
      resource: 'orders',
      resource_id: orderId,
      old_data: { status: oldStatus },
      new_data: { status: newStatus },
    });

    this.addNotification({
      user_id: order.customer_id,
      title: `Order Update: ${order.order_number}`,
      message: `Your order is now: ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
      type: 'order_status',
    });

    return { success: true };
  },

  // Process Refund (Rule 16)
  processRefund(orderId: string, reason: string, staffId: string): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    order.payment_status = 'refunded';
    order.cancellation_reason = `Refunded: ${reason}`;
    order.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.ORDERS, orders);

    this.logAudit({
      user_id: staffId,
      action: 'REFUND_PROCESSED',
      resource: 'orders',
      resource_id: orderId,
      new_data: { reason, refund_amount: order.total_amount },
    });

    this.addNotification({
      user_id: order.customer_id,
      title: `Refund Initiated: ${order.order_number}`,
      message: `A full refund of ₹${order.total_amount} has been processed. Reason: ${reason}`,
      type: 'payment',
    });

    return { success: true };
  },

  // Reservations
  getReservations(customerId?: string): Reservation[] {
    const all = getStored<Reservation[]>(STORAGE_KEYS.RESERVATIONS, []);
    if (customerId) {
      return all.filter((r) => r.customer_id === customerId);
    }
    return all;
  },

  createReservation(reservation: Omit<Reservation, 'id' | 'status' | 'created_at' | 'updated_at'>): { success: boolean; reservation?: Reservation; error?: string } {
    const reservations = this.getReservations();
    const newRes: Reservation = {
      ...reservation,
      id: 'res-' + Date.now(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    reservations.unshift(newRes);
    setStored(STORAGE_KEYS.RESERVATIONS, reservations);

    this.addNotification({
      user_id: reservation.customer_id,
      title: 'Reservation Request Received',
      message: `Table for ${reservation.guest_count} on ${reservation.reservation_date} at ${reservation.reservation_time} is pending confirmation.`,
      type: 'reservation',
    });

    return { success: true, reservation: newRes };
  },

  updateReservationStatus(id: string, status: Reservation['status'], staffId: string): { success: boolean } {
    const reservations = this.getReservations();
    const res = reservations.find((r) => r.id === id);
    if (!res) return { success: false };

    res.status = status;
    res.updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.RESERVATIONS, reservations);

    this.logAudit({
      user_id: staffId,
      action: 'RESERVATION_STATUS',
      resource: 'reservations',
      resource_id: id,
      new_data: { status },
    });

    this.addNotification({
      user_id: res.customer_id,
      title: `Reservation ${status.toUpperCase()}`,
      message: `Your reservation for ${res.reservation_date} is now ${status}.`,
      type: 'reservation',
    });

    return { success: true };
  },

  // Reviews
  getReviews(): Review[] {
    return getStored<Review[]>(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
  },

  submitReview(review: Omit<Review, 'id' | 'status' | 'created_at'>): { success: boolean; review?: Review; error?: string } {
    const reviews = this.getReviews();
    // Rule 20: Prevent duplicate reviews for same order
    const existing = reviews.find((r) => r.order_id === review.order_id && r.customer_id === review.customer_id);
    if (existing) {
      return { success: false, error: 'You have already reviewed this eligible purchase.' };
    }

    const newRev: Review = {
      ...review,
      id: 'rev-' + Date.now(),
      status: 'pending_approval', // Rule 20: Moderation required
      created_at: new Date().toISOString(),
    };
    reviews.unshift(newRev);
    setStored(STORAGE_KEYS.REVIEWS, reviews);
    return { success: true, review: newRev };
  },

  moderateReview(reviewId: string, status: 'approved' | 'rejected', staffId: string): { success: boolean } {
    const reviews = this.getReviews();
    const rev = reviews.find((r) => r.id === reviewId);
    if (!rev) return { success: false };
    rev.status = status;
    rev.moderated_by = staffId;
    rev.moderated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.REVIEWS, reviews);

    this.logAudit({
      user_id: staffId,
      action: 'REVIEW_MODERATED',
      resource: 'reviews',
      resource_id: reviewId,
      new_data: { status },
    });

    return { success: true };
  },

  // Favorites (Rule 21)
  getFavorites(userId: string): string[] {
    const all = getStored<Record<string, string[]>>(STORAGE_KEYS.FAVORITES, {});
    return all[userId] || [];
  },

  toggleFavorite(userId: string, menuItemId: string): boolean {
    const all = getStored<Record<string, string[]>>(STORAGE_KEYS.FAVORITES, {});
    const userFavs = all[userId] || [];
    let isFav = false;
    if (userFavs.includes(menuItemId)) {
      all[userId] = userFavs.filter((id) => id !== menuItemId);
      isFav = false;
    } else {
      all[userId] = [...userFavs, menuItemId];
      isFav = true;
    }
    setStored(STORAGE_KEYS.FAVORITES, all);
    return isFav;
  },

  // Addresses (Rule 10)
  getAddresses(userId: string): UserAddress[] {
    const all = getStored<UserAddress[]>(STORAGE_KEYS.ADDRESSES, [
      {
        id: 'addr-default-1',
        user_id: 'user-customer-1',
        full_name: 'Aarav Patel',
        phone: '+91 98765 00001',
        address_line: 'Penthouse 14B, Starlight Heights, Park View',
        city: 'Metropolis',
        state: 'State',
        postal_code: '400001',
        landmark: 'Near Celestial Tower',
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ]);
    return all.filter((a) => a.user_id === userId);
  },

  saveAddress(address: UserAddress): UserAddress {
    const all = getStored<UserAddress[]>(STORAGE_KEYS.ADDRESSES, []);
    const idx = all.findIndex((a) => a.id === address.id);
    if (idx >= 0) {
      all[idx] = address;
    } else {
      all.push(address);
    }
    setStored(STORAGE_KEYS.ADDRESSES, all);
    return address;
  },

  // Audit Logs (Rule 30)
  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  logAudit(entry: Omit<AuditLog, 'id' | 'created_at'>): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      ...entry,
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    });
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  // Notifications (Rule 34)
  getNotifications(userId: string): Notification[] {
    const all = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter((n) => n.user_id === userId);
  },

  addNotification(n: Omit<Notification, 'id' | 'is_read' | 'created_at'>): void {
    const all = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift({
      ...n,
      id: 'notif-' + Date.now(),
      is_read: false,
      created_at: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
  },

  markNotificationsRead(userId: string): void {
    const all = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    for (const n of all) {
      if (n.user_id === userId) n.is_read = true;
    }
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
  },
};
