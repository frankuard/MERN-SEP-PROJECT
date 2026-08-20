import React, { useState, useEffect } from 'react';
import { Wallet, UtensilsCrossed } from 'lucide-react';
import canteenApi from '../../api/canteenApi';
import { CANTEEN_MENU } from '../../data/studentDashboardData';

const CanteenSection = ({
  t,
  canteenCreditBalance = 150,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState(CANTEEN_MENU);
  const [creditBalance, setCreditBalance] = useState(canteenCreditBalance);

  useEffect(() => {
    let isMounted = true;
    canteenApi.getMenu()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
        }
      })
      .catch(() => {});

    canteenApi.getCreditBalance()
      .then((res) => {
        if (isMounted && res && res.remainingBalance !== undefined) {
          setCreditBalance(res.remainingBalance);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [canteenCreditBalance]);

  const categories = ['All', 'Meals', 'Snacks', 'Momo & Noodles', 'Beverages'];

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar: Credit Due Card (Wider, only showing Credit Due, no Pay Khata button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f4336] text-white dark:bg-emerald-600">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                Menu
              </h2>
            </div>
          </div>
        </div>

        {/* Credit Due Card */}
        <div
          className="flex w-full sm:w-auto min-w-[320px] max-w-md items-center justify-between gap-4 rounded-3xl border p-4 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Credit Due (Khata)
              </p>
              <p className="text-base font-black text-amber-700 dark:text-amber-400">
                NPR {creditBalance} Pending
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1 text-[11px] font-bold">
            Due Balance
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#2f4336] text-white shadow-xs dark:bg-emerald-600'
                : 'border hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              borderColor: selectedCategory === cat ? '#2f4336' : t.border,
              color: selectedCategory === cat ? '#ffffff' : t.textPrimary,
              backgroundColor: selectedCategory === cat ? undefined : (t.cardBg || '#ffffff'),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food Cards Grid (Dashboard Image Direction: Top Image, Bold Title & Aligned Price Below) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col overflow-hidden rounded-[24px] border shadow-xs transition-all hover:shadow-lg"
            style={{
              backgroundColor: t.cardBg || '#ffffff',
              borderColor: t.border,
            }}
          >
            {/* Food Image */}
            <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-amber-50/50 dark:bg-zinc-900">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  if (item.fallbackImage && e.currentTarget.src !== item.fallbackImage) {
                    e.currentTarget.src = item.fallbackImage;
                  }
                }}
              />
            </div>

            {/* Food Name, Subtitle & Price */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <h4
                  className="text-base font-extrabold tracking-tight line-clamp-1"
                  style={{ color: t.textPrimary }}
                  title={item.name}
                >
                  {item.name}
                </h4>
                <p
                  className="mt-0.5 text-xs font-semibold line-clamp-1"
                  style={{ color: t.textMuted }}
                  title={item.subtitle}
                >
                  {item.subtitle || item.category}
                </p>
              </div>

              {/* Price Pill */}
              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: t.border }}
              >
                <span className="text-xs font-bold" style={{ color: t.textMuted }}>
                  Price
                </span>
                <span className="rounded-xl bg-[#2f4336] px-3.5 py-1.5 text-sm font-black tabular-nums text-white shadow-xs dark:bg-emerald-700">
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
