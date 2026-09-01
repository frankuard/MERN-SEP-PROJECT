import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import announcementApi from '../../../api/announcementApi';
import AnnouncementsModal from '../modals/AnnouncementsModal';

// Badge color still reflects priority, but the tile itself now shows the
// announcement's date — same visual language as UpcomingEvents' date tile.
const PRIORITY_STYLES = {
  Urgent: { color: '#ef4444', label: 'Urgent' },
  High: { color: '#f97316', label: 'High priority' },
  Medium: { color: '#3b82f6', label: 'Medium priority' },
  Low: { color: '#94a3b8', label: 'Low priority' },
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Tile shows month + day, matching UpcomingEvents' date tile exactly.
const formatTileDate = (isoString) => {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return { month: '—', day: '—' };
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  };
};

const ImportantAnnouncements = ({ t }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [status, setStatus] = useState('loading');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    announcementApi.getAnnouncements()
      .then((data) => {
        if (mounted) {
          setAnnouncements(Array.isArray(data) ? data : []);
          setStatus('success');
        }
      })
      .catch(() => { if (mounted) setStatus('error'); });
    return () => { mounted = false; };
  }, []);

  // Sort by timeline — most recent announcement first.
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [announcements]);

  return (
    <>
      <section className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
              <Megaphone size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Important Announcements</h2>
          </div>
          {sortedAnnouncements.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-extrabold text-white transition-transform hover:scale-105"
            >
              View all
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {status === 'loading' && (
          <div className="flex flex-1 flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-[20px]" style={{ backgroundColor: t.pageBg }} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed py-8 text-center" style={{ borderColor: t.border }}>
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Unable to load announcements.</p>
          </div>
        )}

        {status === 'success' && sortedAnnouncements.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed py-8 text-center" style={{ borderColor: t.border }}>
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>No announcements right now.</p>
          </div>
        )}

        {status === 'success' && sortedAnnouncements.length > 0 && (
          <ul className="flex flex-1 flex-col gap-3">
            {sortedAnnouncements.slice(0, 3).map((item) => {
              const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Medium;
              const { month, day } = formatTileDate(item.publishedAt);
              return (
                <li
                  key={item._id}
                  className="dashboard-card-lift flex items-center gap-4 rounded-[20px] bg-white p-4"
                  style={{ boxShadow: t.shadowSoft }}
                >
                  <div
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: style.color }}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">{month}</span>
                    <span className="text-xl font-extrabold tabular-nums leading-none">{day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                      {item.department}
                    </p>
                    <span
                      className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white"
                      style={{ backgroundColor: style.color }}
                    >
                      {style.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnnouncementsModal isOpen={showModal} onClose={() => setShowModal(false)} t={t} announcements={sortedAnnouncements} />
    </>
  );
};

export default ImportantAnnouncements;