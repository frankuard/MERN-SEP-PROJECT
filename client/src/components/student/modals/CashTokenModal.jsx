import React from 'react';
import { Banknote } from 'lucide-react';

const CashTokenModal = ({ isOpen, onClose, t, lastPlacedOrder }) => {
  if (!isOpen || !lastPlacedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-3">
          <Banknote size={28} />
        </div>

        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
          Cash Order Confirmed!
        </h3>
        <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
          Please go to the canteen counter to pay and collect your meal.
        </p>

        <div className="mt-4 rounded-2xl border p-4 bg-black/5 dark:bg-white/5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Your Token Number
          </p>
          <p className="text-4xl font-extrabold text-[#2f4336] dark:text-emerald-400">
            #{lastPlacedOrder.tokenNumber}
          </p>
          <p className="text-xs font-semibold text-emerald-600">
            Amount to Pay: NPR {lastPlacedOrder.amount}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#2f4336] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
        >
          Done / Got It
        </button>
      </div>
    </div>
  );
};

export default CashTokenModal;
