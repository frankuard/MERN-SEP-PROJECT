import React, { useState } from 'react';
import { ArrowRight, ImageIcon, Sparkles, UtensilsCrossed } from 'lucide-react';
import { CANTEEN_SPECIALS_LIST } from '../../../data/studentDashboardData';

const CARD_STYLES = {
  primary: { bg: '#111111', tint: '#fef9c3', label: 'Special' },
  sky: { bg: '#f472b6', tint: '#fce7f3', label: 'Popular' },
  teal: { bg: '#34d399', tint: '#d1fae5', label: 'Veg' },
  slate: { bg: '#a78bfa', tint: '#ede9fe', label: 'Drink' },
};

const FoodImage = ({ src, alt, tint }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ backgroundColor: tint }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <ImageIcon size={22} className="text-gray-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Photo coming soon</span>
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" onError={() => setFailed(true)} />
  );
};

const CanteenSpecial = ({ t, onNavigateTab }) => {
  const featured = CANTEEN_SPECIALS_LIST.find((item) => item.featured);
  const others = CANTEEN_SPECIALS_LIST.filter((item) => !item.featured);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            <UtensilsCrossed size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: t.textPrimary }}>Today&apos;s Canteen Special</h2>
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>Fresh picks from the campus kitchen</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('canteen')}
          className="dashboard-btn-bounce inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-xs font-extrabold text-white"
          style={{ boxShadow: t.shadowSoft }}
        >
          View full menu
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {featured && (
          <button
            type="button"
            onClick={() => onNavigateTab('canteen')}
            className="dashboard-card-lift group overflow-hidden rounded-[28px] text-left lg:col-span-5"
            style={{ boxShadow: t.shadowCard, backgroundColor: CARD_STYLES.primary.tint }}
          >
            <div className="relative h-48 overflow-hidden sm:h-52">
              <FoodImage src={featured.image} alt={featured.name} tint={CARD_STYLES.primary.tint} />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                <Sparkles size={12} />
                Special of the day
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold" style={{ color: t.textPrimary }}>{featured.name}</p>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>{featured.subtitle}</p>
                </div>
                <span className="shrink-0 rounded-2xl bg-black px-3 py-1.5 text-base font-extrabold tabular-nums text-white">
                  NPR {featured.price}
                </span>
              </div>
            </div>
          </button>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          {others.map((item) => {
            const style = CARD_STYLES[item.cardColor] || CARD_STYLES.sky;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateTab('canteen')}
                className="dashboard-card-lift group overflow-hidden rounded-[24px] text-left"
                style={{ boxShadow: t.shadowSoft }}
              >
                <div className="relative h-32 overflow-hidden">
                  <FoodImage src={item.image} alt={item.name} tint={style.tint} />
                  <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase text-white" style={{ backgroundColor: style.bg }}>
                    {style.label}
                  </span>
                </div>
                <div className="p-4" style={{ backgroundColor: style.tint }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>{item.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: t.textMuted }}>{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 rounded-xl px-2 py-1 text-sm font-extrabold tabular-nums text-white" style={{ backgroundColor: style.bg }}>
                      {item.price}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CanteenSpecial;
