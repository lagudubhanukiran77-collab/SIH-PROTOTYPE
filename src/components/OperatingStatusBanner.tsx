import React from 'react';
import { AlertCircle, Clock, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { formatTime } from '../lib/businessRules';

export const OperatingStatusBanner: React.FC = () => {
  const { settings, isOpen, statusReason } = useSettings();

  if (settings.operating_status === 'open' && isOpen) {
    return (
      <div className="bg-gradient-to-r from-midnight-900 via-gold-950/30 to-midnight-900 border-b border-gold-500/20 py-2.5 px-4 text-xs text-gold-400/90 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span>
          <strong className="text-gold-300">Midnight Gourmet Dining:</strong> Open tonight until{' '}
          {formatTime(settings.close_time)}. Free delivery on orders above ₹
          {settings.free_delivery_threshold}.
        </span>
        <span className="hidden md:inline text-gold-600">• Minimum order ₹{settings.min_order_amount}</span>
      </div>
    );
  }

  if (settings.operating_status === 'accepting_preorders') {
    return (
      <div className="bg-amber-950/70 border-b border-amber-800/80 py-3 px-4 text-xs text-amber-200 text-center flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" />
        <span>
          <strong>Advance Pre-Orders Active:</strong> We are preparing our kitchen for dinner service starting at{' '}
          {formatTime(settings.open_time)}. You may place your order now for scheduled delivery.
        </span>
      </div>
    );
  }

  if (settings.operating_status === 'temporarily_closed') {
    return (
      <div className="bg-orange-950/80 border-b border-orange-800 py-3 px-4 text-xs text-orange-200 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400" />
        <span>
          <strong>Kitchen Paused:</strong> Midnight Feast is temporarily pausing order intake due to high kitchen demand. We will resume ordering shortly.
        </span>
      </div>
    );
  }

  // Closed
  return (
    <div className="bg-rose-950/70 border-b border-rose-900/80 py-3 px-4 text-xs text-rose-200 text-center flex items-center justify-center gap-2">
      <ShieldAlert className="w-4 h-4 text-rose-400" />
      <span>
        <strong>Restaurant Closed:</strong> {statusReason || `Midnight Feast operates strictly from ${formatTime(settings.open_time)} to ${formatTime(settings.close_time)}.`} Menu is viewable for exploration.
      </span>
    </div>
  );
};
