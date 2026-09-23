// DOMAIN TYPES FOR MIDNIGHT FEAST (37 Business Rules)

export type UserRole = 'customer' | 'staff' | 'admin';

export type RestaurantStatus = 'open' | 'closed' | 'temporarily_closed' | 'accepting_preorders';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_restaurant'
  | 'payment_failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export type ItemAvailability = 'available' | 'temporarily_unavailable' | 'hidden';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type ReviewStatus = 'pending_approval' | 'approved' | 'rejected';

export type DiscountType = 'percentage' | 'fixed';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id: number;
  restaurant_name: string;
  logo_url?: string;
  address: string;
  phone: string;
  email: string;
  operating_status: RestaurantStatus;
  open_time: string; // e.g. "18:00:00" (6:00 PM)
  close_time: string; // e.g. "02:00:00" (2:00 AM)
  allow_late_ordering: boolean;
  allow_advance_ordering: boolean;
  tax_percentage: number; // e.g. 5.0
  delivery_fee: number; // e.g. 40
  free_delivery_threshold: number; // e.g. 499
  min_order_amount: number; // e.g. 199
  max_delivery_radius_km: number;
  estimated_delivery_time_mins: number;
  enable_delivery: boolean;
  enable_pickup: boolean;
  enable_dinein: boolean;
  total_tables: number;
  seating_capacity: number;
  max_guests_per_reservation: number;
  reservation_duration_minutes: number;
  reservation_cancel_window_hours: number;
  enabled_payment_methods: string[];
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // Database is authoritative source
  image_url: string;
  is_vegetarian: boolean;
  availability: ItemAvailability;
  prep_time_minutes: number;
  stock_quantity?: number;
  is_inventory_tracked: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  landmark?: string;
  is_default: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  start_date: string;
  expiry_date: string;
  usage_limit?: number;
  per_user_limit: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_type: OrderType;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  idempotency_key?: string;
  subtotal: number;
  discount_amount: number;
  applied_coupon_code?: string;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address?: UserAddress;
  table_number?: number;
  customer_notes?: string;
  cancellation_reason?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  changed_by_user_id?: string;
  notes?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:mm:ss
  guest_count: number;
  table_number?: number;
  special_requests?: string;
  status: ReservationStatus;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  rating: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  moderated_by?: string;
  moderated_at?: string;
  customer_name?: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  menu_item_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Frontend cart state representation
export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
}
