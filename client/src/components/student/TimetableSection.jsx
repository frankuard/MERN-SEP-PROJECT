import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Timer, MapPin, User, BookOpen, School, CheckCircle2,
  Clock, X, Users, Lock, GraduationCap, CalendarX, FileText, Bell, Zap,
} from 'lucide-react';
import timetableApi from '../../api/timetableApi';
import classroomApi from '../../api/classroomApi';
import classroomRequestApi from '../../api/classroomRequestApi';
import { TIMETABLE_ROUTINE, UPCOMING_EXAMS } from '../../data/studentDashboardData';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const TYPE_BADGE = {
  lecture:  { bg: '#dbeafe', text: '#1d4ed8' },
  tutorial: { bg: '#ede9fe', text: '#6d28d9' },
  workshop: { bg: '#fef3c7', text: '#b45309' },
};

const CURRENT_STATUS_STYLE = {
  vacant:  { bg: '#dcfce7', text: '#15803d', label: 'Vacant Now',  icon: CheckCircle2 },
  class:   { bg: '#dbeafe', text: '#1d4ed8', label: 'In Class',    icon: GraduationCap },
  blocked: { bg: '#f3f4f6', text: '#4b5563', label: 'Reserved',    icon: Lock },
  closed:  { bg: '#f3f4f6', text: '#4b5563', label: 'Closed',      icon: CalendarX },
};

const EXAM_TYPE_BADGE = {
  midterm:   { bg: '#fef3c7', text: '#b45309' },
  final:     { bg: '#fee2e2', text: '#dc2626' },
  quiz:      { bg: '#ede9fe', text: '#6d28d9' },
  practical: { bg: '#dbeafe', text: '#1d4ed8' },
};

const SUB_TABS = [
  { id: 'schedule', label: 'Class Schedule',    icon: Calendar },
  { id: 'exams',    label: 'Upcoming Exams',    icon: FileText },
  { id: 'vacant',   label: 'Vacant Classrooms', icon: School   },
];

// ─── time helpers ─────────────────────────────────────────────────────────────

/** Parse "8:00 AM" → today's Date. Returns null on failure. */
function parseTimeToday(timeStr) {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  let [, h, m, meridiem] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Split "8:00 AM – 10:00 AM" → { start, end } as Dates for today. */
function parsePeriodTime(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split('–').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const start = parseTimeToday(parts[0]);
  const end   = parseTimeToday(parts[1]);
  if (!start || !end) return null;
  return { start, end };
}

/** e.g. 3661 → "1h 1m 1s" */
function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Coarser format for exam countdown: "3d 2h" / "2h 15m" / "45m" */
function formatExamCountdown(totalSeconds) {
  if (totalSeconds <= 0) return 'Now';
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── component ────────────────────────────────────────────────────────────────

const TimetableSection = ({ t }) => {
  const [subTab,    setSubTab]    = useState('schedule');
  const [activeDay, setActiveDay] = useState(DAY_ORDER[new Date().getDay()]);
  const [now,       setNow]       = useState(new Date());

  const [routine, setRoutine] = useState(null);
  const [exams,   setExams]   = useState(null);

  const [vacantDay,   setVacantDay]   = useState(DAY_ORDER[new Date().getDay()]);
  const [rooms,       setRooms]       = useState(null);
  const [myRequests,  setMyRequests]  = useState(null);
  const [requestForm, setRequestForm] = useState(null);
  const [formDay,     setFormDay]     = useState(DAY_ORDER[new Date().getDay()]);
  const [formStart,   setFormStart]   = useState('');
  const [formEnd,     setFormEnd]     = useState('');
  const [formReason,  setFormReason]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState('');

  const isVacantDayClosed = vacantDay === 'Saturday';

  // tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // load schedule
  useEffect(() => {
    let mounted = true;
    timetableApi.getTimetable()
      .then((data) => { if (mounted) setRoutine(Array.isArray(data) && data.length > 0 ? data : TIMETABLE_ROUTINE); })
      .catch(() => { if (mounted) setRoutine(TIMETABLE_ROUTINE); });
    return () => { mounted = false; };
  }, []);

  // load exams (lazy)
  useEffect(() => {
    if (subTab !== 'exams' || exams !== null) return;
    let mounted = true;
    timetableApi.getUpcomingExams()
      .then((data) => { if (mounted) setExams(Array.isArray(data) && data.length > 0 ? data : UPCOMING_EXAMS); })
      .catch(() => { if (mounted) setExams(UPCOMING_EXAMS); });
    return () => { mounted = false; };
  }, [subTab, exams]);

  // load vacant rooms
  const loadVacantData = useCallback((day) => {
    setRooms(null);
    classroomApi.getVacantClassrooms(day).then(setRooms).catch(() => setRooms([]));
    classroomRequestApi.getMyRequests().then(setMyRequests).catch(() => setMyRequests([]));
  }, []);

  useEffect(() => {
    if (subTab !== 'vacant') return;
    if (isVacantDayClosed) { setRooms([]); setMyRequests([]); return; }
    loadVacantData(vacantDay);
  }, [subTab, vacantDay, isVacantDayClosed, loadVacantData]);

  // derived
  const source        = routine || TIMETABLE_ROUTINE;
  const activeDayData = source.find((d) => d.day === activeDay) || { day: activeDay, isOffDay: true, periods: [] };
  const getTypeBadge  = (type) => TYPE_BADGE[type?.toLowerCase()]  || { bg: t.chipBg, text: t.textMuted };
  const getExamBadge  = (type) => EXAM_TYPE_BADGE[type?.toLowerCase()] || { bg: t.chipBg, text: t.textMuted };

  // today's upcoming / ongoing classes (does NOT change when user picks a different day tab)
  const todayName     = DAY_ORDER[now.getDay()];
  const todayData     = source.find((d) => d.day === todayName) || { isOffDay: true, periods: [] };
  const upcomingToday = (!todayData.isOffDay ? todayData.periods : [])
    .map((p) => { const parsed = parsePeriodTime(p.time); return parsed ? { ...p, _start: parsed.start, _end: parsed.end } : null; })
    .filter((p) => p && p._end > now)
    .sort((a, b) => a._start - b._start);

  // first future (not yet started) index
  const nextIdx = upcomingToday.findIndex((p) => p._start > now);

  // vacant helpers
  const latestRequestFor = (classroomId) => {
    if (!myRequests) return null;
    const forRoom = myRequests.filter((r) => (r.classroom?._id || r.classroom) === classroomId && r.day === vacantDay);
    if (!forRoom.length) return null;
    return forRoom.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const openRequestForm = (classroomId, roomName) => {
    setRequestForm({ classroomId, roomName });
    setFormDay(vacantDay); setFormStart(''); setFormEnd(''); setFormReason(''); setFormError('');
  };

  const submitRequest = async () => {
    if (!formStart.trim() || !formEnd.trim()) { setFormError('Start and end time are required.'); return; }
    setSubmitting(true); setFormError('');
    try {
      await classroomRequestApi.createRequest({
        classroomId: requestForm.classroomId,
        day: formDay, startTime: formStart.trim(), endTime: formEnd.trim(), reason: formReason.trim(),
      });
      setRequestForm(null);
      loadVacantData(vacantDay);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not submit request.');
    } finally { setSubmitting(false); }
  };

  const releaseRequest = async (requestId) => {
    try { await classroomRequestApi.cancelMyRequest(requestId); loadVacantData(vacantDay); } catch { /* silent */ }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Sub-tab switcher */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
            style={{
              backgroundColor: subTab === id ? t.accentPrimary : 'transparent',
              color: subTab === id ? t.pageBg : t.textPrimary,
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════ CLASS SCHEDULE ══════════════════════ */}
      {subTab === 'schedule' && (
        <div className="space-y-6">

          {/* ── Upcoming Classes (real-time, always today) ── */}
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#fef3c7' }}>
                <Zap size={18} style={{ color: '#b45309' }} />
              </div>
              <div>
                <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Upcoming Classes</h3>
                <p className="text-xs font-semibold" style={{ color: t.textMuted }}>{todayName} · live countdown</p>
              </div>
            </div>

            {upcomingToday.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: '#16a34a' }} />
                <p className="text-sm font-bold" style={{ color: t.textPrimary }}>No more classes today</p>
                <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>All done — enjoy the rest of your day!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingToday.map((period, idx) => {
                  const isOngoing = period._start <= now && period._end > now;
                  const isNext    = !isOngoing && idx === nextIdx;
                  const secsLeft  = isOngoing
                    ? Math.floor((period._end   - now) / 1000)
                    : Math.floor((period._start - now) / 1000);
                  const badge = getTypeBadge(period.classType);

                  return (
                    <div
                      key={period.id}
                      className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        backgroundColor: isOngoing ? '#f0fdf4' : t.pageBg,
                        borderColor: isOngoing ? '#86efac' : t.border,
                      }}
                    >
                      {/* module info */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: isOngoing ? '#dcfce7' : t.chipBg }}>
                          <BookOpen size={16} style={{ color: isOngoing ? '#15803d' : t.textMuted }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                            {period.moduleCode}{period.group ? ` · ${period.group}` : ''}
                          </p>
                          <p className="text-sm font-extrabold leading-tight" style={{ color: t.textPrimary }}>
                            {period.moduleName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: t.textMuted }}>
                            <span className="flex items-center gap-1"><Timer size={11} /> {period.time}</span>
                            <span className="flex items-center gap-1"><MapPin size={11} /> {period.room}</span>
                          </div>
                        </div>
                      </div>

                      {/* status + countdown */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {period.classType}
                        </span>
                        {isOngoing ? (
                          <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ backgroundColor: '#dcfce7' }}>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            <span className="text-xs font-extrabold tabular-nums" style={{ color: '#15803d' }}>
                              Ongoing · {formatCountdown(secsLeft)} left
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ backgroundColor: isNext ? '#eff6ff' : t.chipBg }}>
                            <Clock size={12} style={{ color: isNext ? '#3b82f6' : t.textMuted }} />
                            <span className="text-xs font-extrabold tabular-nums" style={{ color: isNext ? '#1d4ed8' : t.textMuted }}>
                              {isNext ? 'Next · ' : ''}{formatCountdown(secsLeft)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Day selector ── */}
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

          {/* ── Full schedule for selected day ── */}
          <div className="rounded-2xl border p-5 sm:p-7" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-extrabold" style={{ color: t.textPrimary }}>{activeDayData.day}</h3>
              <span
                className="rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{
                  backgroundColor: activeDayData.isOffDay ? '#dcfce7' : t.chipBg,
                  color: activeDayData.isOffDay ? '#15803d' : t.textMuted,
                }}
              >
                {activeDayData.isOffDay ? 'Day Off' : `${activeDayData.periods.length} class${activeDayData.periods.length > 1 ? 'es' : ''}`}
              </span>
            </div>

            {activeDayData.isOffDay ? (
              <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
                <CheckCircle2 size={22} className="mx-auto mb-2.5" style={{ color: '#16a34a' }} />
                <p className="text-sm font-bold" style={{ color: t.textPrimary }}>No classes today</p>
                <p className="mt-1 text-xs" style={{ color: t.textMuted }}>Self-study &amp; project work</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {activeDayData.periods.map((period) => {
                  const badge = getTypeBadge(period.classType);
                  return (
                    <div key={period.id} className="rounded-2xl border p-5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums" style={{ color: t.textMuted }}>
                          <Timer size={14} /> {period.time}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                          {period.classType}
                        </span>
                      </div>

                      <div className="mt-4 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.chipBg }}>
                          <BookOpen size={16} style={{ color: t.textMuted }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                            {period.moduleCode}{period.group ? ` · ${period.group}` : ''}
                          </p>
                          <p className="mt-0.5 text-base font-extrabold leading-tight" style={{ color: t.textPrimary }}>
                            {period.moduleName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                        <p className="flex items-center gap-2"><User size={14} /> {period.lecturer}</p>
                        <p className="flex items-center gap-2"><MapPin size={14} /> {period.room}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════ UPCOMING EXAMS ══════════════════════ */}
      {subTab === 'exams' && (
        <div className="space-y-4">
          {exams === null && (
            <div className="rounded-2xl border px-4 py-10 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading upcoming exams...
            </div>
          )}

          {exams !== null && exams.length === 0 && (
            <div className="rounded-2xl border px-4 py-12 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <FileText size={28} className="mx-auto mb-3" style={{ color: t.textMuted }} />
              <p className="text-base font-bold" style={{ color: t.textPrimary }}>No upcoming exams</p>
              <p className="mt-1 text-sm" style={{ color: t.textMuted }}>Check back closer to the exam period.</p>
            </div>
          )}

          {exams !== null && exams.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {exams.map((exam) => {
                const badge = getExamBadge(exam.examType);

                // countdown to exam
                let secsToExam = null;
                if (exam.date && exam.startTime) {
                  const cleanDate = exam.date.replace(/\(.*?\)/, '').trim();
                  const examDt    = new Date(`${cleanDate} ${exam.startTime}`);
                  if (!isNaN(examDt)) secsToExam = Math.floor((examDt - now) / 1000);
                }

                return (
                  <div key={exam._id} className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                    {/* header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: badge.bg }}>
                          <FileText size={18} style={{ color: badge.text }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                            {exam.moduleCode}{exam.group ? ` · ${exam.group}` : ''}
                          </p>
                          <p className="mt-0.5 text-base font-extrabold leading-tight" style={{ color: t.textPrimary }}>
                            {exam.moduleName}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>
                        {exam.examType}
                      </span>
                    </div>

                    {/* countdown banner */}
                    {secsToExam !== null && (
                      <div
                        className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ backgroundColor: secsToExam <= 0 ? '#dcfce7' : '#eff6ff' }}
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={14} style={{ color: secsToExam <= 0 ? '#15803d' : '#3b82f6' }} />
                          <span className="text-xs font-bold" style={{ color: secsToExam <= 0 ? '#15803d' : '#1d4ed8' }}>
                            {secsToExam <= 0 ? 'Exam today / in progress' : 'Starts in'}
                          </span>
                        </div>
                        {secsToExam > 0 && (
                          <span className="text-sm font-extrabold tabular-nums" style={{ color: '#1d4ed8' }}>
                            {formatExamCountdown(secsToExam)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* details */}
                    <div className="mt-4 space-y-2.5 border-t pt-4 text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                      {exam.date && (
                        <p className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span className="font-semibold" style={{ color: t.textPrimary }}>{exam.date}</span>
                        </p>
                      )}
                      {exam.startTime && exam.endTime && (
                        <p className="flex items-center gap-2"><Timer size={14} />{exam.startTime} – {exam.endTime}</p>
                      )}
                      {exam.room && (
                        <p className="flex items-center gap-2"><MapPin size={14} /> {exam.room}</p>
                      )}
                      {exam.notes && (
                        <p className="mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed italic" style={{ backgroundColor: t.pageBg }}>
                          {exam.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ VACANT CLASSROOMS ══════════════════════ */}
      {subTab === 'vacant' && (
        <div className="space-y-5">
          {/* day tabs */}
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setVacantDay(day)}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors sm:text-sm"
                style={{
                  backgroundColor: vacantDay === day ? t.accentPrimary : t.cardBg,
                  borderColor: vacantDay === day ? t.accentPrimary : t.border,
                  color: vacantDay === day ? t.pageBg : t.textPrimary,
                }}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>

          {isVacantDayClosed && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border px-4 py-10 text-center text-sm font-semibold" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              <CalendarX size={22} />
              College is closed on Saturdays — no classrooms to show.
            </div>
          )}

          {!isVacantDayClosed && rooms === null && (
            <div className="rounded-2xl border px-4 py-10 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Checking room availability for {vacantDay}...
            </div>
          )}

          {!isVacantDayClosed && rooms !== null && rooms.length === 0 && (
            <div className="rounded-2xl border px-4 py-10 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No classrooms have been added yet.
            </div>
          )}

          {!isVacantDayClosed && rooms !== null && rooms.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const freeWindows  = room.freeWindows || [];
                const hasFreeTime  = freeWindows.length > 0;
                const current      = room.currentStatus;
                const currentBadge = current ? (CURRENT_STATUS_STYLE[current.state] || CURRENT_STATUS_STYLE.vacant) : null;
                const CurrentIcon  = currentBadge?.icon;
                const myReq        = latestRequestFor(room._id);
                const reqStatus    = myReq?.status || null;

                return (
                  <div key={room._id} className="flex flex-col justify-between rounded-2xl border p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-lg font-extrabold" style={{ color: t.textPrimary }}>{room.name}</p>
                        {currentBadge && (
                          <span className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: currentBadge.bg, color: currentBadge.text }}>
                            {CurrentIcon && <CurrentIcon size={13} />} {currentBadge.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                        <p className="flex items-center gap-2"><Users size={14} /> Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                        {room.facilities && <p>Amenities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>}

                        {current && current.state === 'vacant' && (
                          <p className="font-semibold" style={{ color: '#15803d' }}>Free right now, until {current.until}</p>
                        )}
                        {current && current.state === 'class' && (
                          <p className="font-semibold" style={{ color: '#1d4ed8' }}>
                            {current.moduleCode ? `${current.moduleCode} · in class until ${current.until}` : `In class until ${current.until}`}
                          </p>
                        )}
                        {current && current.state === 'blocked' && (
                          <p className="font-semibold" style={{ color: '#4b5563' }}>
                            Reserved until {current.until}{current.reason ? ` (${current.reason})` : ''}
                          </p>
                        )}

                        <div className="pt-1.5">
                          <p className="font-bold" style={{ color: t.textPrimary }}>
                            {hasFreeTime ? 'Free windows:' : 'No free windows'}
                          </p>
                          {hasFreeTime && (
                            <ul className="mt-1.5 space-y-1">
                              {freeWindows.map((w, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <Clock size={12} /> {w.startTime} – {w.endTime}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {myReq && (reqStatus === 'pending' || reqStatus === 'approved') && (
                          <p className="pt-1">Requested: <span className="font-semibold" style={{ color: t.textPrimary }}>{myReq.day}, {myReq.startTime}–{myReq.endTime}</span></p>
                        )}
                      </div>
                    </div>

                    {!hasFreeTime && (
                      <button type="button" disabled className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white opacity-60" style={{ backgroundColor: t.textMuted }}>
                        Not Available
                      </button>
                    )}

                    {hasFreeTime && (
                      <button
                        type="button"
                        disabled={reqStatus === 'pending'}
                        onClick={() => {
                          if (!reqStatus || reqStatus === 'rejected') openRequestForm(room._id, room.name);
                          if (reqStatus === 'approved') releaseRequest(myReq._id);
                        }}
                        className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                        style={{ backgroundColor: reqStatus === 'approved' ? '#16a34a' : reqStatus === 'pending' ? '#f59e0b' : t.accentPrimary }}
                      >
                        {!reqStatus && 'Take Permission'}
                        {reqStatus === 'pending' && 'Permission Pending'}
                        {reqStatus === 'approved' && 'Approved (Release)'}
                        {reqStatus === 'rejected' && 'Request Again'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Request modal */}
          {requestForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>Request {requestForm.roomName}</h4>
                  <button type="button" onClick={() => setRequestForm(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Day</label>
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                    >
                      {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>Start time</label>
                      <input
                        value={formStart}
                        onChange={(e) => setFormStart(e.target.value)}
                        placeholder="8:00 AM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>End time</label>
                      <input
                        value={formEnd}
                        onChange={(e) => setFormEnd(e.target.value)}
                        placeholder="10:00 AM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Reason (optional)</label>
                    <textarea
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                    />
                  </div>

                  {formError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{formError}</p>}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={submitRequest}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableSection;
