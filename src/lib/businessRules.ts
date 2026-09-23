import {
  RestaurantSettings,
  MenuItem,
  Coupon,
  OrderType,
  OrderStatus,
} from '../types';

/**
 * Rule 1: Operating Hours Logic
 * Checks if restaurant is operating at the specified time.
 * Handles overnight hours (e.g. 18:00 to 02:00 next morning).
 */
export function isRestaurantOpen(
  settings: RestaurantSettings,
  checkDate: Date = new Date()
): { isOpen: boolean; reason?: string } {
  // If explicitly closed
  if (settings.operating_status === 'closed') {
    return { isOpen: false, reason: 'Midnight Feast is currently closed.' };
  }
  if (settings.operating_status === 'temporarily_closed') {
    return {
      isOpen: false,
      reason: 'Midnight Feast is temporarily closed. Please check back shortly.',
    };
  }
  if (settings.operating_status === 'accepting_preorders') {
    return {
      isOpen: true,
      reason: 'Midnight Feast is currently accepting advance pre-orders.',
    };
  }

  // Parse open and close times (HH:mm:ss or HH:mm)
  const [openH, openM] = settings.open_time.split(':').map(Number);
  const [closeH, closeM] = settings.close_time.split(':').map(Number);

  const currentH = checkDate.getHours();
  const currentM = checkDate.getMinutes();

  const currentMinutes = currentH * 60 + currentM;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let inHours = false;

  if (openMinutes > closeMinutes) {
    // Overnight schedule (e.g. 18:00 [1080 min] to 02:00 [120 min])
    if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) {
      inHours = true;
    }
  } else {
    // Same day schedule (e.g. 11:00 to 22:00)
    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      inHours = true;
    }
  }

  if (inHours) {
    return { isOpen: true };
  }

  // Outside operating hours
  if (settings.allow_late_ordering) {
    return {
      isOpen: true,
      reason: 'Late ordering is enabled outside regular operating hours.',
    };
  }

  return {
    isOpen: false,
    reason: `Midnight Feast operates strictly between ${formatTime(settings.open_time)} and ${formatTime(settings.close_time)}. Online ordering resumes at ${formatTime(settings.open_time)}.`,
  };
}

/**
 * Format "18:00:00" to "6:00 PM"
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes ? `:${minutes.toString().padStart(2, '0')}` : ':00';
  return `${displayHours}${displayMinutes} ${period}`;
}

export interface CalculationInput {
  items: Array<{ menuItem: MenuItem; quantity: number }>;
  coupon?: Coupon | null;
  orderType: OrderType;
  settings: RestaurantSettings;
}

export interface CalculationResult {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  meetsMinOrder: boolean;
  minOrderAmount: number;
  couponError?: string;
  itemErrors?: string[];
}

/**
 * Rule 5, 6, 8, 9: Server-Grade Order Total Calculation
 * Item Price × Quantity -> Subtotal -> Discount -> Tax -> Delivery Fee -> Final Total
 */
export function calculateOrderTotals(input: CalculationInput): CalculationResult {
  const { items, coupon, orderType, settings } = input;
  const itemErrors: string[] = [];

  // Calculate subtotal from authoritative item prices (Rule 5)
  let subtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0) {
      itemErrors.push(`Item ${item.menuItem.name} has invalid quantity`);
      continue;
    }
    // Rule 4: Availability check
    if (item.menuItem.availability !== 'available') {
      itemErrors.push(`Item "${item.menuItem.name}" is currently unavailable and cannot be ordered.`);
      continue;
    }
    subtotal += item.menuItem.price * item.quantity;
  }

  subtotal = Number(subtotal.toFixed(2));

  // Rule 8: Minimum Order Rule
  const meetsMinOrder = subtotal >= settings.min_order_amount;

  // Rule 22: Coupon & Discount Calculation
  let discount = 0;
  let couponError: string | undefined;

  if (coupon && coupon.is_active) {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const expiryDate = new Date(coupon.expiry_date);

    if (now < startDate || now > expiryDate) {
      couponError = 'Coupon has expired or is not yet active';
    } else if (subtotal < coupon.min_order_amount) {
      couponError = `Order subtotal ₹${subtotal} is below coupon minimum order of ₹${coupon.min_order_amount}`;
    } else if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      couponError = 'Coupon usage limit has been reached';
    } else {
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
        }
      } else {
        discount = coupon.discount_value;
      }

      if (discount > subtotal) {
        discount = subtotal;
      }
      discount = Number(discount.toFixed(2));
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);

  // Rule 6: Tax Calculation (Configurable percentage from settings)
  const tax = Number(((taxableAmount * settings.tax_percentage) / 100).toFixed(2));

  // Rule 9: Delivery Fee Calculation
  let deliveryFee = 0;
  if (orderType === 'delivery') {
    if (subtotal >= settings.free_delivery_threshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = settings.delivery_fee;
    }
  }

  // Final Total
  const total = Number((taxableAmount + tax + deliveryFee).toFixed(2));

  return {
    subtotal,
    discount,
    tax,
    deliveryFee,
    total,
    meetsMinOrder,
    minOrderAmount: settings.min_order_amount,
    couponError,
    itemErrors: itemErrors.length > 0 ? itemErrors : undefined,
  };
}

/**
 * Rule 13: Order Cancellation Permissions
 * Customers may cancel strictly in 'pending' status.
 */
export function canCustomerCancelOrder(status: OrderStatus): { allowed: boolean; reason?: string } {
  if (status === 'pending') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cancellation disabled: Order is already in "${status.replace(/_/g, ' ')}" status. Kitchen preparation has commenced.`,
  };
}

/**
 * Rule 18: Reservation Validation
 */
export function validateReservationInput(params: {
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm:ss
  guestCount: number;
  settings: RestaurantSettings;
  existingGuestsInSlot?: number;
}): { valid: boolean; error?: string } {
  const { reservationDate, reservationTime, guestCount, settings, existingGuestsInSlot = 0 } = params;

  // 1. Check Date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(reservationDate);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate < today) {
    return { valid: false, error: 'Reservations cannot be made for past dates (Rule 18)' };
  }

  // 2. Check Guest Count
  if (guestCount <= 0) {
    return { valid: false, error: 'Guest count must be at least 1' };
  }
  if (guestCount > settings.max_guests_per_reservation) {
    return {
      valid: false,
      error: `Maximum guests per reservation is ${settings.max_guests_per_reservation} (Rule 18)`,
    };
  }

  // 3. Check Operating Hours for Reservation Time
  const [slotH, slotM] = reservationTime.split(':').map(Number);
  const [openH, openM] = settings.open_time.split(':').map(Number);
  const [closeH, closeM] = settings.close_time.split(':').map(Number);

  const slotMinutes = slotH * 60 + slotM;
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let inHours = false;
  if (openMinutes > closeMinutes) {
    if (slotMinutes >= openMinutes || slotMinutes <= closeMinutes) {
      inHours = true;
    }
  } else {
    if (slotMinutes >= openMinutes && slotMinutes <= closeMinutes) {
      inHours = true;
    }
  }

  if (!inHours) {
    return {
      valid: false,
      error: `Reservations are only permitted during business hours (${formatTime(settings.open_time)} to ${formatTime(settings.close_time)}) (Rule 18)`,
    };
  }

  // 4. Double booking / Seating capacity
  if (existingGuestsInSlot + guestCount > settings.seating_capacity) {
    return {
      valid: false,
      error: `Seating capacity of ${settings.seating_capacity} guests reached for this time slot (Rule 18)`,
    };
  }

  return { valid: true };
}

/**
 * Rule 19: Reservation Cancellation Window Check
 */
export function canCancelReservation(params: {
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm:ss
  settings: RestaurantSettings;
  currentTime?: Date;
}): { allowed: boolean; reason?: string } {
  const { reservationDate, reservationTime, settings, currentTime = new Date() } = params;

  const [year, month, day] = reservationDate.split('-').map(Number);
  const [hour, minute] = reservationTime.split(':').map(Number);

  const reservationDateTime = new Date(year, month - 1, day, hour, minute);
  const diffMs = reservationDateTime.getTime() - currentTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < settings.reservation_cancel_window_hours) {
    return {
      allowed: false,
      reason: `Cancellations must be made at least ${settings.reservation_cancel_window_hours} hours prior to reservation time.`,
    };
  }

  return { allowed: true };
}
