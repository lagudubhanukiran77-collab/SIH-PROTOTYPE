import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { MenuItem, Coupon, OrderType, CartItem } from '../types';
import { localDB } from '../lib/supabase';
import { useSettings } from './SettingsContext';
import { calculateOrderTotals, CalculationResult } from '../lib/businessRules';

interface CartContextType {
  cart: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  appliedCoupon: Coupon | null;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  calculation: CalculationResult;
  revalidateCart: () => { valid: boolean; errors: string[] };
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mf_user_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Save cart to localStorage on change (Rule 7: Cart should survive refresh)
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [cart]);

  // Revalidate cart items against current database items (Rule 4 & 7)
  const revalidateCart = useCallback((): { valid: boolean; errors: string[] } => {
    const currentDbItems = localDB.getMenuItems();
    const errors: string[] = [];
    let cartModified = false;

    const updatedCart = cart.map((c) => {
      const dbItem = currentDbItems.find((m) => m.id === c.menu_item.id);
      if (!dbItem) {
        errors.push(`"${c.menu_item.name}" is no longer on the menu.`);
        cartModified = true;
        return null;
      }
      if (dbItem.availability !== 'available') {
        errors.push(`"${dbItem.name}" is currently unavailable.`);
        cartModified = true;
        return { ...c, menu_item: dbItem };
      }
      // Revalidate price
      if (dbItem.price !== c.menu_item.price) {
        cartModified = true;
        return { ...c, menu_item: dbItem };
      }
      return c;
    }).filter(Boolean) as CartItem[];

    if (cartModified) {
      setCart(updatedCart);
    }

    return { valid: errors.length === 0, errors };
  }, [cart]);

  const addItem = (item: MenuItem, quantity: number = 1): { success: boolean; message?: string } => {
    // Rule 4: Unavailable products cannot be added
    if (item.availability !== 'available') {
      return { success: false, message: `"${item.name}" is currently unavailable.` };
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item.id === item.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, 20); // Max 20 per item
        return prev.map((i) => (i.menu_item.id === item.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { menu_item: item, quantity: Math.min(quantity, 20) }];
    });

    return { success: true };
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    const clamped = Math.min(quantity, 20);
    setCart((prev) =>
      prev.map((i) => (i.menu_item.id === menuItemId ? { ...i, quantity: clamped } : i))
    );
  };

  const removeItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menu_item.id !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const applyCouponCode = (code: string): { success: boolean; message: string } => {
    const coupons = localDB.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.is_active);

    if (!found) {
      return { success: false, message: 'Invalid or inactive coupon code.' };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon "${found.code}" applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Authoritative Calculation (Rule 5)
  const calculation = useMemo(() => {
    return calculateOrderTotals({
      items: cart.map((c) => ({ menuItem: c.menu_item, quantity: c.quantity })),
      coupon: appliedCoupon,
      orderType,
      settings,
    });
  }, [cart, appliedCoupon, orderType, settings]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        orderType,
        setOrderType,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        calculation,
        revalidateCart,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
