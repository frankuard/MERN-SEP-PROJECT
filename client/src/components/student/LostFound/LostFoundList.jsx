import { CalendarOff, AlertCircle, RefreshCw } from 'lucide-react';
import LostFoundCard from './LostFoundCard';

const LoadingGrid = ({ t }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse rounded-2xl border p-4" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
        <div className="aspect-[4/3] w-full rounded-xl" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-4 h-4 w-2/3 rounded" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-2 h-3 w-full rounded" style={{ backgroundColor: t.pageBg }} />
      </div>
    ))}
  </div>
);

const ErrorState = ({ onRetry, t }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
      <AlertCircle size={20} style={{ color: t.textMuted }} />
    </div>
    <div>
      <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load items</p>
      <p className="text-sm" style={{ color: t.textMuted }}>Please try again.</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="mt-1 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
      style={{ backgroundColor: '#2f4336' }}
    >
      <RefreshCw size={14} />
      Retry
    </button>
  </div>
);

const EmptyState = ({ onReport, t }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
      <CalendarOff size={20} style={{ color: t.textMuted }} />
    </div>
    <div>
      <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>No Lost &amp; Found items yet</p>
      <p className="text-sm" style={{ color: t.textMuted }}>Be the first to report a lost or found item.</p>
    </div>
    <button
      type="button"
      onClick={onReport}
      className="mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
      style={{ backgroundColor: '#2f4336' }}
    >
      Report an Item
    </button>
  </div>
);

const LostFoundList = ({ status, items, currentUserEmail, claimingId, onClaim, onRetry, onReport, t }) => {
  if (status === 'loading') return <LoadingGrid t={t} />;
  if (status === 'error') return <ErrorState onRetry={onRetry} t={t} />;
  if (items.length === 0) return <EmptyState onReport={onReport} t={t} />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <LostFoundCard
          key={item._id}
          item={item}
          currentUserEmail={currentUserEmail}
          claiming={claimingId === item._id}
          onClaim={onClaim}
          t={t}
        />
      ))}
    </div>
  );
};

export default LostFoundList;