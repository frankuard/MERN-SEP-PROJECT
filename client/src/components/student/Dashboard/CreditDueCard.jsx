import { Wallet } from 'lucide-react';

const CreditDueCard = ({ t, amountDue = 0, amountPaid = 0 }) => {
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
        <p className="mt-1 text-2xl font-extrabold" style={{ color: t.textPrimary }}>NPR {amountDue}</p>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>NPR {amountPaid} paid so far</p>
      </div>
    </div>
  );
};

export default CreditDueCard;