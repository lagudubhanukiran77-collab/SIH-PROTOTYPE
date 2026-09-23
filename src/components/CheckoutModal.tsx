import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  MapPin,
  Tag,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useOrder } from '../context/OrderContext';
import { OrderType, UserAddress, Order } from '../types';
import { localDB } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const {
    cart,
    orderType,
    setOrderType,
    calculation,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
  } = useCart();
  const { placeOrder } = useOrder();

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>(() =>
    user ? localDB.getAddresses(user.id) : []
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() =>
    savedAddresses[0]?.id || 'new'
  );

  const [newAddress, setNewAddress] = useState<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address_line: '',
    city: 'Metropolis',
    state: 'State',
    postal_code: '400001',
    landmark: '',
    is_default: false,
  });

  const [tableNumber, setTableNumber] = useState<number>(1);
  const [customerNotes, setCustomerNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay_online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;

    const res = applyCouponCode(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleCheckout = async () => {
    setSubmissionError(null);
    setIsSubmitting(true);

    let deliveryAddress: UserAddress | undefined;

    // Rule 10: Delivery Address Validation
    if (orderType === 'delivery') {
      if (selectedAddressId === 'new') {
        if (
          !newAddress.full_name.trim() ||
          !newAddress.phone.trim() ||
          !newAddress.address_line.trim() ||
          !newAddress.postal_code.trim()
        ) {
          setSubmissionError('Please provide all mandatory delivery address fields.');
          setIsSubmitting(false);
          return;
        }

        const createdAddr: UserAddress = {
          ...newAddress,
          id: 'addr-' + Date.now(),
          user_id: user?.id || 'guest',
          created_at: new Date().toISOString(),
        };
        localDB.saveAddress(createdAddr);
        deliveryAddress = createdAddr;
      } else {
        deliveryAddress = savedAddresses.find((a) => a.id === selectedAddressId);
      }
    }

    // Rule 11: Table number for dine-in
    const dineInTable = orderType === 'dine_in' ? tableNumber : undefined;

    try {
      const result = await placeOrder({
        paymentMethod,
        deliveryAddress,
        tableNumber: dineInTable,
        customerNotes: customerNotes.trim() || undefined,
      });

      if (result.success && result.order) {
        setIsSubmitting(false);
        onClose();
        onOrderSuccess(result.order);
      } else {
        setSubmissionError(result.error || 'Failed to place order.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-midnight-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-midnight-900 border border-midnight-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-6 border-b border-midnight-800 flex items-center justify-between bg-midnight-950/50">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Midnight Feast Checkout</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review order details, address, and secure payment
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-midnight-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Submission Error Banner */}
          {submissionError && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 flex items-start gap-2.5 text-rose-200 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Order Validation Error</p>
                <p className="text-[11px] mt-0.5">{submissionError}</p>
              </div>
            </div>
          )}

          {/* 1. Order Type Selection (Rule 11) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Fulfillment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {settings.enable_delivery && (
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all ${
                    orderType === 'delivery'
                      ? 'bg-gold-500/15 border-gold-500 text-gold-400 shadow-lg'
                      : 'bg-midnight-850 border-midnight-800 text-slate-400 hover:text-white hover:bg-midnight-800'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                  <span className="text-xs font-bold">Delivery</span>
                  <span className="text-[10px] text-slate-500">To your door</span>
                </button>
              )}

              {settings.enable_pickup && (
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all ${
                    orderType === 'pickup'
                      ? 'bg-gold-500/15 border-gold-500 text-gold-400 shadow-lg'
                      : 'bg-midnight-850 border-midnight-800 text-slate-400 hover:text-white hover:bg-midnight-800'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-xs font-bold">Pickup</span>
                  <span className="text-[10px] text-slate-500">Collect at counter</span>
                </button>
              )}

              {settings.enable_dinein && (
                <button
                  type="button"
                  onClick={() => setOrderType('dine_in')}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all ${
                    orderType === 'dine_in'
                      ? 'bg-gold-500/15 border-gold-500 text-gold-400 shadow-lg'
                      : 'bg-midnight-850 border-midnight-800 text-slate-400 hover:text-white hover:bg-midnight-800'
                  }`}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  <span className="text-xs font-bold">Dine-In</span>
                  <span className="text-[10px] text-slate-500">At restaurant table</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Delivery Address or Table Number (Rule 10 & 11) */}
          {orderType === 'delivery' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Delivery Destination (Rule 10)
              </label>

              {savedAddresses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'bg-midnight-800/90 border-gold-500/60'
                          : 'bg-midnight-850/50 border-midnight-800 hover:border-midnight-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_choice"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-gold-500 focus:ring-gold-500/30"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-200">
                          {addr.full_name} • {addr.phone}
                        </p>
                        <p className="text-slate-400 mt-0.5">{addr.address_line}</p>
                        <p className="text-slate-500 text-[11px]">
                          {addr.city}, {addr.state} - {addr.postal_code}
                          {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs ${
                      selectedAddressId === 'new'
                        ? 'bg-midnight-800/90 border-gold-500/60 font-bold text-gold-400'
                        : 'bg-midnight-850/50 border-midnight-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address_choice"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                      className="text-gold-500"
                    />
                    <span>+ Deliver to a different address</span>
                  </label>
                </div>
              )}

              {/* New Address Form */}
              {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                <div className="p-4 rounded-2xl bg-midnight-950/60 border border-midnight-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newAddress.full_name}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                        placeholder="+91 98765 00000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Address Line</label>
                    <input
                      type="text"
                      value={newAddress.address_line}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                      className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                      placeholder="Flat 4B, Starlight Haven, 12th Cross"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                        placeholder="400001"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">City</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Landmark (Opt)</label>
                      <input
                        type="text"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        className="w-full px-3 py-2 bg-midnight-900 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                        placeholder="Near Metro"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : orderType === 'dine_in' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                2. Table Number (Rule 11)
              </label>
              <div className="flex items-center gap-3 bg-midnight-850 p-4 rounded-2xl border border-midnight-800">
                <UtensilsCrossed className="w-5 h-5 text-gold-500" />
                <div className="flex-1">
                  <span className="text-xs text-slate-300">Select your active table number:</span>
                </div>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  className="bg-midnight-950 border border-midnight-700 text-white text-sm font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-gold-500"
                >
                  {Array.from({ length: settings.total_tables }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Table #{num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {/* 3. Coupon Code Input (Rule 22) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Promotional Discount Coupon
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Tag className="w-4 h-4" />
                  <div>
                    <span className="font-mono font-bold tracking-wider">{appliedCoupon.code}</span>
                    <span className="text-[11px] text-emerald-300 block">
                      Saved ₹{calculation.discount.toFixed(2)} on this order
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-slate-400 hover:text-rose-400 transition-colors text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. MIDNIGHT50, FEAST100)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 uppercase font-mono tracking-wider focus:outline-none focus:border-gold-500/60"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-midnight-800 hover:bg-midnight-750 text-gold-400 font-bold text-xs rounded-xl border border-midnight-700 transition-colors"
                >
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-rose-400 text-[11px] mt-1.5">{couponError}</p>}
            {couponSuccess && <p className="text-emerald-400 text-[11px] mt-1.5">{couponSuccess}</p>}
          </div>

          {/* 4. Payment Method Selection (Rule 14 & 15) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              4. Payment Method (Rule 14)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay_online'
                    ? 'bg-midnight-800 border-gold-500 text-gold-400 font-bold'
                    : 'bg-midnight-850/60 border-midnight-800 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay_online'}
                  onChange={() => setPaymentMethod('razorpay_online')}
                  className="text-gold-500"
                />
                <CreditCard className="w-4 h-4 text-gold-500" />
                <span>Razorpay / Cards / Netbanking</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-midnight-800 border-gold-500 text-gold-400 font-bold'
                    : 'bg-midnight-850/60 border-midnight-800 text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="text-gold-500"
                />
                <span className="font-bold text-[10px] bg-gold-500/20 px-1.5 py-0.5 rounded text-gold-400">
                  UPI
                </span>
                <span>Google Pay / PhonePe / Paytm</span>
              </label>

              {orderType === 'delivery' && (
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'bg-midnight-800 border-gold-500 text-gold-400 font-bold'
                      : 'bg-midnight-850/60 border-midnight-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="text-gold-500"
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
              )}

              {orderType !== 'delivery' && (
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'pay_at_restaurant'
                      ? 'bg-midnight-800 border-gold-500 text-gold-400 font-bold'
                      : 'bg-midnight-850/60 border-midnight-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'pay_at_restaurant'}
                    onChange={() => setPaymentMethod('pay_at_restaurant')}
                    className="text-gold-500"
                  />
                  <span>Pay at Restaurant</span>
                </label>
              )}
            </div>
          </div>

          {/* 5. Special Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Kitchen Instructions / Delivery Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ring doorbell twice, extra cutlery please"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          {/* Authoritative Security Notice (Rule 5 & 31) */}
          <div className="p-3 bg-midnight-950 rounded-2xl border border-midnight-800 flex items-center gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-5 h-5 text-gold-500 shrink-0" />
            <span>
              <strong>Server-Side Pricing Verified:</strong> All items, coupons, taxes ({settings.tax_percentage}%), and delivery fees are recalculating authoritatively through the trusted PostgreSQL order creation procedure.
            </span>
          </div>
        </div>

        {/* Footer with Final Total and Submit */}
        <div className="p-6 bg-midnight-950 border-t border-midnight-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Grand Total</span>
            <span className="text-xl font-bold font-mono text-gold-400">
              ₹{calculation.total.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-midnight-700 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {/* Double-click prevention (Rule 32) */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl ${
                isSubmitting
                  ? 'bg-gold-600/50 text-midnight-950 cursor-wait'
                  : 'bg-gold-500 hover:bg-gold-400 text-midnight-950 shadow-gold-500/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
