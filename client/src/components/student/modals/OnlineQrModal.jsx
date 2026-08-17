import React from 'react';
import { X, QrCode, CheckCircle2 } from 'lucide-react';

const OnlineQrModal = ({ isOpen, onClose, t, lastPlacedOrder, onConfirm }) => {
  if (!isOpen || !lastPlacedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2 text-left">
            <QrCode size={18} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                Scan &amp; Pay Online
              </h3>
              <p className="text-[11px]" style={{ color: t.textMuted }}>
                Machhapuchchhre Bank / Fonepay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Attached QR Code Image */}
        <div className="mx-auto overflow-hidden rounded-2xl border bg-white p-2 shadow-xs max-w-[260px]">
          <img
            src="/canteen-qr.jpg"
            alt="Machhapuchchhre Bank Fonepay QR - Suraj Poddar"
            className="h-auto w-full object-contain rounded-xl select-none"
          />
        </div>

        {/* Total to pay */}
        <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3">
          <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
            Amount to Pay
          </p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">
            NPR {lastPlacedOrder.amount}
          </p>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
            Order: {lastPlacedOrder.item}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f4336] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
          >
            <CheckCircle2 size={16} /> I Have Paid / Confirm Order
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border py-2 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: t.border }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineQrModal;
