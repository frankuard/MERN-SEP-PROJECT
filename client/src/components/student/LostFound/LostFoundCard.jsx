import { Calendar, MapPin, User, CheckCircle2, Lock } from 'lucide-react';

const ACCENT = '#2f4336';
const LOST_ACCENT = '#dc2626';
const FOUND_ACCENT = '#2563eb';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const LostFoundCard = ({ item, currentUserEmail, onClaim, claiming, t }) => {
  const accent = item.type === 'lost' ? LOST_ACCENT : FOUND_ACCENT;
  const isResolved = item.status === 'Claimed' || item.status === 'Returned' || item.status === 'resolved';
  const claimedByMe = item.claims?.some((c) => c.userEmail === currentUserEmail);

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl">
        {item.image ? (
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-1"
            style={{ backgroundColor: `${accent}0F` }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${accent}1A` }}
            >
              <MapPin size={20} style={{ color: accent }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: accent }}>{item.category}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: accent, color: '#ffffff' }}
        >
          {item.type === 'lost' ? 'Lost' : 'Found'}
        </span>
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: t.pageBg, color: t.textMuted }}
        >
          {item.category}
        </span>
      </div>

      <h4 className="mt-3 text-lg font-extrabold leading-snug sm:text-xl" style={{ color: t.textPrimary }}>
        {item.title}
      </h4>

      {item.description && (
        <div className="mt-3 space-y-1.5 text-sm" style={{ color: t.textMuted }}>
          {item.description}
        </div>
      )}

      <div className="mt-3 space-y-1.5 text-sm" style={{ color: t.textMuted }}>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0" />
          <span>{formatDate(item.createdAt)}</span>
        </div>
        {item.authorName && (
          <div className="flex items-center gap-2">
            <User size={14} className="shrink-0" />
            <span className="truncate">Reported by {item.authorName}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
        {isResolved ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold" style={{ color: ACCENT }}>
            <CheckCircle2 size={15} />
            {claimedByMe
              ? `Claimed by you${item.status === 'Returned' ? ' · Returned' : ''}`
              : item.status === 'Returned' ? 'Claimed & Returned' : `Claimed${item.claimantName ? ` by ${item.claimantName}` : ''}`}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onClaim(item._id)}
            disabled={claiming}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}
          >
            {claiming ? 'Submitting...' : 'Claim Item'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LostFoundCard;