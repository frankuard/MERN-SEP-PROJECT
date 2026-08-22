import { useState, useMemo } from 'react';
import { X, Megaphone } from 'lucide-react';

const PRIORITY_STYLES = {
  Low: { badge: '#94a3b8', label: 'Low' },
  Medium: { badge: '#3b82f6', label: 'Medium' },
  High: { badge: '#f59e0b', label: 'High' },
  Urgent: { badge: '#ef4444', label: 'Urgent' },
};

const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'];

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AnnouncementsModal = ({ isOpen, onClose, t, announcements }) => {
  const [priorityFilter, setPriorityFilter] = useState('All');

  const departments = useMemo(() => {
    const unique = [...new Set(announcements.map((a) => a.department).filter(Boolean))];
    return unique;
  }, [announcements]);
  const [departmentFilter, setDepartmentFilter] = useState('All');

  if (!isOpen) return null;

  const filtered = announcements.filter((a) => {
    const matchesPriority = priorityFilter === 'All' || a.priority === priorityFilter;
    const matchesDept = departmentFilter === 'All' || a.department === departmentFilter;
    return matchesPriority && matchesDept;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        className="flex w-full max-w-lg max-h-[85vh] flex-col rounded-[28px] border shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white">
              <Megaphone size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>All Announcements</h3>
              <p className="text-xs font-semibold" style={{ color: t.textMuted }}>Campus updates and deadlines</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b px-5 py-3" style={{ borderColor: t.border }}>
          {['All', ...PRIORITY_ORDER].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: priorityFilter === p ? t.accentPrimary : t.pageBg,
                color: priorityFilter === p ? t.pageBg : t.textPrimary,
              }}
            >
              {p}
            </button>
          ))}
          {departments.length > 1 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="ml-auto rounded-full border px-3 py-1.5 text-xs font-bold outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="All">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold" style={{ color: t.textMuted }}>
              No announcements match this filter.
            </p>
          ) : (
            filtered.map((a) => {
              const style = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.Medium;
              return (
                <div
                  key={a._id}
                  className="space-y-2 rounded-2xl border p-4"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white"
                      style={{ backgroundColor: style.badge }}
                    >
                      {style.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
                      {formatDate(a.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>{a.title}</h4>
                  <p className="text-xs font-semibold" style={{ color: t.textMuted }}>{a.department}</p>
                  {a.message && (
                    <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>{a.message}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end border-t p-4" style={{ borderColor: t.border }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: t.accentPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsModal;