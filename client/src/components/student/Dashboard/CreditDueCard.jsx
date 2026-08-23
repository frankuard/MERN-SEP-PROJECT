import { Wallet, ArrowRight } from 'lucide-react';

const CreditDueCard = ({ t, amountDue = 0, onViewHistory }) => {
  return (
    <div
      className="flex w-full flex-col justify-center gap-3 rounded-[24px] border p-5 sm:aspect-square sm:w-52"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelYellow }}>
        <Wallet size={22} style={{ color: t.textPrimary }} />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Credit Due</p>
        {amountDue > 0 ? (
          <p className="mt-1 text-2xl font-extrabold" style={{ color: t.textPrimary }}>NPR {amountDue}</p>
        ) : amountDue < 0 ? (
          <p className="mt-1 text-2xl font-extrabold" style={{ color: t.accentEmerald }}>+NPR {Math.abs(amountDue)} credit</p>
        ) : (
          <p className="mt-1 text-2xl font-extrabold" style={{ color: t.textMuted }}>Cleared</p>
        )}
      </div>

      <button
        type="button"
        onClick={onViewHistory}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-opacity hover:opacity-90"
        style={{ backgroundColor: t.pageBg, color: t.textPrimary }}
      >
        View History
        <ArrowRight size={12} />
      </button>
    </div>
  );
};

export default CreditDueCard;