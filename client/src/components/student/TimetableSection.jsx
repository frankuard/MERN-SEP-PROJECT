import React, { useState, useEffect } from 'react';
import {
  Calendar, Timer, MapPin, User, BookOpen, School, History, CheckCircle2, ArrowRightLeft, Clock,
} from 'lucide-react';
import timetableApi from '../../api/timetableApi';
import { CLASSROOM_POOL, TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../../data/studentDashboardData';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const TYPE_BADGE = {
  lecture: { bg: '#dbeafe', text: '#1d4ed8' },
  tutorial: { bg: '#ede9fe', text: '#6d28d9' },
  workshop: { bg: '#fef3c7', text: '#b45309' },
};

const CHANGE_BADGE = {
  amber: { bg: '#fef3c7', text: '#b45309' },
  blue: { bg: '#dbeafe', text: '#1d4ed8' },
  purple: { bg: '#ede9fe', text: '#6d28d9' },
  red: { bg: '#fee2e2', text: '#dc2626' },
};

const SUB_TABS = [
  { id: 'schedule', label: 'Class Schedule', icon: Calendar },
  { id: 'vacant', label: 'Vacant Classrooms', icon: School },
  { id: 'changes', label: 'Temporary Changes', icon: History },
];

const TimetableSection = ({ t, classPermissions = {}, onTakePermission }) => {
  const [subTab, setSubTab] = useState('schedule');
  const [activeDay, setActiveDay] = useState(DAY_ORDER[new Date().getDay()]);

  const [routine, setRoutine] = useState(null); // null = not loaded yet, [] = loaded but empty
  const [changes, setChanges] = useState(null);

  // Load real timetable on mount. Falls back to static data on error or empty response.
  useEffect(() => {
    let mounted = true;
    timetableApi.getTimetable()
      .then((data) => { if (mounted) setRoutine(Array.isArray(data) && data.length > 0 ? data : TIMETABLE_ROUTINE); })
      .catch(() => { if (mounted) setRoutine(TIMETABLE_ROUTINE); });
    return () => { mounted = false; };
  }, []);

  // Load schedule changes only when that sub-tab is opened, same fallback pattern.
  useEffect(() => {
    if (subTab !== 'changes' || changes !== null) return;
    let mounted = true;
    timetableApi.getScheduleChanges()
      .then((data) => { if (mounted) setChanges(Array.isArray(data) && data.length > 0 ? data : INITIAL_RTE_SCHEDULE_CHANGES); })
      .catch(() => { if (mounted) setChanges(INITIAL_RTE_SCHEDULE_CHANGES); });
    return () => { mounted = false; };
  }, [subTab, changes]);

  const source = routine || TIMETABLE_ROUTINE;
  const activeDayData = source.find((d) => d.day === activeDay) || { day: activeDay, isOffDay: true, periods: [] };

  const getTypeBadge = (type) => TYPE_BADGE[type?.toLowerCase()] || { bg: t.chipBg, text: t.textMuted };

  return (
    <div className="space-y-6">
      {/* Header — plain, semester label, no date carousel */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.chipBg }}>
          <Clock size={19} style={{ color: t.textPrimary }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
            Semester 1 Timetable
          </h2>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>
            Class schedule, vacant rooms &amp; temporary changes
          </p>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors"
            style={{
              backgroundColor: subTab === id ? t.accentPrimary : 'transparent',
              color: subTab === id ? t.pageBg : t.textPrimary,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ===================== CLASS SCHEDULE ===================== */}
      {subTab === 'schedule' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors sm:text-sm"
                style={{
                  backgroundColor: activeDay === day ? t.accentPrimary : t.cardBg,
                  borderColor: activeDay === day ? t.accentPrimary : t.border,
                  color: activeDay === day ? t.pageBg : t.textPrimary,
                }}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>{activeDayData.day}</h3>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: activeDayData.isOffDay ? '#dcfce7' : t.chipBg,
                  color: activeDayData.isOffDay ? '#15803d' : t.textMuted,
                }}
              >
                {activeDayData.isOffDay ? 'Day Off' : `${activeDayData.periods.length} class${activeDayData.periods.length > 1 ? 'es' : ''}`}
              </span>
            </div>

            {activeDayData.isOffDay ? (
              <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: '#16a34a' }} />
                <p className="text-sm font-bold" style={{ color: t.textPrimary }}>No classes today</p>
                <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>Self-study &amp; project work</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeDayData.periods.map((period) => {
                  const badge = getTypeBadge(period.classType);
                  return (
                    <div key={period.id} className="rounded-xl border p-4" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold tabular-nums" style={{ color: t.textMuted }}>
                          <Timer size={13} /> {period.time}
                        </span>
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {period.classType}
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.chipBg }}>
                          <BookOpen size={14} style={{ color: t.textMuted }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                            {period.moduleCode}{period.group ? ` · ${period.group}` : ''}
                          </p>
                          <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>
                            {period.moduleName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                        <p className="flex items-center gap-1.5"><User size={12} /> {period.lecturer}</p>
                        <p className="flex items-center gap-1.5"><MapPin size={12} /> {period.room}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== VACANT CLASSROOMS (static, unchanged) ===================== */}
      {subTab === 'vacant' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLASSROOM_POOL.map((room) => {
            const status = classPermissions[room.id] || 'vacant';
            const statusBadge = {
              vacant: { bg: '#dcfce7', text: '#15803d', label: 'Vacant' },
              pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
              approved: { bg: '#dbeafe', text: '#1d4ed8', label: 'Approved' },
            }[status];

            return (
              <div key={room.id} className="flex flex-col justify-between rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold" style={{ color: t.textPrimary }}>{room.name}</p>
                      <p className="text-xs" style={{ color: t.textMuted }}>{room.block}</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                    <p>Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                    <p>Amenities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTakePermission?.(room.id)}
                  className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: status === 'vacant' ? t.accentPrimary : status === 'pending' ? '#f59e0b' : '#16a34a' }}
                >
                  {status === 'vacant' ? 'Take Permission' : status === 'pending' ? 'Permission Pending' : 'Approved (Release)'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== TEMPORARY CHANGES ===================== */}
      {subTab === 'changes' && (
        <div className="space-y-3">
          {changes === null && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading schedule changes...
            </div>
          )}

          {changes !== null && changes.length === 0 && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No temporary schedule changes right now.
            </div>
          )}

          {changes?.map((change) => {
            const badge = CHANGE_BADGE[change.badgeColor] || { bg: t.chipBg, text: t.textMuted };
            return (
              <div key={change.id || change._id} className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      {change.moduleCode}{change.group ? ` · ${change.group}` : ''}
                    </p>
                    <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>
                      {change.moduleName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                    {change.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: t.textMuted }}>
                  <span className="rounded-lg px-2.5 py-1" style={{ backgroundColor: t.pageBg }}>{change.originalSchedule}</span>
                  <ArrowRightLeft size={13} />
                  <span className="rounded-lg px-2.5 py-1 font-semibold" style={{ backgroundColor: t.pageBg, color: t.textPrimary }}>{change.newSchedule}</span>
                </div>

                {change.reason && (
                  <p className="mt-2 text-xs" style={{ color: t.textMuted }}>
                    Reason: <span style={{ color: t.textPrimary }}>{change.reason}</span>
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold" style={{ color: t.textMuted }}>
                  {change.effectiveDate && <span>Effective: {change.effectiveDate}</span>}
                  {change.publishedBy && <span>· {change.publishedBy}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimetableSection;