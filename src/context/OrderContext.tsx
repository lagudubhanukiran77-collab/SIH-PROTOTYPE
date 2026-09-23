import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, UserAddress } from '../types';
import { localDB } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { canCustomerCancelOrder } from '../lib/businessRules';

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  placeOrder: (params: {
    paymentMethod: string;
    deliveryAddress?: UserAddress;
    tableNumber?: number;
    customerNotes?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;
  customerCancel: (orderId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  staffUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<{ success: boolean; error?: string }>;
  processRefund: (orderId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isStaff, isCustomer } = useAuth();
  const { cart, orderType, appliedCoupon, clearCart, revalidateCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const refreshOrders = useCallback(() => {
    if (!user) return;
    // Rule 2 & 26: Customers can only view their own orders
    if (isCustomer) {
      const userOrders = localDB.getOrders(user.id);
      setOrders(userOrders);
      if (activeOrder) {
        const fresh = userOrders.find((o) => o.id === activeOrder.id);
        if (fresh) setActiveOrder(fresh);
      }
    } else {
      // Staff / Admin can view all orders (Rule 3)
      const allOrders = localDB.getOrders();
      setOrders(allOrders);
      if (activeOrder) {
        const fresh = allOrders.find((o) => o.id === activeOrder.id);
        if (fresh) setActiveOrder(fresh);
      }
    }
  }, [user, isCustomer, activeOrder]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Place Order (Rule 5, 8, 9, 14, 31, 32)
  const placeOrder = async (params: {
    paymentMethod: string;
    deliveryAddress?: UserAddress;
    tableNumber?: number;
    customerNotes?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Customer must be signed in to place an order (Rule 2)' };
    }

    // Step 1: Revalidate cart items before checkout (Rule 4)
    const reval = revalidateCart();
    if (!reval.valid) {
      return {
        success: false,
        error: `Cart validation failed: ${reval.errors.join(', ')}`,
      };
    }

    if (cart.length === 0) {
      return { success: false, error: 'Cannot checkout an empty cart.' };
    }

    // Step 2: Generate unique idempotency key (Rule 32)
    const idempotencyKey = `mf_req_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Step 3: Call trusted backend creation function
    const result = localDB.createOrderSecure({
      customer_id: user.id,
      order_type: orderType,
      payment_method: params.paymentMethod,
      items: cart.map((c) => ({
        menu_item_id: c.menu_item.id,
        quantity: c.quantity,
      })),
      applied_coupon_code: appliedCoupon?.code,
      delivery_address: params.deliveryAddress,
      table_number: params.tableNumber,
      customer_notes: params.customerNotes,
      idempotency_key: idempotencyKey,
    });

    if (result.success && result.order) {
      clearCart();
      refreshOrders();
      setActiveOrder(result.order);
      return { success: true, order: result.order };
    } else {
      return { success: false, error: result.error || 'Failed to place order' };
    }
  };

  // Customer Cancellation (Rule 13: strictly only when 'pending')
  const customerCancel = async (orderId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Authentication required' };

    const target = orders.find((o) => o.id === orderId);
    if (!target) return { success: false, error: 'Order not found' };

    const check = canCustomerCancelOrder(target.order_status);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const res = localDB.customerCancelOrder(orderId, user.id, reason);
    if (res.success) {
      refreshOrders();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Operational Status Update (Rule 13: Staff only)
  const staffUpdateStatus = async (orderId: string, newStatus: OrderStatus): Promise<{ success: boolean; error?: string }> => {
    if (!isStaff || !user) {
      return { success: false, error: 'Access Denied: Operational update requires staff role.' };
    }

    const res = localDB.updateOrderStatusOperational(orderId, newStatus, user.id);
    if (res.success) {
      refreshOrders();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Refund (Rule 16: Admin / Staff controlled)
  const processRefund = async (orderId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!isStaff || !user) {
      return { success: false, error: 'Access Denied: Refund initiation requires authorized staff.' };
    }

    const res = localDB.processRefund(orderId, reason, user.id);
    if (res.success) {
      refreshOrders();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        setActiveOrder,
        placeOrder,
        customerCancel,
        staffUpdateStatus,
        processRefund,
        refreshOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
