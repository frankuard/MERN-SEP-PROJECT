import React from 'react';
import { X, Wallet, QrCode, Banknote, Loader2 } from 'lucide-react';

const PayCreditModal = ({
  isOpen,
  onClose,
  t,
  canteenCreditBalance,
  studentName,
  userEmail,
  isCheckingByOwner,
  onPayOnline,
  onPayCash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-amber-600" />
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
              Pay Credit Due (Khata)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 text-center">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Total Pending Balance
            </p>
            <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
              NPR {canteenCreditBalance}
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
              Account: {studentName} ({userEmail || 'Student Portal'})
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
              Select Settlement Option:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                disabled={isCheckingByOwner}
                onClick={onPayOnline}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                <QrCode size={16} /> Pay via Fonepay QR
              </button>

              <button
                type="button"
                disabled={isCheckingByOwner}
                onClick={onPayCash}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-xs transition-all ${
                  isCheckingByOwner
                    ? 'bg-amber-600 animate-pulse cursor-not-allowed'
                    : 'bg-[#2f4336] hover:bg-[#25362b]'
                }`}
              >
                {isCheckingByOwner ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                <span>{isCheckingByOwner ? 'Checking by owner (3s)...' : 'Pay Cash at Counter'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={isCheckingByOwner}
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-xs font-bold"
            style={{ borderColor: t.border }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayCreditModal;
