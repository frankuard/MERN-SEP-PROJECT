import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import DashboardMascot from '../student/Dashboard/DashboardMascot';
import timetableApi from '../../api/timetableApi';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Find the very next class across the whole week from now
const findNextClass = (classes) => {
  if (!classes || classes.length === 0) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Parse "8:00 AM" → minutes since midnight
  const toMins = (timeStr) => {
    if (!timeStr) return 0;
    const m = timeStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (m[3] === 'PM' && h !== 12) h += 12;
    if (m[3] === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  // Sort by proximity: today's remaining first, then the rest of the week
  const sorted = [...classes].sort((a, b) => {
    const ai = (DAY_ORDER.indexOf(a.day) - todayIdx + 7) % 7;
    const bi = (DAY_ORDER.indexOf(b.day) - todayIdx + 7) % 7;
    if (ai !== bi) return ai - bi;
    return toMins(a.startTime) - toMins(b.startTime);
  });

  // Skip today's classes that have already ended
  for (const cls of sorted) {
    const dayOffset = (DAY_ORDER.indexOf(cls.day) - todayIdx + 7) % 7;
    if (dayOffset === 0 && toMins(cls.endTime) <= nowMins) continue;
    return cls;
  }
  return sorted[0] || null;
};

const TeacherGreetingHeader = ({ t, greeting, teacherName, onNavigateTab }) => {
  const [classes,   setClasses]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let mounted = true;
    timetableApi.getTeacherUpcomingClasses()
      .then((data) => { if (mounted) setClasses(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const next = findNextClass(classes);
  const isToday = next && next.day === DAY_ORDER[new Date().getDay()];

  return (
    <section
      className="dashboard-hero relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-8"
      style={{ backgroundColor: t.heroBg || t.pastelBlue, boxShadow: t.shadowCard }}
    >
      {/* Decorative blobs — identical to student */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-pink-300/40" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-20 w-20 rounded-full bg-purple-300/30" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-14 w-14 rounded-full bg-yellow-300/40" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left — mascot + greeting text */}
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <div className="hidden shrink-0 sm:block">
            <DashboardMascot className="h-28 w-auto sm:h-32" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
              {greeting}, {teacherName}!
            </h1>
            <p className="mt-2 text-sm font-semibold sm:text-base" style={{ color: t.textSecondary }}>
              Here&apos;s your class schedule for today.
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
              Biratnagar International College
            </p>
          </div>
        </div>

        {/* Right — upcoming class card (replaces attendance card) */}
        <div
          className="dashboard-card-lift shrink-0 rounded-[24px] bg-white p-5 sm:min-w-[220px]"
          style={{ boxShadow: t.shadowSoft }}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: t.textMuted }}>
            Next Class
          </p>

          {loading && (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded" style={{ backgroundColor: '#e8e8e8' }} />
              <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: '#e8e8e8' }} />
            </div>
          )}

          {!loading && !next && (
            <div className="mt-3 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">No classes found</p>
            </div>
          )}

          {!loading && next && (
            <div className="mt-2">
              <p className="text-base font-extrabold leading-tight text-black line-clamp-2">
                {next.moduleName}
              </p>
              <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                {next.moduleCode}
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                <p className="font-semibold" style={{ color: isToday ? '#16a34a' : '#374151' }}>
                  {isToday ? 'Today' : next.day} · {next.startTime}–{next.endTime}
                </p>
                {next.room && <p>{next.room}</p>}
                {next.group && <p>{next.group}</p>}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('rte')}
            className="dashboard-btn-bounce mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-xs font-extrabold text-white"
          >
            All classes
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeacherGreetingHeader;
