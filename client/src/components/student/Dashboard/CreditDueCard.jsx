import { Wallet, ArrowRight } from 'lucide-react';

const CreditDueCard = ({ t, amountDue = 0, onViewHistory }) => {
  return (
    <div
      className="flex w-full shrink-0 items-center gap-5 rounded-2xl border px-6 py-5 sm:w-auto"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelYellow }}>
        <Wallet size={26} style={{ color: t.textPrimary }} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Credit Due</p>
        {amountDue > 0 ? (
          <p className="text-xl font-extrabold tabular-nums" style={{ color: t.textPrimary }}>NPR {amountDue}</p>
        ) : amountDue < 0 ? (
          <p className="text-xl font-extrabold tabular-nums" style={{ color: t.accentEmerald }}>+NPR {Math.abs(amountDue)}</p>
        ) : (
          <p className="text-xl font-extrabold" style={{ color: t.textMuted }}>Cleared</p>
        )}
      </div>

      <button
        type="button"
        onClick={onViewHistory}
        className="ml-2 flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80"
        style={{ borderColor: t.border, color: t.textPrimary, backgroundColor: t.pageBg }}
      >
        View History
        <ArrowRight size={11} />
      </button>
    </div>
  );
};

export default CreditDueCard;