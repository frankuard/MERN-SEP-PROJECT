import { useState } from 'react';
import {
  X, Table2, Wallet, Banknote, CheckCircle2, ArrowLeft,
  ArrowRight, Loader2, ShoppingBag, CreditCard, ReceiptText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';
import CanteenTableMap from './CanteenTableMap';

const CanteenCheckoutModal = ({ t, cart, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleNextToPayment = () => {
    setError('');
    if (!tableNumber) {
      setError('Please select a table number (1–9) before proceeding.');
      return;
    }
    setStep(2);
  };

  const handleNextToConfirm = () => {
    setError('');
    if (!paymentMethod) {
      setError('Please choose a payment method before proceeding.');
      return;
    }
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || !paymentMethod) return;
    setPlacing(true);
    setError('');
    try {
      const payload = {
        items: cart.map((item) => ({ foodItem: item._id, quantity: item.quantity })),
        tableNumber: Number(tableNumber),
        paymentMethod,
      };
      await canteenApi.placeOrder(payload);
      toast.success('Order placed successfully! 🎉');
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to place the order. Please try again.');
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: t.border }}>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Checkout</h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold">
              {[
                { id: 1, label: 'Table' },
                { id: 2, label: 'Payment' },
                { id: 3, label: 'Confirm' },
              ].map((s, idx) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="h-px w-4" style={{ backgroundColor: t.border }} />}
                  <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: step >= s.id ? t.accentPrimary : t.pageBg,
                      color: step >= s.id ? t.pageBg : t.textMuted,
                    }}
                  >
                    {s.id < step ? <CheckCircle2 size={11} /> : null}
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={placing} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-xl border px-4 py-2.5 text-xs font-bold" style={{ borderColor: '#fecaca', color: '#b91c1c', backgroundColor: '#fef2f2' }}>
              {error}
            </div>
          )}

          {/* STEP 1 — TABLE SELECTION (interactive canteen map) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelBlue }}>
                  <Table2 size={18} style={{ color: t.textPrimary }} />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Select Your Table</p>
                  <p className="text-xs" style={{ color: t.textMuted }}>Tap a table on the canteen map below.</p>
                </div>
              </div>

              <CanteenTableMap
                selectedTable={tableNumber}
                onSelect={(num) => setTableNumber(num)}
                t={t}
              />
            </div>
          )}

          {/* STEP 2 — PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelYellow }}>
                  <CreditCard size={18} style={{ color: t.textPrimary }} />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Payment Method</p>
                  <p className="text-xs" style={{ color: t.textMuted }}>How would you like to pay?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentMethod('Credit Due')}
                className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all"
                style={{
                  backgroundColor: paymentMethod === 'Credit Due' ? t.pageBg : t.cardBg,
                  borderColor: paymentMethod === 'Credit Due' ? t.accentPrimary : t.border,
                  boxShadow: paymentMethod === 'Credit Due' ? `0 0 0 2px ${t.accentPrimary}22` : 'none',
                }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelYellow }}>
                  <Wallet size={20} style={{ color: t.textPrimary }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Add to Credit Due</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    Amount is added to your canteen credit due. Admin approves before it is billed.
                  </p>
                </div>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: paymentMethod === 'Credit Due' ? t.accentPrimary : t.border }}
                >
                  {paymentMethod === 'Credit Due' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.accentPrimary }} />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Pay at Counter')}
                className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all"
                style={{
                  backgroundColor: paymentMethod === 'Pay at Counter' ? t.pageBg : t.cardBg,
                  borderColor: paymentMethod === 'Pay at Counter' ? t.accentPrimary : t.border,
                  boxShadow: paymentMethod === 'Pay at Counter' ? `0 0 0 2px ${t.accentPrimary}22` : 'none',
                }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelCyan }}>
                  <Banknote size={20} style={{ color: t.textPrimary }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Pay at Counter</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    Pay cash/QR at the canteen counter when you receive your food.
                  </p>
                </div>
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: paymentMethod === 'Pay at Counter' ? t.accentPrimary : t.border }}
                >
                  {paymentMethod === 'Pay at Counter' && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.accentPrimary }} />}
                </div>
              </button>
            </div>
          )}

          {/* STEP 3 — CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelCyan }}>
                  <ReceiptText size={18} style={{ color: t.textPrimary }} />
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Confirm Your Order</p>
                  <p className="text-xs" style={{ color: t.textMuted }}>Review everything before placing the order.</p>
                </div>
              </div>

              <div className="space-y-2.5 rounded-2xl border p-4" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold" style={{ color: t.textMuted }}>Table</span>
                  <span className="font-extrabold" style={{ color: t.textPrimary }}>Table {tableNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold" style={{ color: t.textMuted }}>Payment Method</span>
                  <span className="font-extrabold" style={{ color: t.textPrimary }}>{paymentMethod === 'Credit Due' ? 'Add to Credit Due' : 'Pay at Counter'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold" style={{ color: t.textMuted }}>Payment Status</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase"
                    style={{
                      backgroundColor: paymentMethod === 'Credit Due' ? '#fef3c7' : '#dbeafe',
                      color: paymentMethod === 'Credit Due' ? '#b45309' : '#1d4ed8',
                    }}
                  >
                    {paymentMethod === 'Credit Due' ? 'Pending Approval' : 'Pending Counter Payment'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 rounded-2xl border p-4" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>Items ({cart.reduce((s, i) => s + i.quantity, 0)})</p>
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black" style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}>
                        x{item.quantity}
                      </span>
                      <span className="truncate font-bold" style={{ color: t.textPrimary }}>{item.name}</span>
                    </div>
                    <span className="shrink-0 font-extrabold tabular-nums" style={{ color: t.textPrimary }}>NPR {item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: t.border }}>
                  <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Total Amount</span>
                  <span className="text-base font-black tabular-nums" style={{ color: t.accentPrimary }}>NPR {subtotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4" style={{ borderColor: t.border }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Total</p>
            <p className="text-lg font-black tabular-nums" style={{ color: t.textPrimary }}>NPR {subtotal}</p>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(''); setStep(step - 1); }}
                disabled={placing}
                className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                style={{ borderColor: t.border, color: t.textPrimary }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={step === 1 ? handleNextToPayment : handleNextToConfirm}
                className="flex items-center gap-1.5 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {placing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                {placing ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenCheckoutModal;