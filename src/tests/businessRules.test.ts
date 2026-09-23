import { describe, it, expect } from 'vitest';
import {
  isRestaurantOpen,
  calculateOrderTotals,
  canCustomerCancelOrder,
  validateReservationInput,
  canCancelReservation,
} from '../lib/businessRules';
import { RestaurantSettings, MenuItem, Coupon } from '../types';

const mockSettings: RestaurantSettings = {
  id: 1,
  restaurant_name: 'Midnight Feast',
  address: '42 Starlight Boulevard',
  phone: '+91 98765 43210',
  email: 'reservations@midnightfeast.com',
  operating_status: 'open',
  open_time: '18:00:00', // 6:00 PM
  close_time: '02:00:00', // 2:00 AM
  allow_late_ordering: false,
  allow_advance_ordering: true,
  tax_percentage: 5.0, // 5%
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

const mockBurger: MenuItem = {
  id: 'burger-1',
  category_id: 'cat-1',
  name: 'Truffle Wagyu Midnight Burger',
  description: 'Signature burger',
  price: 549.0,
  image_url: 'burger.jpg',
  is_vegetarian: false,
  availability: 'available',
  prep_time_minutes: 20,
  stock_quantity: 50,
  is_inventory_tracked: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockFries: MenuItem = {
  id: 'fries-1',
  category_id: 'cat-2',
  name: 'Parmesan Truffle Fries',
  description: 'Crispy fries',
  price: 249.0,
  image_url: 'fries.jpg',
  is_vegetarian: true,
  availability: 'available',
  prep_time_minutes: 12,
  stock_quantity: 100,
  is_inventory_tracked: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockUnavailableItem: MenuItem = {
  id: 'dumpling-1',
  category_id: 'cat-3',
  name: 'Tokyo Midnight Pork Gyoza',
  description: 'Handmade dumplings',
  price: 329.0,
  image_url: 'gyoza.jpg',
  is_vegetarian: false,
  availability: 'temporarily_unavailable',
  prep_time_minutes: 15,
  stock_quantity: 0,
  is_inventory_tracked: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Rule 1: Operating Hours Logic (Default 6:00 PM – 2:00 AM)', () => {
  it('should be open at 8:00 PM (20:00)', () => {
    const testDate = new Date();
    testDate.setHours(20, 0, 0, 0);
    const result = isRestaurantOpen(mockSettings, testDate);
    expect(result.isOpen).toBe(true);
  });

  it('should be open at 1:30 AM (crosses midnight)', () => {
    const testDate = new Date();
    testDate.setHours(1, 30, 0, 0);
    const result = isRestaurantOpen(mockSettings, testDate);
    expect(result.isOpen).toBe(true);
  });

  it('should be closed at 2:30 PM (14:30)', () => {
    const testDate = new Date();
    testDate.setHours(14, 30, 0, 0);
    const result = isRestaurantOpen(mockSettings, testDate);
    expect(result.isOpen).toBe(false);
    expect(result.reason).toContain('Midnight Feast operates strictly between 6:00 PM and 2:00 AM');
  });

  it('should report closed when operating status is explicitly closed or temporarily closed', () => {
    const closedSettings = { ...mockSettings, operating_status: 'temporarily_closed' as const };
    const testDate = new Date();
    testDate.setHours(21, 0, 0, 0); // 9 PM
    const result = isRestaurantOpen(closedSettings, testDate);
    expect(result.isOpen).toBe(false);
    expect(result.reason).toContain('temporarily closed');
  });
});

describe('Rule 4 & 7: Menu Availability & Cart Validation', () => {
  it('should flag unavailable items and exclude them from valid calculation', () => {
    const result = calculateOrderTotals({
      items: [{ menuItem: mockUnavailableItem, quantity: 1 }],
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.itemErrors).toBeDefined();
    expect(result.itemErrors![0]).toContain('currently unavailable');
  });
});

describe('Rule 5, 6, 8, 9: Pricing, Minimum Order, Tax, and Delivery Fee Calculation', () => {
  it('should enforce Minimum Order Amount (₹199 threshold)', () => {
    // 1 item with price 100 below min 199
    const cheapItem = { ...mockFries, price: 150 };
    const result = calculateOrderTotals({
      items: [{ menuItem: cheapItem, quantity: 1 }],
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.subtotal).toBe(150);
    expect(result.meetsMinOrder).toBe(false);
  });

  it('should apply delivery fee of ₹40 when subtotal is below ₹499 free delivery threshold', () => {
    const result = calculateOrderTotals({
      items: [{ menuItem: mockFries, quantity: 1 }], // ₹249
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.subtotal).toBe(249);
    expect(result.meetsMinOrder).toBe(true);
    expect(result.deliveryFee).toBe(40);
    // Tax is 5% of 249 = 12.45
    expect(result.tax).toBe(12.45);
    // Total = 249 + 12.45 + 40 = 301.45
    expect(result.total).toBe(301.45);
  });

  it('should waive delivery fee (₹0) when subtotal reaches or exceeds free delivery threshold ₹499', () => {
    const result = calculateOrderTotals({
      items: [{ menuItem: mockBurger, quantity: 1 }], // ₹549
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.subtotal).toBe(549);
    expect(result.deliveryFee).toBe(0);
    // Tax is 5% of 549 = 27.45
    expect(result.tax).toBe(27.45);
    // Total = 549 + 27.45 + 0 = 576.45
    expect(result.total).toBe(576.45);
  });

  it('should not charge delivery fee for Pickup or Dine-in orders', () => {
    const resultPickup = calculateOrderTotals({
      items: [{ menuItem: mockFries, quantity: 1 }], // ₹249
      orderType: 'pickup',
      settings: mockSettings,
    });
    expect(resultPickup.deliveryFee).toBe(0);

    const resultDinein = calculateOrderTotals({
      items: [{ menuItem: mockFries, quantity: 1 }], // ₹249
      orderType: 'dine_in',
      settings: mockSettings,
    });
    expect(resultDinein.deliveryFee).toBe(0);
  });
});

describe('Rule 22: Coupons and Discounts', () => {
  const percentageCoupon: Coupon = {
    id: 'c-1',
    code: 'MIDNIGHT20',
    discount_type: 'percentage',
    discount_value: 20, // 20%
    min_order_amount: 300,
    max_discount_amount: 100,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    expiry_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    usage_limit: 100,
    per_user_limit: 1,
    times_used: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  it('should apply percentage discount capped at max_discount_amount', () => {
    // 2 burgers = 1098. 20% is 219.6, capped at 100.
    const result = calculateOrderTotals({
      items: [{ menuItem: mockBurger, quantity: 2 }],
      coupon: percentageCoupon,
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.subtotal).toBe(1098);
    expect(result.discount).toBe(100);
    // Taxable = 1098 - 100 = 998. Tax 5% = 49.90. Total = 998 + 49.90 = 1047.90
    expect(result.tax).toBe(49.9);
    expect(result.total).toBe(1047.9);
  });

  it('should reject coupon if subtotal is below minimum order amount for coupon', () => {
    const result = calculateOrderTotals({
      items: [{ menuItem: mockFries, quantity: 1 }], // 249 < 300
      coupon: percentageCoupon,
      orderType: 'delivery',
      settings: mockSettings,
    });
    expect(result.discount).toBe(0);
    expect(result.couponError).toContain('below coupon minimum order');
  });
});

describe('Rule 13: Order Status Permissions & Customer Cancellation', () => {
  it('should allow customer cancellation strictly when status is pending', () => {
    const checkPending = canCustomerCancelOrder('pending');
    expect(checkPending.allowed).toBe(true);
  });

  it('should disallow customer cancellation when food preparation has started or completed', () => {
    const checkPreparing = canCustomerCancelOrder('preparing');
    expect(checkPreparing.allowed).toBe(false);
    expect(checkPreparing.reason).toContain('Kitchen preparation has commenced');

    const checkReady = canCustomerCancelOrder('ready');
    expect(checkReady.allowed).toBe(false);

    const checkCompleted = canCustomerCancelOrder('completed');
    expect(checkCompleted.allowed).toBe(false);
  });
});

describe('Rule 18 & 19: Reservation Validation & Cancellation Rules', () => {
  it('should reject reservations for past dates', () => {
    const check = validateReservationInput({
      reservationDate: '2020-01-01',
      reservationTime: '20:00:00',
      guestCount: 4,
      settings: mockSettings,
    });
    expect(check.valid).toBe(false);
    expect(check.error).toContain('past dates');
  });

  it('should reject reservations outside business hours (e.g. 11:00 AM)', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    const check = validateReservationInput({
      reservationDate: dateStr,
      reservationTime: '11:00:00',
      guestCount: 4,
      settings: mockSettings,
    });
    expect(check.valid).toBe(false);
    expect(check.error).toContain('business hours');
  });

  it('should accept valid reservations during business hours', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    const check = validateReservationInput({
      reservationDate: dateStr,
      reservationTime: '20:30:00',
      guestCount: 6,
      settings: mockSettings,
    });
    expect(check.valid).toBe(true);
  });

  it('should enforce reservation cancellation window (at least 2 hours prior)', () => {
    const testDate = '2026-10-15';
    const testTime = '20:00:00';

    // Current time 19:00 on same date (1 hour before, violates 2 hours window)
    const lateCancelTime = new Date('2026-10-15T19:00:00');
    const lateCheck = canCancelReservation({
      reservationDate: testDate,
      reservationTime: testTime,
      settings: mockSettings,
      currentTime: lateCancelTime,
    });
    expect(lateCheck.allowed).toBe(false);
    expect(lateCheck.reason).toContain('at least 2 hours prior');

    // Current time 15:00 on same date (5 hours before, permitted)
    const earlyCancelTime = new Date('2026-10-15T15:00:00');
    const earlyCheck = canCancelReservation({
      reservationDate: testDate,
      reservationTime: testTime,
      settings: mockSettings,
      currentTime: earlyCancelTime,
    });
    expect(earlyCheck.allowed).toBe(true);
  });
});
