import React, { useState, useEffect } from 'react';
import {
  Calendar, FileText, HeartHandshake, CalendarCheck2, Clock,
  CheckCircle2, MapPin, ShieldCheck, Building2, Users,
} from 'lucide-react';
import RequestAttendanceReportModal from '../../components/student/modals/RequestAttendanceReportModal';
import attendanceApi from '../../api/attendanceApi';
import volunteerApi from '../../api/volunteerApi';
import volunteerOpportunityApi from '../../api/volunteerOpportunityApi';
import eventsApi from '../../api/eventsApi';

const SUB_TABS = [
  { id: 'attendance', label: 'Attendance Records', icon: CheckCircle2 },
  { id: 'volunteering', label: 'Volunteering', icon: HeartHandshake },
  { id: 'events', label: 'Upcoming Events', icon: CalendarCheck2 },
];

const COLLEGE_ACCENT = '#2563eb';
const COMMUNITY_ACCENT = '#9333ea';
const accentFor = (type) => (type === 'college' ? COLLEGE_ACCENT : COMMUNITY_ACCENT);
const iconFor = (type) => (type === 'college' ? Building2 : Users);

// Same banner format as EventsSection.jsx — real image when available,
// otherwise a themed decorative fallback instead of leaving blank space.
const EventBanner = ({ event }) => {
  const accent = accentFor(event.type);
  const Icon = iconFor(event.type);

  if (event.eventImage) {
    return (
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl">
        <img
          src={event.eventImage}
          alt={event.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex aspect-4/5 w-full flex-col items-center justify-center overflow-hidden rounded-xl"
      style={{ backgroundColor: `${accent}0F` }}
    >
      <div className="pointer-events-none absolute -left-3 top-4 h-3 w-3 rounded-full bg-pink-400 opacity-40" />
      <div className="pointer-events-none absolute right-6 top-8 h-4 w-4 rounded-full bg-yellow-400 opacity-40" />
      <div className="pointer-events-none absolute bottom-5 left-1/3 h-2.5 w-2.5 rounded-full bg-purple-400 opacity-40" />
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${accent}1A` }}
      >
        <Icon size={22} style={{ color: accent }} />
      </div>
      {event.category && (
        <span className="mt-2 text-xs font-semibold" style={{ color: accent }}>
          {event.category}
        </span>
      )}
    </div>
  );
};

const SSDHelpSection = ({ t, user, studentName }) => {
  const [ssdActiveSubTab, setSsdActiveSubTab] = useState('attendance');
  const [showReportModal, setShowReportModal] = useState(false);

  // -------- Attendance --------
  const [attendanceSummary, setAttendanceSummary] = useState({
    percentage: 0, present: 0, absent: 0, totalDays: 0,
  });
  const [attendanceLog, setAttendanceLog] = useState(null);

  useEffect(() => {
    let mounted = true;
    attendanceApi.getMyAttendance()
      .then((data) => { if (mounted && data) setAttendanceSummary(data); })
      .catch(() => {});
    attendanceApi.getMyAttendanceLog()
      .then((data) => { if (mounted) setAttendanceLog(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setAttendanceLog([]); });
    return () => { mounted = false; };
  }, []);

  const submitReportRequest = async (payload) => {
    await attendanceApi.createReportRequest(payload);
  };

  // Displays a clean date for every row, whether it's a real day-by-day
  // record or one of the older bulk/migrated entries that only stored a
  // placeholder label — falls back to the record's createdAt timestamp.
  const getDisplayDate = (rec) => {
    const isPlaceholder = rec.date && (rec.date.startsWith('Migrated') || rec.date.startsWith('Bulk Entry'));
    if (isPlaceholder && rec.createdAt) {
      return new Date(rec.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return rec.date;
  };

  // -------- Volunteering: history (verified, past) --------
  const [volunteerHistory, setVolunteerHistory] = useState(null);

  useEffect(() => {
    if (ssdActiveSubTab !== 'volunteering' || volunteerHistory !== null) return;
    let mounted = true;
    volunteerApi.getMyVolunteerHistory()
      .then((data) => { if (mounted) setVolunteerHistory(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setVolunteerHistory([]); });
    return () => { mounted = false; };
  }, [ssdActiveSubTab, volunteerHistory]);

  const totalVolunteerHours = (volunteerHistory || []).reduce((sum, r) => sum + (r.hours || 0), 0);

  // -------- Volunteering: open opportunities (apply/withdraw) --------
  const [opportunities, setOpportunities] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  const loadOpportunities = () => {
    setOpportunities(null);
    volunteerOpportunityApi.getOpportunities()
      .then((data) => setOpportunities(Array.isArray(data) ? data : []))
      .catch(() => setOpportunities([]));
  };

  useEffect(() => {
    if (ssdActiveSubTab !== 'volunteering' || opportunities !== null) return;
    loadOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssdActiveSubTab]);

  const handleToggleApply = async (opportunity) => {
    setApplyingId(opportunity._id);
    const nextApplied = !opportunity.applied;
    try {
      await volunteerOpportunityApi.applyToOpportunity(opportunity._id, nextApplied);
      setOpportunities((prev) =>
        prev.map((o) => (o._id === opportunity._id ? { ...o, applied: nextApplied } : o))
      );
    } catch {
      // stays clickable so the student can retry
    } finally {
      setApplyingId(null);
    }
  };

  // -------- Upcoming events --------
  const [events, setEvents] = useState(null);
  const [myRegisteredEventIds, setMyRegisteredEventIds] = useState(new Set());
  const [registeringId, setRegisteringId] = useState(null);

  const loadEvents = () => {
    setEvents(null);
    eventsApi.getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  };

  useEffect(() => {
    if (ssdActiveSubTab !== 'events' || events !== null) return;
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssdActiveSubTab]);

  // Only future events, soonest first — past events are dropped entirely
  const upcomingEvents = (events || [])
    .filter((ev) => new Date(ev.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      await eventsApi.registerEvent(eventId);
      setMyRegisteredEventIds((prev) => new Set(prev).add(eventId));
      loadEvents();
    } catch {
      // stays clickable so the student can retry
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-Tabs Selector */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSsdActiveSubTab(id)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors sm:text-sm"
            style={{
              backgroundColor: ssdActiveSubTab === id ? t.accentPrimary : 'transparent',
              color: ssdActiveSubTab === id ? t.pageBg : t.textPrimary,
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ===================== ATTENDANCE RECORDS ===================== */}
      {ssdActiveSubTab === 'attendance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <p className="text-3xl font-extrabold" style={{ color: '#16a34a' }}>{attendanceSummary.percentage}%</p>
              <p className="mt-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>Overall Attendance</p>
              <p className="mt-0.5 text-xs font-semibold" style={{ color: '#16a34a' }}>
                {attendanceSummary.percentage >= 75 ? 'Above 75% requirement' : 'Below 75% requirement'}
              </p>
            </div>

            <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <p className="text-3xl font-extrabold" style={{ color: '#2563eb' }}>{attendanceSummary.present}</p>
              <p className="mt-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>Present Days</p>
              <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>Total sessions attended</p>
            </div>

            <div className="rounded-2xl border p-5 text-center" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <p className="text-3xl font-extrabold" style={{ color: '#dc2626' }}>{attendanceSummary.absent}</p>
              <p className="mt-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>Absent Days</p>
              <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>Out of {attendanceSummary.totalDays} total</p>
            </div>
          </div>

          {/* Request report banner */}
          <div
            className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-5 sm:flex-row"
            style={{ backgroundColor: t.cardBg, borderColor: t.border }}
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.chipBg }}>
                <FileText size={19} style={{ color: t.textPrimary }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                  Need an official attendance report?
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: t.textMuted }}>
                  Request a signed transcript for scholarships, visas, or exemptions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <FileText size={14} /> Request Report
            </button>
          </div>

          {/* Log */}
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <h3 className="mb-4 border-b pb-3 text-base font-bold" style={{ color: t.textPrimary, borderColor: t.border }}>
              Recent Attendance Activity
            </h3>

            {attendanceLog === null && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
            )}
            {attendanceLog !== null && attendanceLog.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>No attendance records yet.</p>
            )}

            <div className="space-y-2.5">
              {attendanceLog?.map((rec) => (
                <div
                  key={rec._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: rec.status === 'Present' ? '#22c55e' : '#ef4444' }}
                    />
                    <div>
                      <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{getDisplayDate(rec)}</p>
                      {rec.room && (
                        <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>Room: {rec.room}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {rec.time && <span className="text-xs font-semibold" style={{ color: t.textMuted }}>{rec.time}</span>}
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: rec.status === 'Present' ? '#dcfce7' : '#fee2e2',
                        color: rec.status === 'Present' ? '#15803d' : '#dc2626',
                      }}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== VOLUNTEERING (opportunities + history) ===================== */}
      {ssdActiveSubTab === 'volunteering' && (
        <div className="space-y-5">
          {/* ---- Open opportunities: apply / withdraw ---- */}
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>Open Volunteer Opportunities</h3>
                <p className="mt-1 text-sm" style={{ color: t.textMuted }}>Apply for a slot — SSD verifies hours after the event.</p>
              </div>
              {opportunities !== null && (
                <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                  {opportunities.length} open
                </span>
              )}
            </div>

            {opportunities === null && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
            )}
            {opportunities !== null && opportunities.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>No open opportunities right now — check back soon.</p>
            )}

            <div className="space-y-3">
              {opportunities?.map((opp) => (
                <div
                  key={opp._id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>{opp.eventTitle}</h4>
                      <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                        {opp.role}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: t.textMuted }}>
                      {opp.date}
                      {opp.slotsAvailable != null ? ` · ${opp.slotsAvailable} slots` : ''}
                    </p>
                    {opp.description && (
                      <p className="mt-1 text-xs" style={{ color: t.textMuted }}>{opp.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={applyingId === opp._id}
                    onClick={() => handleToggleApply(opp)}
                    className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: opp.applied ? '#16a34a' : t.accentPrimary,
                      color: '#fff',
                    }}
                  >
                    {applyingId === opp._id
                      ? 'Saving...'
                      : opp.applied
                      ? 'Applied ✅ (tap to withdraw)'
                      : 'Apply'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Verified history ---- */}
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Community Volunteering &amp; Service Hours
                </h3>
                <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                  Verified records registered with Student Services (SSD)
                </p>
              </div>
              <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                {totalVolunteerHours} total hours
              </span>
            </div>

            {volunteerHistory === null && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
            )}
            {volunteerHistory !== null && volunteerHistory.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: t.textMuted }}>
                No volunteering history yet — apply above to get started.
              </p>
            )}

            <div className="space-y-3">
              {volunteerHistory?.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>{item.role}</h4>
                      <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                        {item.eventTitle}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: t.textMuted }}>Date: {item.date} · Verified by SSD</p>
                  </div>
                  <span className="self-start rounded-lg border px-3 py-1.5 text-sm font-bold sm:self-center" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', color: '#15803d' }}>
                    +{item.hours} hrs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== UPCOMING EVENTS ===================== */}
      {ssdActiveSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>Upcoming Events</h3>
              <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
                Register to attend or volunteer — service hours are logged after the event.
              </p>
            </div>
            {events !== null && (
              <span className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: t.chipBg, color: t.textMuted }}>
                {upcomingEvents.length} upcoming
              </span>
            )}
          </div>

          {events === null && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading...
            </div>
          )}
          {events !== null && upcomingEvents.length === 0 && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No upcoming events right now.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcomingEvents.map((ev) => {
              const isRegistered = ev.registered || myRegisteredEventIds.has(ev._id);
              const isFull = ev.capacity != null && ev.registeredCount >= ev.capacity;
              const isRegistrationClosed = ev.registrationEnabled === false;

              return (
                <div
                  key={ev._id}
                  className="flex flex-col overflow-hidden rounded-2xl border"
                  style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                >
                  <div className="p-4 pb-0">
                    <EventBanner event={ev} />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2.5">
                      {ev.organizer?.logo ? (
                        <img
                          src={ev.organizer.logo}
                          alt={ev.organizer.name}
                          className="h-7 w-7 shrink-0 rounded-lg object-cover"
                          style={{ border: `1px solid ${t.border}` }}
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.chipBg }}>
                          <ShieldCheck size={13} style={{ color: t.textMuted }} />
                        </div>
                      )}
                      <span className="truncate text-xs font-semibold" style={{ color: t.textMuted }}>
                        {ev.organizer?.name}
                      </span>
                      {ev.capacity != null && (
                        <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                          Cap: {ev.capacity}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-3 text-base font-bold leading-snug" style={{ color: t.textPrimary }}>{ev.title}</h4>
                    <span
                      className="mt-1.5 inline-block w-fit rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                      style={{ backgroundColor: t.chipBg, color: t.textMuted }}
                    >
                      {ev.type}
                    </span>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed" style={{ color: t.textMuted }}>{ev.description}</p>

                    <div className="mt-3 border-t pt-3 text-sm" style={{ borderColor: t.border }}>
                      <p className="flex items-center gap-2" style={{ color: t.textMuted }}>
                        <Calendar size={13} />
                        <span className="font-semibold" style={{ color: t.textPrimary }}>
                          {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-2" style={{ color: t.textMuted }}>
                        <Clock size={13} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </p>
                      <p className="mt-1 flex items-center gap-2" style={{ color: t.textMuted }}>
                        <MapPin size={13} /> {ev.venue}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isRegistered || isFull || isRegistrationClosed || registeringId === ev._id}
                      onClick={() => handleRegister(ev._id)}
                      className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                      style={{ backgroundColor: isRegistered ? '#16a34a' : isRegistrationClosed ? t.textMuted : t.accentPrimary }}
                    >
                      {isRegistered
                        ? 'Registered ✅'
                        : isRegistrationClosed
                        ? 'Registration Closed'
                        : isFull
                        ? 'Event Full'
                        : registeringId === ev._id
                        ? 'Registering...'
                        : 'Register for Event'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <RequestAttendanceReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={submitReportRequest}
        t={t}
        studentName={studentName}
        userEmail={user?.email}
        studentInfo={user}
      />
    </div>
  );
};

export default SSDHelpSection;