import { useState, useEffect } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import announcementApi from '../../../api/announcementApi';
import AnnouncementsModal from '../modals/AnnouncementsModal';

const ITEM_TINTS = ['#e8f4fd', '#fce7f3', '#fef9c3'];

const PRIORITY_STYLES = {
  Low: { badge: '#94a3b8', label: 'Low priority' },
  Medium: { badge: '#3b82f6', label: 'Medium priority' },
  High: { badge: '#f59e0b', label: 'High priority' },
  Urgent: { badge: '#ef4444', label: 'Urgent' },
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          {announcements.length > 0 && (
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

        {status === 'success' && announcements.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-[20px] border border-dashed py-8 text-center" style={{ borderColor: t.border }}>
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>No announcements right now.</p>
          </div>
        )}

        {status === 'success' && announcements.length > 0 && (
          <ul className="flex flex-1 flex-col gap-3">
            {announcements.slice(0, 3).map((item, i) => {
              const priorityStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Medium;
              const isUrgent = item.priority === 'Urgent' || item.priority === 'High';
              return (
                <li
                  key={item._id}
                  className="dashboard-card-lift rounded-[20px] p-4"
                  style={{
                    backgroundColor: ITEM_TINTS[i % ITEM_TINTS.length],
                    border: isUrgent ? `2px solid ${priorityStyle.badge}` : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                      style={{ backgroundColor: priorityStyle.badge }}
                    >
                      {isUrgent ? '!' : 'i'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${isUrgent ? 'font-extrabold' : 'font-bold'}`} style={{ color: t.textPrimary }}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                        {item.department} · {formatDate(item.publishedAt)}
                      </p>
                      {isUrgent && (
                        <span
                          className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white"
                          style={{ backgroundColor: priorityStyle.badge }}
                        >
                          {priorityStyle.label}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnnouncementsModal isOpen={showModal} onClose={() => setShowModal(false)} t={t} announcements={announcements} />
    </>
  );
};

export default ImportantAnnouncements;