import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const CanteenCartDrawer = ({ t, cart, setCart, onClose, onCheckout }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l"
        style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelBlue }}>
              <ShoppingBag size={17} style={{ color: t.textPrimary }} />
            </div>
            <div>
              <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Your Cart</p>
              <p className="text-xs" style={{ color: t.textMuted }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pageBg }}>
                <ShoppingBag size={22} style={{ color: t.textMuted }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: t.textPrimary }}>Your cart is empty</p>
                <p className="text-xs" style={{ color: t.textMuted }}>Add some food from the menu to get started.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>{item.name}</p>
                    <p className="text-xs font-bold tabular-nums" style={{ color: t.textMuted }}>NPR {item.price}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item._id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border"
                        style={{ borderColor: t.border, color: t.textPrimary }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="min-w-5 text-center text-sm font-extrabold tabular-nums" style={{ color: t.textPrimary }}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item._id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border"
                        style={{ borderColor: t.border, color: t.textPrimary }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item._id)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="text-sm font-black tabular-nums" style={{ color: t.textPrimary }}>
                      NPR {item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-4" style={{ borderColor: t.border }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: t.textMuted }}>Subtotal</span>
            <span className="text-lg font-black tabular-nums" style={{ color: t.textPrimary }}>NPR {subtotal}</span>
          </div>
          <p className="mb-3 text-[11px]" style={{ color: t.textMuted }}>
            Table number & payment method are selected at checkout.
          </p>
          <button
            type="button"
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proceed to Checkout <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanteenCartDrawer;