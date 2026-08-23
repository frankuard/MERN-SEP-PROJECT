import { useState, useEffect, useCallback } from 'react';
import { Search, UtensilsCrossed, ImageIcon, Sparkles, Flame } from 'lucide-react';
import canteenApi from '../../api/canteenApi';
import CreditDueCard from './Dashboard/CreditDueCard';

const CATEGORIES = ['All', 'Meals', 'Snacks', 'Momo & Noodles', 'Beverages'];

const FoodImage = ({ src, alt, tint }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ backgroundColor: tint }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
          <ImageIcon size={20} className="text-gray-400" />
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const CanteenSection = ({ t }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [credit, setCredit] = useState({ amountDue: 0, amountPaid: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchMenu = useCallback(async () => {
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      const data = await canteenApi.getMenu(params);
      if (Array.isArray(data)) setMenuItems(data);
    } catch {
      // menu grid just stays as-is on failure; not wiring a dedicated error state here per current scope
    }
  }, [selectedCategory, search]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useEffect(() => {
    let mounted = true;
    canteenApi.getCreditBalance()
      .then((res) => {
if (mounted && res) setCredit({ amountDue: res.remainingBalance ?? 0, amountPaid: res.amountPaid ?? 0 });      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <UtensilsCrossed size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Menu</h2>
      </div>

<div className="flex flex-col gap-3 sm:flex-row sm:items-start">        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-1"
            style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: t.accentPrimary }}
          />
        </div>
        <CreditDueCard t={t} amountDue={credit.amountDue} amountPaid={credit.amountPaid} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className="shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-all"
            style={{
              backgroundColor: selectedCategory === cat ? t.accentPrimary : t.cardBg,
              color: selectedCategory === cat ? t.pageBg : t.textPrimary,
              border: selectedCategory === cat ? 'none' : `1px solid ${t.border}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {menuItems.map((item) => (
          <div
            key={item._id}
            className="group flex flex-col overflow-hidden rounded-[24px] border transition-all hover:shadow-lg"
            style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
          >
            <div className="relative h-44 w-full overflow-hidden sm:h-48">
              <FoodImage src={item.image} alt={item.name} tint={t.pastelBlue} />
              {item.isSpecialOfTheDay && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-extrabold uppercase text-white">
                  <Sparkles size={11} />
                  Special
                </span>
              )}
              {item.isPopular && !item.isSpecialOfTheDay && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase text-white" style={{ backgroundColor: '#f472b6' }}>
                  <Flame size={11} />
                  Popular
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <h4 className="text-base font-extrabold tracking-tight line-clamp-1" style={{ color: t.textPrimary }} title={item.name}>
                  {item.name}
                </h4>
                <p className="mt-0.5 text-xs font-semibold line-clamp-1" style={{ color: t.textMuted }} title={item.description}>
                  {item.description || item.category}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
                <span className="text-xs font-bold" style={{ color: t.textMuted }}>Price</span>
                <span
                  className="rounded-xl px-3.5 py-1.5 text-sm font-black tabular-nums"
                  style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}
                >
                  NPR {item.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanteenSection;