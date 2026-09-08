import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import DashboardMascot from '../student/Dashboard/DashboardMascot';

const STATUS_BADGE = {
  upcoming:  { bg: '#dbeafe', text: '#1d4ed8', label: 'Upcoming'  },
  ongoing:   { bg: '#dcfce7', text: '#15803d', label: 'Ongoing'   },
  completed: { bg: '#f1f5f9', text: '#475569', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' },
};

const formatDate = (isoString) => {
  if (!isoString) return 'Date TBA';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Date TBA';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Greeting hero that mirrors the Student/Teacher hero styling exactly, but
// swaps the attendance card for the DevCorps "Next Upcoming Event" card —
// showing event name, date, time, status, and venue with a View Event action.
const DevCorpsGreetingHeader = ({ t, greeting, memberName, onNavigateTab }) => {
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    let mounted = true;
    eventsApi
      .getEvents()
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        const eligible = data
          .filter((ev) => ev.status === 'upcoming' || ev.status === 'ongoing')
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setNextEvent(eligible[0] || null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const statusInfo = STATUS_BADGE[nextEvent?.status] || STATUS_BADGE.upcoming;

  return (
    <section
      className="dashboard-hero relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-8"
      style={{
        backgroundColor: t.heroBg || t.pastelBlue,
        boxShadow: t.shadowCard,
      }}
    >
      {/* Colorful decorative blobs */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-pink-300/40" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-20 w-20 rounded-full bg-purple-300/30" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-14 w-14 rounded-full bg-yellow-300/40" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <div className="hidden shrink-0 sm:block">
            <DashboardMascot className="h-28 w-auto sm:h-32" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
              {greeting}, {memberName}!
            </h1>
            <p className="mt-2 text-sm font-semibold sm:text-base" style={{ color: t.textSecondary }}>
              Welcome to the DevCorps Community Portal.
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
              Biratnagar International College
            </p>
          </div>
        </div>

        {/* Next Upcoming Event card — white floating */}
        <div
          className="dashboard-card-lift shrink-0 rounded-[24px] bg-white p-5 sm:min-w-[280px]"
          style={{ boxShadow: t.shadowSoft }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: t.textMuted }}>
              Next Upcoming Event
            </p>
            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
              style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-2 text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>
            {nextEvent?.title || 'No upcoming events right now'}
          </p>
          {nextEvent && (
            <div className="mt-3 space-y-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
              <p className="flex items-center gap-2">
                <CalendarDays size={13} className="shrink-0" />
                <span>{formatDate(nextEvent.date)}</span>
              </p>
              {nextEvent.startTime && (
                <p className="flex items-center gap-2">
                  <Clock size={13} className="shrink-0" />
                  <span>
                    {nextEvent.startTime}
                    {nextEvent.endTime ? ` – ${nextEvent.endTime}` : ''}
                  </span>
                </p>
              )}
              {nextEvent.venue && (
                <p className="flex items-center gap-2">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{nextEvent.venue}</span>
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigateTab('events')}
            className="dashboard-btn-bounce mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-xs font-extrabold text-white"
          >
            View Event
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DevCorpsGreetingHeader;