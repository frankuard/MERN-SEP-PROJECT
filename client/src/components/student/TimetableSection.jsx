import React, { useState, useEffect } from 'react';
import {
  Calendar, Timer, MapPin, User, BookOpen, School, History, CheckCircle2,
  ArrowRightLeft, Clock, X, Users, Lock, GraduationCap, CalendarX,
} from 'lucide-react';
import timetableApi from '../../api/timetableApi';
import classroomApi from '../../api/classroomApi';
import classroomRequestApi from '../../api/classroomRequestApi';
import { TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../../data/studentDashboardData';

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

const CURRENT_STATUS_STYLE = {
  vacant: { bg: '#dcfce7', text: '#15803d', label: 'Vacant Now', icon: CheckCircle2 },
  class: { bg: '#dbeafe', text: '#1d4ed8', label: 'In Class', icon: GraduationCap },
  blocked: { bg: '#f3f4f6', text: '#4b5563', label: 'Reserved', icon: Lock },
  closed: { bg: '#f3f4f6', text: '#4b5563', label: 'Closed', icon: CalendarX },
};

const SUB_TABS = [
  { id: 'schedule', label: 'Class Schedule', icon: Calendar },
  { id: 'vacant', label: 'Vacant Classrooms', icon: School },
  { id: 'changes', label: 'Temporary Changes', icon: History },
];

const TimetableSection = ({ t }) => {
  const [subTab, setSubTab] = useState('schedule');
  const [activeDay, setActiveDay] = useState(DAY_ORDER[new Date().getDay()]);

  const [routine, setRoutine] = useState(null); // null = not loaded yet
  const [changes, setChanges] = useState(null);

  // -------- Vacant classrooms (per-day, backend-computed) --------
  const [vacantDay, setVacantDay] = useState(DAY_ORDER[new Date().getDay()]);
  const [rooms, setRooms] = useState(null); // array from getVacantClassrooms(day) — each room has freeWindows + currentStatus
  const [myRequests, setMyRequests] = useState(null);
  const [requestForm, setRequestForm] = useState(null); // { classroomId, roomName } or null
  const [formDay, setFormDay] = useState(DAY_ORDER[new Date().getDay()]);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isVacantDayClosed = vacantDay === 'Saturday';

  // -------- Load class schedule --------
  useEffect(() => {
    let mounted = true;
    timetableApi.getTimetable()
      .then((data) => { if (mounted) setRoutine(Array.isArray(data) && data.length > 0 ? data : TIMETABLE_ROUTINE); })
      .catch(() => { if (mounted) setRoutine(TIMETABLE_ROUTINE); });
    return () => { mounted = false; };
  }, []);

  // -------- Load schedule changes (only when tab opened) --------
  useEffect(() => {
    if (subTab !== 'changes' || changes !== null) return;
    let mounted = true;
    timetableApi.getScheduleChanges()
      .then((data) => { if (mounted) setChanges(Array.isArray(data) && data.length > 0 ? data : INITIAL_RTE_SCHEDULE_CHANGES); })
      .catch(() => { if (mounted) setChanges(INITIAL_RTE_SCHEDULE_CHANGES); });
    return () => { mounted = false; };
  }, [subTab, changes]);

  // -------- Load vacant rooms for the selected day + my requests --------
  const loadVacantData = (day) => {
    setRooms(null);
    classroomApi.getVacantClassrooms(day).then(setRooms).catch(() => setRooms([]));
    classroomRequestApi.getMyRequests().then(setMyRequests).catch(() => setMyRequests([]));
  };

  useEffect(() => {
    if (subTab !== 'vacant') return;
    if (isVacantDayClosed) { setRooms([]); setMyRequests([]); return; }
    loadVacantData(vacantDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, vacantDay]);

  const source = routine || TIMETABLE_ROUTINE;
  const activeDayData = source.find((d) => d.day === activeDay) || { day: activeDay, isOffDay: true, periods: [] };
  const getTypeBadge = (type) => TYPE_BADGE[type?.toLowerCase()] || { bg: t.chipBg, text: t.textMuted };

  // Latest (most recent) request this student has for a given classroom + day.
  const latestRequestFor = (classroomId) => {
    if (!myRequests) return null;
    const forRoom = myRequests.filter(
      (r) => (r.classroom?._id || r.classroom) === classroomId && r.day === vacantDay
    );
    if (forRoom.length === 0) return null;
    return forRoom.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const openRequestForm = (classroomId, roomName) => {
    setRequestForm({ classroomId, roomName });
    setFormDay(vacantDay);
    setFormStart('');
    setFormEnd('');
    setFormReason('');
    setFormError('');
  };

  const submitRequest = async () => {
    if (!formStart.trim() || !formEnd.trim()) {
      setFormError('Start and end time are required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await classroomRequestApi.createRequest({
        classroomId: requestForm.classroomId,
        day: formDay,
        startTime: formStart.trim(),
        endTime: formEnd.trim(),
        reason: formReason.trim(),
      });
      setRequestForm(null);
      loadVacantData(vacantDay);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Could not submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const releaseRequest = async (requestId) => {
    try {
      await classroomRequestApi.cancelMyRequest(requestId);
      loadVacantData(vacantDay);
    } catch {
      // silently ignore — list will just reflect prior state until retried
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.chipBg }}>
          <Clock size={19} style={{ color: t.textPrimary }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
            Semester 2 Timetable
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
                          <Timer size={13} /> {period.startTime} – {period.endTime}
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

      {/* ===================== VACANT CLASSROOMS ===================== */}
      {subTab === 'vacant' && (
        <div className="space-y-4">
          {/* Day tabs — same pattern as Class Schedule */}
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
            <div className="flex flex-col items-center gap-2 rounded-2xl border px-4 py-8 text-center text-sm font-semibold" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              <CalendarX size={20} />
              College is closed on Saturdays — no classrooms to show.
            </div>
          )}

          {!isVacantDayClosed && rooms === null && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Checking room availability for {vacantDay}...
            </div>
          )}

          {!isVacantDayClosed && rooms !== null && rooms.length === 0 && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No classrooms have been added yet.
            </div>
          )}

          {!isVacantDayClosed && rooms !== null && rooms.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                // New backend shape: room.freeWindows = [{startTime, endTime}, ...]
                // room.currentStatus = null unless vacantDay is today, else {state, until, moduleCode?, moduleName?, reason?}
                const freeWindows = room.freeWindows || [];
                const hasFreeTime = freeWindows.length > 0;
                const current = room.currentStatus;
                const currentBadge = current ? (CURRENT_STATUS_STYLE[current.state] || CURRENT_STATUS_STYLE.vacant) : null;
                const CurrentIcon = currentBadge?.icon;

                // Personal request status layered on top, same as before
                const myReq = latestRequestFor(room._id);
                const reqStatus = myReq?.status || null; // pending | approved | rejected | null

                return (
                  <div key={room._id} className="flex flex-col justify-between rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-base font-bold" style={{ color: t.textPrimary }}>{room.name}</p>
                        {currentBadge && (
                          <span className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: currentBadge.bg, color: currentBadge.text }}>
                            {CurrentIcon && <CurrentIcon size={12} />} {currentBadge.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                        <p className="flex items-center gap-1.5"><Users size={12} /> Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                        {room.facilities && <p>Amenities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>}

                        {/* Right-now line, only when vacantDay is today */}
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

                        {/* Free windows for the selected day */}
                        <div className="pt-1.5">
                          <p className="font-bold" style={{ color: t.textPrimary }}>
                            {hasFreeTime ? 'Free windows:' : 'No free windows'}
                          </p>
                          {hasFreeTime && (
                            <ul className="mt-1 space-y-0.5">
                              {freeWindows.map((w, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <Clock size={11} /> {w.startTime} – {w.endTime}
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
                      <button type="button" disabled className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-white opacity-60" style={{ backgroundColor: t.textMuted }}>
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
                        className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
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
            const originalStr = `${change.originalDay}, ${change.originalStartTime}–${change.originalEndTime} · ${change.originalRoom}`;
            const newParts = [];
            if (change.newDay) newParts.push(change.newDay);
            if (change.newStartTime && change.newEndTime) newParts.push(`${change.newStartTime}–${change.newEndTime}`);
            if (change.newRoom) newParts.push(change.newRoom);
            const newStr = newParts.length > 0 ? newParts.join(' · ') : 'Cancelled';

            return (
              <div key={change._id} className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
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
                  <span className="rounded-lg px-2.5 py-1" style={{ backgroundColor: t.pageBg }}>{originalStr}</span>
                  <ArrowRightLeft size={13} />
                  <span className="rounded-lg px-2.5 py-1 font-semibold" style={{ backgroundColor: t.pageBg, color: t.textPrimary }}>{newStr}</span>
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