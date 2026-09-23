import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { localDB } from '../lib/supabase';
import { validateReservationInput, formatTime } from '../lib/businessRules';
import { Reservation } from '../types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationCreated: (res: Reservation) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onReservationCreated,
}) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  // Get tomorrow's date formatted as YYYY-MM-DD
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState('19:30:00'); // 7:30 PM default
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState('guest@midnightfeast.com');
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Available reservation slots within 6:00 PM - 2:00 AM (Rule 18)
  const availableSlots = [
    { time: '18:00:00', label: '6:00 PM' },
    { time: '18:30:00', label: '6:30 PM' },
    { time: '19:00:00', label: '7:00 PM' },
    { time: '19:30:00', label: '7:30 PM' },
    { time: '20:00:00', label: '8:00 PM' },
    { time: '20:30:00', label: '8:30 PM' },
    { time: '21:00:00', label: '9:00 PM' },
    { time: '21:30:00', label: '9:30 PM' },
    { time: '22:00:00', label: '10:00 PM' },
    { time: '22:30:00', label: '10:30 PM' },
    { time: '23:00:00', label: '11:00 PM' },
    { time: '23:30:00', label: '11:30 PM' },
    { time: '00:00:00', label: '12:00 AM (Midnight)' },
    { time: '00:30:00', label: '12:30 AM' },
    { time: '01:00:00', label: '1:00 AM' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please log in or select a user profile to request a reservation (Rule 2).');
      return;
    }

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg('Please complete all contact information.');
      return;
    }

    // Rule 18: Authoritative reservation validation
    const validation = validateReservationInput({
      reservationDate: date,
      reservationTime: time,
      guestCount: guests,
      settings,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid reservation request.');
      return;
    }

    const res = localDB.createReservation({
      customer_id: user.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim(),
      reservation_date: date,
      reservation_time: time,
      guest_count: guests,
      special_requests: specialRequests.trim() || undefined,
    });

    if (res.success && res.reservation) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        onReservationCreated(res.reservation!);
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to create reservation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-midnight-950/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-midnight-900 border border-midnight-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-6 border-b border-midnight-800 flex items-center justify-between bg-midnight-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Reserve a Dining Table</h3>
              <p className="text-xs text-slate-400">
                Operating hours {formatTime(settings.open_time)} – {formatTime(settings.close_time)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-midnight-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-serif text-xl font-bold text-white">Reservation Request Sent</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Your request for {guests} guests on {date} at {formatTime(time)} has been submitted for restaurant confirmation (Rule 17).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date & Guest Count (Rule 18) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]} // Rule 18: Disallow past dates
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Guest Count (Max {settings.max_guests_per_reservation})
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60 font-mono"
                >
                  {Array.from({ length: settings.max_guests_per_reservation }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Slot Picker (Rule 18: Only within operating hours) */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Time Slot (Within 6:00 PM – 2:00 AM)
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setTime(slot.time)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-mono font-semibold border transition-all text-center ${
                      time === slot.time
                        ? 'bg-gold-500 text-midnight-950 font-bold border-gold-500 shadow'
                        : 'bg-midnight-950 text-slate-300 border-midnight-800 hover:border-midnight-700'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-2 border-t border-midnight-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                    placeholder="Guest Name"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                    placeholder="+91 98765 00000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Special Requests</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 bg-midnight-950 border border-midnight-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-500/60"
                  placeholder="Anniversary celebration, window table, quiet corner..."
                />
              </div>
            </div>

            {/* Policy Notes (Rule 17, 18, 19) */}
            <div className="p-3 bg-midnight-950 rounded-2xl border border-midnight-800 flex items-start gap-2.5 text-[11px] text-slate-400">
              <Info className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Reservation Policy:</strong> Confirmation is subject to restaurant table review (Rule 17). Cancellations are permitted until <strong>{settings.reservation_cancel_window_hours} hours</strong> before the scheduled time (Rule 19).
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-gold-500/20 transition-all active:scale-[0.98]"
              >
                Request Table Reservation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
