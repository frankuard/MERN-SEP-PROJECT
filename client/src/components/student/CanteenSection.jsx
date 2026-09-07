import { useState, useEffect, useCallback } from 'react';
import { Search, UtensilsCrossed, ImageIcon, Sparkles, Flame, ShoppingBag, Plus, Check, ReceiptText } from 'lucide-react';
import canteenApi from '../../api/canteenApi';
import CreditDueCard from './Dashboard/CreditDueCard';
import CreditHistoryModal from './modals/CreditHistoryModal';
import CanteenCartDrawer from './canteen/CanteenCartDrawer';
import CanteenCheckoutModal from './canteen/CanteenCheckoutModal';
import MyOrdersPanel from './canteen/MyOrdersPanel';

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
  const [view, setView] = useState('menu'); // 'menu' | 'orders'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [credit, setCredit] = useState({ amountDue: 0 });
  const [showCreditHistory, setShowCreditHistory] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      // menu grid stays as-is on failure; no dedicated error state wired here yet
    }
  }, [selectedCategory, search]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  useEffect(() => {
    let mounted = true;
    canteenApi.getCreditBalance()
      .then((res) => {
        if (mounted && res) setCredit({ amountDue: res.remainingBalance ?? 0 });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { _id: item._id, name: item.name, price: item.price, image: item.image, quantity: 1 }];
    });
  };

  const cartQtyFor = (id) => cart.find((i) => i._id === id)?.quantity || 0;

  const handleOrderPlaced = () => {
    setCart([]);
    setCartOpen(false);
    setCheckoutOpen(false);
    setView('orders');
    // refresh credit balance in case credit due was requested
    canteenApi.getCreditBalance()
      .then((res) => { if (res) setCredit({ amountDue: res.remainingBalance ?? 0 }); })
      .catch(() => {});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header row with view switcher + search + credit card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          {view === 'menu' ? (
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-1"
              style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: t.accentPrimary }}
            />
          ) : (
            <div
              className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold"
              style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
            >
              <ReceiptText size={16} />
              Browse menu again to place a new order
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border, backgroundColor: t.cardBg }}>
            <button
              type="button"
              onClick={() => setView('menu')}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              style={{ backgroundColor: view === 'menu' ? t.accentPrimary : 'transparent', color: view === 'menu' ? t.pageBg : t.textPrimary }}
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => setView('orders')}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              style={{ backgroundColor: view === 'orders' ? t.accentPrimary : 'transparent', color: view === 'orders' ? t.pageBg : t.textPrimary }}
            >
              My Orders
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            disabled={cartCount === 0}
            className="relative flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <>
                <span className="hidden sm:inline text-xs font-bold" style={{ color: t.textMuted }}>·</span>
                <span className="tabular-nums">{cartCount}</span>
              </>
            )}
            <span
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
              style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}
            >
              {cartCount}
            </span>
          </button>
          <CreditDueCard t={t} amountDue={credit.amountDue} onViewHistory={() => setShowCreditHistory(true)} />
        </div>
      </div>

      {view === 'orders' ? (
        <MyOrdersPanel t={t} onStartOrdering={() => setView('menu')} />
      ) : (
        <>
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

          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
                <UtensilsCrossed size={20} style={{ color: t.textMuted }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>No items in this category</p>
                <p className="text-sm" style={{ color: t.textMuted }}>Try a different category or check back later.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {menuItems.map((item) => {
                const inCartQty = cartQtyFor(item._id);
                return (
                  <div
                    key={item._id}
                    className="group flex flex-col overflow-hidden rounded-3xl border transition-all hover:shadow-lg"
                    style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
                  >
                    <div className="relative h-44 w-full overflow-hidden sm:h-48">
                      <FoodImage src={item.image} alt={item.name} tint={t.pastelBlue} />
                      {item.isSpecialOfTheDay && (
                        <span
                          className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: '#ef4444' }}
                        >
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
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        disabled={item.availability === false}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-extrabold transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: inCartQty > 0 ? t.accentPrimary : t.border, color: t.textPrimary }}
                      >
                        {inCartQty > 0 ? (
                          <>
                            <Check size={14} /> Added ({inCartQty}) <Plus size={12} />
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> {item.availability === false ? 'Unavailable' : 'Add to Cart'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {cartOpen && (
        <CanteenCartDrawer
          t={t}
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
      )}

      {checkoutOpen && cart.length > 0 && (
        <CanteenCheckoutModal
          t={t}
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderPlaced}
        />
      )}

      <CreditHistoryModal isOpen={showCreditHistory} onClose={() => setShowCreditHistory(false)} t={t} />
    </div>
  );
};

export default CanteenSection;