import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const { cart, updateQuantity, removeItem, clearCart, calculation, orderType } = useCart();
  const { settings, isOpen: restaurantOpen } = useSettings();

  if (!isOpen) return null;

  const minOrderShortfall = Math.max(0, settings.min_order_amount - calculation.subtotal);
  const freeDeliveryShortfall = Math.max(0, settings.free_delivery_threshold - calculation.subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-midnight-900 border-l border-midnight-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-midnight-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold-500" />
              <h2 className="font-serif text-lg font-bold text-white">Your Feast Cart</h2>
              <span className="text-xs bg-midnight-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {cart.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="Clear all items"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delivery Threshold & Min Order Banners (Rule 8 & 9) */}
          <div className="px-6 py-3 bg-midnight-950/60 border-b border-midnight-800/80 space-y-2 text-xs">
            {/* Free Delivery Tracker */}
            {orderType === 'delivery' && (
              <div>
                {freeDeliveryShortfall > 0 ? (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-gold-400 font-medium">
                      <Truck className="w-3.5 h-3.5" />
                      Add ₹{freeDeliveryShortfall.toFixed(2)} for FREE delivery
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (₹{settings.free_delivery_threshold})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Free Delivery Unlocked!</span>
                  </div>
                )}
                <div className="w-full bg-midnight-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-gold-500 h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (calculation.subtotal / settings.free_delivery_threshold) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Minimum Order Warning (Rule 8) */}
            {!calculation.meetsMinOrder && cart.length > 0 && (
              <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-xl text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Minimum Order Required</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">
                    Restaurant requires a minimum order of ₹{settings.min_order_amount}. Add ₹
                    {minOrderShortfall.toFixed(2)} more to place order.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-serif font-bold text-slate-400">Your cart is empty</p>
                <p className="text-xs text-slate-500 mt-1">Explore our late-night artisanal menu to add dishes.</p>
              </div>
            ) : (
              cart.map(({ menu_item, quantity }) => (
                <div
                  key={menu_item.id}
                  className="flex items-center gap-4 bg-midnight-850/90 border border-midnight-800 p-3.5 rounded-2xl"
                >
                  <img
                    src={menu_item.image_url}
                    alt={menu_item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate font-serif">
                      {menu_item.name}
                    </h4>
                    <p className="text-xs font-bold text-gold-400 font-mono mt-0.5">
                      ₹{menu_item.price.toFixed(2)}
                    </p>

                    {/* Quantity controls (Rule 7) */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center bg-midnight-950 border border-midnight-750 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(menu_item.id, quantity - 1)}
                          className="p-1 hover:text-white text-slate-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold px-2 text-slate-200">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(menu_item.id, quantity + 1)}
                          className="p-1 hover:text-white text-slate-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(menu_item.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-white">
                      ₹{(menu_item.price * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary (Rule 5 & 6) */}
          {cart.length > 0 && (
            <div className="p-6 bg-midnight-950/80 border-t border-midnight-800 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">₹{calculation.subtotal.toFixed(2)}</span>
                </div>

                {calculation.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-₹{calculation.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Taxes & GST ({settings.tax_percentage}%)</span>
                  <span className="font-mono text-slate-200">₹{calculation.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-slate-200">
                    {calculation.deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase text-[10px]">FREE</span>
                    ) : (
                      `₹${calculation.deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-midnight-800 flex justify-between text-sm font-bold text-white">
                  <span>Final Total</span>
                  <span className="font-mono text-gold-400 text-base">
                    ₹{calculation.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                disabled={!calculation.meetsMinOrder || (!restaurantOpen && !settings.allow_advance_ordering && settings.operating_status !== 'accepting_preorders')}
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                  calculation.meetsMinOrder && (restaurantOpen || settings.allow_advance_ordering || settings.operating_status === 'accepting_preorders')
                    ? 'bg-gold-500 hover:bg-gold-400 text-midnight-950 shadow-gold-500/20 active:scale-[0.98]'
                    : 'bg-midnight-800 text-slate-500 cursor-not-allowed border border-midnight-700'
                }`}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
