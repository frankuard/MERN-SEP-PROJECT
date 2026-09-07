import { useState, useEffect, useCallback } from 'react';
import { Calendar, Timer, MapPin, BookOpen, Users, RefreshCw } from 'lucide-react';
import timetableApi from '../../api/timetableApi';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TYPE_BADGE = {
  lecture:  { bg: '#dbeafe', text: '#1d4ed8' },
  tutorial: { bg: '#ede9fe', text: '#6d28d9' },
  workshop: { bg: '#fef3c7', text: '#b45309' },
};

const getBadge = (type) =>
  TYPE_BADGE[type?.toLowerCase()] || { bg: '#f3f4f6', text: '#4b5563' };

// ── Today's week-day name ──────────────────────────────────────────────────
const todayName = () => DAY_ORDER[new Date().getDay()];

// ── Sort periods by proximity to today → Sun first from current weekday ────
const sortByProximity = (periods) => {
  const todayIdx = new Date().getDay(); // 0=Sun
  return [...periods].sort((a, b) => {
    const ai = (DAY_ORDER.indexOf(a.day) - todayIdx + 7) % 7;
    const bi = (DAY_ORDER.indexOf(b.day) - todayIdx + 7) % 7;
    if (ai !== bi) return ai - bi;
    return a.startTime.localeCompare(b.startTime);
  });
};

const TeacherUpcomingClasses = ({ t }) => {
  const [classes, setClasses] = useState(null); // null = loading
  const [error,   setError]   = useState(false);

  const load = useCallback(() => {
    setClasses(null);
    setError(false);
    timetableApi.getTeacherUpcomingClasses()
      .then((data) => setClasses(Array.isArray(data) ? sortByProximity(data) : []))
      .catch(() => { setError(true); setClasses([]); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = todayName();

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.chipBg }}>
            <Calendar size={19} style={{ color: t.textPrimary }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Upcoming Classes
            </h2>
            <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
              Your weekly class schedule
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors hover:opacity-80"
          style={{ borderColor: t.border, color: t.textMuted }}
          aria-label="Refresh"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Loading */}
      {classes === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border p-5"
              style={{ backgroundColor: t.cardBg, borderColor: t.border }}
            >
              <div className="h-3 w-1/3 rounded" style={{ backgroundColor: t.pageBg }} />
              <div className="mt-3 h-4 w-2/3 rounded" style={{ backgroundColor: t.pageBg }} />
              <div className="mt-2 h-3 w-full rounded" style={{ backgroundColor: t.pageBg }} />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-2xl border px-4 py-8 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Could not load your classes. Click Refresh to try again.
        </div>
      )}

      {/* Empty */}
      {!error && classes !== null && classes.length === 0 && (
        <div
          className="rounded-2xl border border-dashed px-4 py-12 text-center"
          style={{ borderColor: t.border }}
        >
          <Calendar size={26} className="mx-auto mb-3" style={{ color: t.textMuted }} />
          <p className="text-sm font-bold" style={{ color: t.textPrimary }}>No classes found</p>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
            Classes assigned to you in the timetable will appear here.
          </p>
        </div>
      )}

      {/* Class cards */}
      {!error && classes !== null && classes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const badge    = getBadge(cls.classType);
            const isToday  = cls.day === today;

            return (
              <div
                key={cls.id}
                className="rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: isToday ? t.pageBg : t.cardBg,
                  borderColor: isToday ? t.accentPrimary : t.border,
                  boxShadow: isToday ? `0 0 0 2px ${t.accentPrimary}22` : undefined,
                }}
              >
                {/* Day + today badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                    {cls.day}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isToday && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                        style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}
                      >
                        Today
                      </span>
                    )}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {cls.classType}
                    </span>
                  </div>
                </div>

                {/* Module */}
                <div className="mt-3 flex items-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: t.chipBg }}
                  >
                    <BookOpen size={15} style={{ color: t.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      {cls.moduleCode}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold leading-tight" style={{ color: t.textPrimary }}>
                      {cls.moduleName}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                  <p className="flex items-center gap-1.5">
                    <Timer size={12} />
                    {cls.startTime} – {cls.endTime}
                  </p>
                  {cls.room && (
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} /> {cls.room}
                    </p>
                  )}
                  {cls.group && (
                    <p className="flex items-center gap-1.5">
                      <Users size={12} /> {cls.group}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherUpcomingClasses;
