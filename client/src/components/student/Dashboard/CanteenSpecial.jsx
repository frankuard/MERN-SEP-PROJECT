import { useState, useEffect } from 'react';
import { ArrowRight, ImageIcon, Sparkles, UtensilsCrossed } from 'lucide-react';
import canteenApi from '../../../api/canteenApi';

const OTHER_CARD_TINTS = ['pastelPink', 'pastelCyan', 'pastelPurple'];
const OTHER_CARD_ACCENTS = ['#f472b6', '#22d3ee', '#a78bfa'];

const FoodImage = ({ src, alt, tint }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
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
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

const CanteenSpecial = ({ t, onNavigateTab }) => {
  const [featured, setFeatured] = useState(null);
  const [others, setOthers] = useState([]);

  useEffect(() => {
    let mounted = true;
    canteenApi.getMenu()
      .then((data) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        const special = data.find((it) => it.isSpecialOfTheDay) || data[0];
const rest = data.filter((it) => it._id !== special._id).slice(0, 2);        setFeatured(special);
        setOthers(rest);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!featured) return null;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            <UtensilsCrossed size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: t.textPrimary }}>Today's Canteen Special</h2>
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
        <button
          type="button"
          onClick={() => onNavigateTab('canteen')}
          className="dashboard-card-lift group overflow-hidden rounded-[28px] text-left lg:col-span-5"
          style={{ boxShadow: t.shadowCard, backgroundColor: t.pastelYellow }}
        >
          <div className="relative h-48 overflow-hidden sm:h-52">
            <FoodImage src={featured.image} alt={featured.name} tint={t.pastelYellow} />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
              <Sparkles size={12} />
              Special of the day
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold" style={{ color: t.textPrimary }}>{featured.name}</p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>{featured.description}</p>
              </div>
              <span className="shrink-0 rounded-2xl bg-black px-3 py-1.5 text-base font-extrabold tabular-nums text-white">
                NPR {featured.price}
              </span>
            </div>
          </div>
        </button>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">          {others.map((item, i) => {
            const tint = t[OTHER_CARD_TINTS[i % OTHER_CARD_TINTS.length]];
            const accent = OTHER_CARD_ACCENTS[i % OTHER_CARD_ACCENTS.length];
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => onNavigateTab('canteen')}
                className="dashboard-card-lift group overflow-hidden rounded-[24px] text-left"
                style={{ boxShadow: t.shadowSoft }}
              >
                <div className="relative h-32 overflow-hidden">
                  <FoodImage src={item.image} alt={item.name} tint={tint} />
                  <span
                    className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {item.isPopular ? 'Popular' : item.category}
                  </span>
                </div>
                <div className="p-4" style={{ backgroundColor: tint }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>{item.name}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold" style={{ color: t.textMuted }}>{item.description}</p>
                    </div>
                    <span className="shrink-0 rounded-xl px-2 py-1 text-sm font-extrabold tabular-nums text-white" style={{ backgroundColor: accent }}>
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