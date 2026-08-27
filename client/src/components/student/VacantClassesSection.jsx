import React, { useState, useEffect } from 'react';
import { School, Clock, CheckCircle2, Lock, Send, CalendarX } from 'lucide-react';
import vacantClassesApi from '../../api/vacantClassesApi';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CURRENT_STATUS_STYLE = {
  vacant: { bg: '#dcfce7', color: '#15803d', label: 'Vacant Now' },
  class: { bg: '#fee2e2', color: '#dc2626', label: 'In Class' },
  blocked: { bg: '#fef3c7', color: '#b45309', label: 'Blocked' },
  closed: { bg: '#e5e7eb', color: '#4b5563', label: 'Closed' },
};

const VacantClassesSection = ({ t, onNavigateTab }) => {
  const today = DAYS[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(today);
  const [rooms, setRooms] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [requestingId, setRequestingId] = useState(null);
  const [formRoomId, setFormRoomId] = useState(null);
  const [formData, setFormData] = useState({ startTime: '', endTime: '', reason: '' });

  const isClosed = selectedDay === 'Saturday';

  const loadRooms = (day) => {
    setRooms(null);
    vacantClassesApi.getVacantClassrooms(day)
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => { setRooms([]); toast.error('Failed to load classrooms'); });
  };

  const loadMyRequests = () => {
    vacantClassesApi.getMyRequests()
      .then((data) => setMyRequests(Array.isArray(data) ? data : []))
      .catch(() => setMyRequests([]));
  };

  useEffect(() => {
    if (isClosed) { setRooms([]); return; }
    loadRooms(selectedDay);
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const myRequestForRoom = (roomId) =>
    myRequests.find((r) => r.classroom === roomId && r.day === selectedDay && r.status === 'pending');

  const openRequestForm = (room) => {
    setFormRoomId(room._id);
    setFormData({ startTime: '', endTime: '', reason: '' });
  };

  const submitRequest = async (room) => {
    if (!formData.startTime.trim() || !formData.endTime.trim()) {
      toast.error('Start and end time are required');
      return;
    }
    setRequestingId(room._id);
    try {
      await vacantClassesApi.requestRoom({
        classroomId: room._id,
        day: selectedDay,
        startTime: formData.startTime.trim(),
        endTime: formData.endTime.trim(),
        reason: formData.reason.trim(),
      });
      toast.success('Request submitted');
      setFormRoomId(null);
      loadMyRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <School className="text-emerald-600" size={24} />
<h2 className="text-2xl font-bold" style={{ color: t.textPrimary }}>Vacant Classrooms TEST123</h2>        </div>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            className="rounded-xl border px-3.5 py-2 text-xs font-semibold"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className="rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: selectedDay === d ? t.accentPrimary : t.chipBg,
              color: selectedDay === d ? '#fff' : t.textMuted,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {isClosed && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border p-8 text-center text-sm font-semibold" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          <CalendarX size={22} />
          College is closed on Saturdays — no classrooms to show.
        </div>
      )}
      {!isClosed && rooms === null && (
        <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading classrooms...
        </div>
      )}
      {!isClosed && rooms !== null && rooms.length === 0 && (
        <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          No classrooms found.
        </div>
      )}

      {!isClosed && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rooms?.map((room) => {
            const freeWindows = room.freeWindows || [];
            const hasFreeTime = freeWindows.length > 0;
            const current = room.currentStatus; // null unless selectedDay === today
            const badge = current ? (CURRENT_STATUS_STYLE[current.state] || CURRENT_STATUS_STYLE.vacant) : null;
            const pending = myRequestForRoom(room._id);

            return (
              <div key={room._id} className="flex flex-col justify-between rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>{room.name}</h3>
                    {badge && (
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                    <p>Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                    {room.facilities && <p>Facilities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>}

                    {/* Right-now status, only shown when selectedDay is today */}
                    {current && current.state === 'vacant' && (
                      <p className="flex items-center gap-1.5 pt-1 font-semibold" style={{ color: '#15803d' }}>
                        <CheckCircle2 size={12} /> Free right now, until {current.until}
                      </p>
                    )}
                    {current && current.state === 'class' && (
                      <p className="flex items-center gap-1.5 pt-1 font-semibold" style={{ color: '#dc2626' }}>
                        <Lock size={12} />
                        {current.moduleCode ? `${current.moduleCode} · in class until ${current.until}` : `In class until ${current.until}`}
                      </p>
                    )}
                    {current && current.state === 'blocked' && (
                      <p className="flex items-center gap-1.5 pt-1 font-semibold" style={{ color: '#b45309' }}>
                        <Clock size={12} />
                        Blocked until {current.until}{current.reason ? ` (${current.reason})` : ''}
                      </p>
                    )}
                    {current && current.state === 'closed' && (
                      <p className="flex items-center gap-1.5 pt-1 font-semibold" style={{ color: '#4b5563' }}>
                        <CalendarX size={12} /> Outside campus hours
                      </p>
                    )}

                    {/* Free windows for the selected day */}
                    <div className="pt-2">
                      <p className="font-semibold" style={{ color: t.textPrimary }}>
                        {hasFreeTime ? 'Free windows today:' : 'No free windows'}
                      </p>
                      {hasFreeTime && (
                        <ul className="mt-1 space-y-0.5">
                          {freeWindows.map((w, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Clock size={11} />
                              {w.startTime} – {w.endTime}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {!hasFreeTime && (
                    <button type="button" disabled className="w-full rounded-xl py-2.5 text-xs font-bold text-white opacity-50" style={{ backgroundColor: t.textMuted }}>
                      Not Available
                    </button>
                  )}

                  {hasFreeTime && pending && (
                    <button type="button" disabled className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white opacity-80">
                      Request Pending
                    </button>
                  )}

                  {hasFreeTime && !pending && formRoomId !== room._id && (
                    <button
                      type="button"
                      onClick={() => openRequestForm(room)}
                      className="w-full rounded-xl py-2.5 text-xs font-bold text-white"
                      style={{ backgroundColor: t.accentPrimary }}
                    >
                      Request This Room
                    </button>
                  )}

                  {hasFreeTime && !pending && formRoomId === room._id && (
                    <div className="space-y-2">
                      <p className="text-[11px]" style={{ color: t.textMuted }}>
                        Pick a time within a free window listed above.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Start (e.g. 3:00 PM)"
                          value={formData.startTime}
                          onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                          className="rounded-lg border px-2 py-1.5 text-xs"
                          style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                        />
                        <input
                          type="text"
                          placeholder="End (e.g. 5:00 PM)"
                          value={formData.endTime}
                          onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                          className="rounded-lg border px-2 py-1.5 text-xs"
                          style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={formData.reason}
                        onChange={(e) => setFormData((f) => ({ ...f, reason: e.target.value }))}
                        className="w-full rounded-lg border px-2 py-1.5 text-xs"
                        style={{ borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={requestingId === room._id}
                          onClick={() => submitRequest(room)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white disabled:opacity-50"
                          style={{ backgroundColor: t.accentPrimary }}
                        >
                          <Send size={12} /> {requestingId === room._id ? 'Sending...' : 'Submit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormRoomId(null)}
                          className="rounded-xl border px-3 py-2 text-xs font-bold"
                          style={{ borderColor: t.border, color: t.textPrimary }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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

export default VacantClassesSection;