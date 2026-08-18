import { useMemo } from 'react';
import { Clock } from 'lucide-react';

const NavbarMeta = ({ t }) => {
  const now = useMemo(() => new Date(), []);
  const dateLabel = useMemo(
    () => now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    [now]
  );
  const timeLabel = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    [now]
  );

  return (
    <div
      className="hidden items-center gap-2.5 rounded-xl border px-4 py-2.5 sm:flex"
      style={{ backgroundColor: t.navbarChip || t.chipBg, borderColor: t.border }}
      aria-label={`${dateLabel}, ${timeLabel}`}
    >
      <Clock size={18} strokeWidth={2} style={{ color: t.textMuted }} aria-hidden="true" />
      <span className="text-sm font-bold tabular-nums" style={{ color: t.navbarChipText || t.textPrimary }}>
        {timeLabel}
      </span>
      <span className="h-4 w-px shrink-0" style={{ backgroundColor: t.border }} />
      <span className="text-sm font-semibold" style={{ color: t.textMuted }}>
        {dateLabel}
      </span>
    </div>
  );
};

export default NavbarMeta;