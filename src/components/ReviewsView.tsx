import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquare, Sparkles } from 'lucide-react';
import { localDB } from '../lib/supabase';
import { Review } from '../types';

export const ReviewsView: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Rule 20: Only approved reviews are publicly displayed
    const all = localDB.getReviews();
    setReviews(all.filter((r) => r.status === 'approved'));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Verified Dining Feedback
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
          Patron Experiences
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Rule 20: Reviews are tied to verified completed orders and moderated prior to publication.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-midnight-900/40 rounded-3xl border border-midnight-800">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-bold">No public reviews yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete an order to share your review!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 space-y-4 hover:border-gold-500/30 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center font-bold text-gold-400 font-serif">
                    {r.customer_name?.[0] || 'G'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {r.customer_name || 'Verified Patron'}
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Purchase Order
                    </span>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-gold-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < r.rating ? 'fill-gold-500 text-gold-500' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{r.comment}"
              </p>

              <div className="text-[10px] text-slate-500 font-mono">
                {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
