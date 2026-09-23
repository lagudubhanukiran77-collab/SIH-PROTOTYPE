import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  ChefHat,
  Package,
  Bike,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  MapPin,
  Calendar,
  CreditCard,
  Ban,
  Loader2,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useOrder } from '../context/OrderContext';
import { canCustomerCancelOrder } from '../lib/businessRules';

interface OrderTrackerProps {
  order: Order;
  onBackToMenu: () => void;
}

const STEPS: Array<{ status: OrderStatus; label: string; icon: React.ElementType }> = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'preparing', label: 'In Kitchen', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'out_for_delivery', label: 'On The Way', icon: Bike },
  { status: 'completed', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onBackToMenu }) => {
  const { customerCancel } = useOrder();
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCancelled =
    order.order_status === 'cancelled_by_customer' ||
    order.order_status === 'cancelled_by_restaurant' ||
    order.order_status === 'payment_failed';

  const cancellationPermission = canCustomerCancelOrder(order.order_status);

  // Compute active step index
  const currentStepIndex = STEPS.findIndex((s) => s.status === order.order_status);

  const handleCancel = async () => {
    setActionError(null);
    setIsCancelling(true);
    const res = await customerCancel(order.id, cancelReason);
    setIsCancelling(false);
    if (res.success) {
      setShowCancelDialog(false);
    } else {
      setActionError(res.error || 'Failed to cancel order');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-midnight-900 border border-midnight-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-midnight-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-gold-400 uppercase">
                Order Tracking
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
              <span className="text-xs text-slate-400 font-mono">{order.order_number}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Midnight Feast Order
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMenu}
              className="px-4 py-2 bg-midnight-800 hover:bg-midnight-750 text-slate-300 text-xs font-bold rounded-xl border border-midnight-700 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Status Stepper / Progress Bar (Rule 12) */}
        {!isCancelled ? (
          <div className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.status}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-gold-500/15 border-gold-500 text-gold-400 shadow-lg ring-1 ring-gold-500/30'
                        : isPassed
                        ? 'bg-midnight-850 border-emerald-800/60 text-emerald-400'
                        : 'bg-midnight-950/60 border-midnight-800/80 text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                        isCurrent
                          ? 'bg-gold-500 text-midnight-950 shadow'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-midnight-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight">{step.label}</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono mt-0.5">
                      {isCurrent ? 'Current' : isPassed ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Cancelled Alert */
          <div className="p-6 bg-rose-950/50 border border-rose-800/80 rounded-2xl flex items-start gap-4">
            <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-rose-200">
                Order Cancelled ({order.order_status.replace(/_/g, ' ').toUpperCase()})
              </h4>
              <p className="text-xs text-rose-300/80 mt-1">
                Reason: {order.cancellation_reason || 'No specific reason provided.'}
              </p>
              {order.payment_status === 'refunded' && (
                <div className="mt-2 text-xs font-mono font-bold text-gold-400 bg-midnight-950/80 px-3 py-1.5 rounded-lg border border-gold-500/20 inline-block">
                  Refund Processed: Full amount of ₹{order.total_amount} refunded (Rule 16)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details & Summary (Rule 5 & 33) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-midnight-800">
          {/* Items breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Items Ordered
            </h4>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs p-3 bg-midnight-850 rounded-xl border border-midnight-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gold-400">{item.quantity}x</span>
                    <span className="font-semibold text-slate-200">{item.item_name}</span>
                  </div>
                  <span className="font-mono text-slate-300 font-bold">
                    ₹{item.total_price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="mt-4 p-4 bg-midnight-950 rounded-2xl border border-midnight-800 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount {order.applied_coupon_code ? `(${order.applied_coupon_code})` : ''}</span>
                  <span className="font-mono">-₹{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax & GST</span>
                <span className="font-mono text-slate-200">₹{order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-mono text-slate-200">
                  {order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-midnight-800 flex justify-between font-bold text-sm text-white">
                <span>Grand Total</span>
                <span className="font-mono text-gold-400 text-base">
                  ₹{order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Metadata */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Fulfillment Information
              </h4>
              <div className="p-4 bg-midnight-850 rounded-2xl border border-midnight-800 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {order.order_type === 'delivery'
                        ? 'Delivery Destination'
                        : order.order_type === 'pickup'
                        ? 'Customer Pickup'
                        : `Dine-In Table #${order.table_number}`}
                    </span>
                    {order.delivery_address && (
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        {order.delivery_address.full_name} • {order.delivery_address.phone}
                        <br />
                        {order.delivery_address.address_line}, {order.delivery_address.city} -{' '}
                        {order.delivery_address.postal_code}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-midnight-800">
                  <CreditCard className="w-4 h-4 text-gold-500" />
                  <div>
                    <span className="text-slate-300 font-medium">Payment Method: </span>
                    <span className="font-mono uppercase font-bold text-slate-200">
                      {order.payment_method.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : order.payment_status === 'refunded'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Cancellation Action (Rule 13) */}
            {!isCancelled && order.order_status !== 'completed' && (
              <div className="p-4 bg-midnight-950/70 rounded-2xl border border-midnight-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Order Cancellation Policy (Rule 13)
                  </span>
                  <span className="text-[10px] text-gold-500/80 font-mono">Strict Rule</span>
                </div>

                {cancellationPermission.allowed ? (
                  <div>
                    <p className="text-xs text-slate-400 mb-3">
                      Your order is currently <strong>Pending</strong> confirmation. You may cancel without penalty before kitchen preparation begins.
                    </p>
                    {!showCancelDialog ? (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-colors"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <div className="space-y-3 p-3 bg-midnight-900 rounded-xl border border-rose-900/60">
                        <label className="text-[11px] text-slate-300 block">Reason for cancellation:</label>
                        <select
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-midnight-950 border border-midnight-800 rounded-lg text-xs text-slate-200"
                        >
                          <option value="Change of plans">Change of plans</option>
                          <option value="Placed by mistake">Placed by mistake</option>
                          <option value="Delivery time too long">Delivery time too long</option>
                          <option value="Forgot coupon code">Forgot coupon code</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isCancelling}
                            onClick={handleCancel}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Confirm Cancellation
                          </button>
                          <button
                            onClick={() => setShowCancelDialog(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Keep Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Ban className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <p>
                      Customer cancellation is locked. Food preparation is already underway in the kitchen (Status: {order.order_status}).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
