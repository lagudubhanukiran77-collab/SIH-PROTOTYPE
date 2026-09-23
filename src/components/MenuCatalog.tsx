import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Clock,
  Heart,
  Plus,
  Flame,
  Check,
  Ban,
  Sparkles,
  Info,
} from 'lucide-react';
import { MenuItem, Category } from '../types';
import { localDB } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const MenuCatalog: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { settings, isOpen } = useSettings();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategories(localDB.getCategories());
    setMenuItems(localDB.getMenuItems());
    if (user) {
      setFavorites(localDB.getFavorites(user.id));
    }
  }, [user]);

  const toggleFav = (itemId: string) => {
    if (!user) return;
    const isNowFav = localDB.toggleFavorite(user.id, itemId);
    setFavorites(localDB.getFavorites(user.id));
    showToast(isNowFav ? 'Added to your favorites' : 'Removed from favorites');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddToCart = (item: MenuItem) => {
    // Check if restaurant is open or accepting preorders (Rule 1 & 23)
    if (!isOpen && !settings.allow_advance_ordering && settings.operating_status !== 'accepting_preorders') {
      showToast('Midnight Feast is currently closed for orders.');
      return;
    }

    const res = addItem(item, 1);
    if (res.success) {
      showToast(`Added ${item.name} to cart`);
    } else {
      showToast(res.message || 'Cannot add item');
    }
  };

  // Filter items: Rule 4 (exclude 'hidden' unless staff/admin)
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Exclude hidden items
      if (item.availability === 'hidden') return false;

      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }
      if (vegOnly && !item.is_vegetarian) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gold-500 text-midnight-950 font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-midnight-900 via-midnight-850 to-midnight-900 border border-midnight-800 p-8 sm:p-12 mb-12 shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-gold-500/10 text-gold-400 border border-gold-500/20 mb-4">
            <Flame className="w-3.5 h-3.5 text-ember-500" />
            Midnight Artisanal Kitchen
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Curated Flavors for the Midnight Hours.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
            Indulge in slow-smoked delicacies, black truffle creations, hand-stretched wood-fired pizzas, and artisanal midnight elixirs delivered warm right to your sanctuary.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5 bg-midnight-950/60 px-3 py-1.5 rounded-lg border border-midnight-800">
              <Clock className="w-4 h-4 text-gold-500" />
              <span>Avg Prep: 15–25 mins</span>
            </div>
            <div className="flex items-center gap-1.5 bg-midnight-950/60 px-3 py-1.5 rounded-lg border border-midnight-800">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span>Min Order: ₹{settings.min_order_amount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-midnight-950/60 px-3 py-1.5 rounded-lg border border-midnight-800">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Free Delivery &gt; ₹{settings.free_delivery_threshold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search truffle, burger, pizza..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-midnight-900 border border-midnight-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/40 transition-all"
          />
        </div>

        {/* Veg Filter Toggle */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-midnight-900 px-3.5 py-2.5 rounded-xl border border-midnight-800 hover:border-midnight-700 transition-colors">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded bg-midnight-950 border-midnight-700 text-emerald-500 focus:ring-emerald-500/30"
            />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Pure Vegetarian
          </label>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-gold-500 text-midnight-950 shadow-lg shadow-gold-500/20'
              : 'bg-midnight-900 text-slate-300 hover:bg-midnight-850 hover:text-white border border-midnight-800'
          }`}
        >
          All Items ({menuItems.filter((i) => i.availability !== 'hidden').length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-gold-500 text-midnight-950 shadow-lg shadow-gold-500/20'
                : 'bg-midnight-900 text-slate-300 hover:bg-midnight-850 hover:text-white border border-midnight-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid (Rule 4: Available vs Temporarily Unavailable) */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-midnight-900/40 rounded-3xl border border-midnight-800">
          <Info className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No items match your criteria</p>
          <p className="text-slate-500 text-xs mt-1">Try relaxing your search or vegetarian filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            const isAvailable = item.availability === 'available';

            return (
              <div
                key={item.id}
                className={`group relative bg-midnight-900/90 rounded-2xl overflow-hidden border border-midnight-800/90 hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl ${
                  !isAvailable ? 'opacity-65 grayscale-[0.3]' : ''
                }`}
              >
                {/* Image & Badges */}
                <div className="relative h-52 w-full overflow-hidden bg-midnight-950">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/20 to-transparent" />

                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 left-3 bg-midnight-950/80 backdrop-blur-md px-2 py-1 rounded-md border border-midnight-800 flex items-center gap-1.5 shadow">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.is_vegetarian ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>

                  {/* Favorite Toggle Button (Rule 21) */}
                  <button
                    onClick={() => toggleFav(item.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-midnight-950/80 backdrop-blur-md border border-midnight-800 text-slate-400 hover:text-rose-500 transition-colors shadow"
                    title="Add to favorites"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>

                  {/* Prep Time Tag */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-midnight-950/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-midnight-800">
                    <Clock className="w-3.5 h-3.5 text-gold-400" />
                    <span>{item.prep_time_minutes} mins prep</span>
                  </div>

                  {/* Availability Badge if Unavailable (Rule 4) */}
                  {!isAvailable && (
                    <div className="absolute bottom-3 right-3 bg-rose-950/90 border border-rose-800 text-rose-300 text-[10px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1 shadow">
                      <Ban className="w-3 h-3" />
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-100 group-hover:text-gold-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>

                  {/* Pricing and Action */}
                  <div className="mt-5 pt-4 border-t border-midnight-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Price</span>
                      <span className="text-lg font-black text-white font-mono">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-midnight-950 font-bold text-xs shadow-lg shadow-gold-500/10 transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-midnight-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-midnight-700"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
