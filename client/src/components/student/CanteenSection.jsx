import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Wallet, ShoppingBag, Plus, Minus,
  Banknote, QrCode, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CANTEEN_MENU } from '../../data/studentDashboardData';
import canteenApi from '../../api/canteenApi';
import OnlineQrModal from './modals/OnlineQrModal';
import CashTokenModal from './modals/CashTokenModal';
import PayCreditModal from './modals/PayCreditModal';

const CanteenSection = ({
  t,
  user,
  studentName,
  canteenCreditBalance,
  setCanteenCreditBalance,
}) => {
  const [cart, setCart] = useState({});
  const [orderPreference, setOrderPreference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isCheckingByOwner, setIsCheckingByOwner] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  // Modals inside Canteen Section
  const [showOnlineQrModal, setShowOnlineQrModal] = useState(false);
  const [showCashTokenModal, setShowCashTokenModal] = useState(false);
  const [showPayCreditModal, setShowPayCreditModal] = useState(false);

  const updateCartQuantity = (itemId, delta) => {
    setCart((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const item = CANTEEN_MENU.find((m) => m.id === id);
        return item ? { ...item, qty, total: item.price * qty } : null;
      })
      .filter(Boolean);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.total, 0);
  }, [cartItems]);

  const handleProcessOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Please add at least one food item to your order.');
      return;
    }

    const orderDescription = cartItems.map((i) => `${i.name} × ${i.qty}`).join(', ');
    const orderPayload = {
      item: orderDescription,
      amount: cartSubtotal,
      preference: orderPreference,
      paymentMethod,
    };

    const orderResult = await canteenApi.placeOrder(orderPayload);
    setLastPlacedOrder(orderResult);

    if (paymentMethod === 'cash') {
      setShowCashTokenModal(true);
      toast('Please go to counter to pay cash & collect your token.', {
        icon: '💵',
        duration: 4000,
      });
      setCart({});
      setOrderPreference('');
    } else if (paymentMethod === 'online') {
      setShowOnlineQrModal(true);
    } else if (paymentMethod === 'canteen_credit') {
      setCanteenCreditBalance((prev) => prev + cartSubtotal);
      toast.success(
        `Order placed! NPR ${cartSubtotal} added to your Credit Due (Khata). Total due: NPR ${canteenCreditBalance + cartSubtotal}`,
        { icon: '💳', duration: 4500 }
      );
      setCart({});
      setOrderPreference('');
    }
  };

  const handleConfirmOnlinePayment = () => {
    if (!lastPlacedOrder) return;
    toast.success(`Online payment of NPR ${lastPlacedOrder.amount} verified! Order sent to kitchen.`, { icon: '✅' });
    setShowOnlineQrModal(false);
    setCart({});
    setOrderPreference('');
  };

  const handleClearCreditCash = async () => {
    if (canteenCreditBalance <= 0) {
      toast('You have no pending balance to clear.', { icon: 'ℹ️' });
      return;
    }
    setIsCheckingByOwner(true);
    const amountToClear = canteenCreditBalance;

    toast.loading('Cash submitted at counter! (Checking by owner... ⏳)', {
      id: 'canteen_cash_settle',
      duration: 3000,
    });

    setTimeout(async () => {
      await canteenApi.clearCreditCash(amountToClear);
      setIsCheckingByOwner(false);
      setCanteenCreditBalance(0);
      setShowPayCreditModal(false);
      toast.success(`✅ Canteen Owner approved payment of NPR ${amountToClear}! Credit Due is now NPR 0.`, {
        id: 'canteen_cash_settle',
        duration: 4000,
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Credit Balance Card */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="text-amber-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Campus Canteen &amp; Food Ordering
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
            Order fresh campus meals, specify preferences, and pay via Cash, Online QR, or Credit Khata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-3 rounded-2xl border p-3.5 shadow-xs"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Credit Due (Khata)
              </p>
              <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">
                NPR {canteenCreditBalance} Pending
              </p>
            </div>
            {canteenCreditBalance > 0 && (
              <button
                type="button"
                onClick={() => setShowPayCreditModal(true)}
                className="ml-2 rounded-xl bg-[#2f4336] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
              >
                Pay Khata
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Ordering Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Menu Items */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: t.border }}>
            <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
              Available Menu Items
            </h3>
            <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
              {CANTEEN_MENU.length} Items Available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {CANTEEN_MENU.map((item) => {
              const qtyInCart = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {item.name}
                      </h4>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Available
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: t.textMuted }}>
                      {item.category}
                    </span>
                    <p className="text-sm font-extrabold text-emerald-600">
                      NPR {item.price}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ borderColor: t.border }}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-xs font-bold" style={{ color: t.textPrimary }}>
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2f4336] text-white hover:bg-[#25362b]"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: t.border, color: t.textPrimary }}
                      >
                        <Plus size={13} /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Checkout & Custom Preferences */}
        <div className="space-y-4 lg:col-span-5">
          <div
            className="rounded-2xl border p-5 shadow-xs sticky top-24"
            style={{
              backgroundColor: t.cardBg || '#ffffff',
              borderColor: t.border,
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Your Food Cart
                </h3>
              </div>
              <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                {cartItems.length} items
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="py-8 text-center" style={{ color: t.textMuted }}>
                <ShoppingBag size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold">Your food cart is empty</p>
                <p className="text-[11px]">Click &quot;Add to Cart&quot; on any menu dish to order</p>
              </div>
            ) : (
              <form onSubmit={handleProcessOrder} className="mt-4 space-y-4">
                {/* Itemized List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border p-2.5 text-xs"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <div>
                        <p className="font-bold" style={{ color: t.textPrimary }}>
                          {item.name}
                        </p>
                        <p className="text-[11px]" style={{ color: t.textMuted }}>
                          NPR {item.price} × {item.qty}
                        </p>
                      </div>
                      <span className="font-extrabold text-emerald-600">
                        NPR {item.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Extra Preferences */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: t.textPrimary }}>
                    Extra Preferences (What else is needed?)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Extra spicy achar, no onions, pack separately for takeaway..."
                    value={orderPreference}
                    onChange={(e) => setOrderPreference(e.target.value)}
                    className="w-full rounded-xl border p-2.5 text-xs outline-none"
                    style={{
                      backgroundColor: t.pageBg,
                      borderColor: t.border,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: t.textPrimary }}>
                    Select Payment Option
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-[#2f4336] bg-[#2f4336] text-white shadow-xs'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{ borderColor: paymentMethod === 'cash' ? '#2f4336' : t.border }}
                    >
                      <Banknote size={16} className="mb-1" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                        paymentMethod === 'online'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{ borderColor: paymentMethod === 'online' ? '#2563eb' : t.border }}
                    >
                      <QrCode size={16} className="mb-1" />
                      <span>Online (QR)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('canteen_credit')}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 font-bold transition-all ${
                        paymentMethod === 'canteen_credit'
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={{ borderColor: paymentMethod === 'canteen_credit' ? '#d97706' : t.border }}
                    >
                      <CreditCard size={16} className="mb-1" />
                      <span>Credit Khata</span>
                    </button>
                  </div>

                  {paymentMethod === 'cash' && (
                    <p className="mt-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-[11px] font-medium" style={{ color: t.textMuted }}>
                      ℹ️ Pay NPR {cartSubtotal} at the counter when picking up your food.
                    </p>
                  )}

                  {paymentMethod === 'online' && (
                    <p className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2 text-[11px] font-medium text-blue-800 dark:text-blue-300">
                      ℹ️ Scan Machhapuchchhre Bank QR code (Fonepay/eSewa/Khalti) on the next step.
                    </p>
                  )}

                  {paymentMethod === 'canteen_credit' && (
                    <p className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      ℹ️ NPR {cartSubtotal} will be added to your pending Credit Due (Khata).
                    </p>
                  )}
                </div>

                {/* Subtotal & Order Button */}
                <div className="border-t pt-3" style={{ borderColor: t.border }}>
                  <div className="flex items-center justify-between text-sm font-bold mb-3">
                    <span style={{ color: t.textPrimary }}>Total Amount:</span>
                    <span className="text-base text-emerald-600 font-extrabold">
                      NPR {cartSubtotal}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#25362b]"
                  >
                    {paymentMethod === 'online'
                      ? 'Proceed to QR Payment →'
                      : paymentMethod === 'cash'
                      ? 'Confirm Cash Order'
                      : 'Add to Credit Khata & Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modals for Canteen */}
      <OnlineQrModal
        isOpen={showOnlineQrModal}
        onClose={() => setShowOnlineQrModal(false)}
        t={t}
        lastPlacedOrder={lastPlacedOrder}
        onConfirm={handleConfirmOnlinePayment}
      />

      <CashTokenModal
        isOpen={showCashTokenModal}
        onClose={() => setShowCashTokenModal(false)}
        t={t}
        lastPlacedOrder={lastPlacedOrder}
      />

      <PayCreditModal
        isOpen={showPayCreditModal}
        onClose={() => setShowPayCreditModal(false)}
        t={t}
        canteenCreditBalance={canteenCreditBalance}
        studentName={studentName}
        userEmail={user?.email}
        isCheckingByOwner={isCheckingByOwner}
        onPayOnline={() => {
          setShowPayCreditModal(false);
          setLastPlacedOrder({ amount: canteenCreditBalance, item: 'Credit Khata Balance Settlement' });
          setShowOnlineQrModal(true);
        }}
        onPayCash={handleClearCreditCash}
      />
    </div>
  );
};

export default CanteenSection;
