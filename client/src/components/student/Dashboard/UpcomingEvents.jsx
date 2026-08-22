import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import eventsApi from '../../../api/eventsApi';

const EVENT_COLORS = ['#f472b6', '#a78bfa', '#38bdf8'];

// Real events store an ISO `date` + separate `startTime` string, unlike the
// old dummy data's single "Aug 26" string — parse directly off the Date.
const formatEventDate = (isoDate) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return { day: '—', num: '—' };
  }
  return {
    day: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    num: parsed.getDate(),
  };
};

const UpcomingEvents = ({ t, onNavigateTab }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
  let mounted = true;
  eventsApi.getEvents()
    .then((data) => {
      if (mounted && Array.isArray(data)) setEvents(data);
    })
    .catch(() => {});
  return () => { mounted = false; };
}, []);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((ev) => ev.registrationEnabled) // only where registration is actually open
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // soonest first
      .slice(0, 3);
  }, [events]);

  if (upcomingEvents.length === 0) return null;

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            <Calendar size={18} strokeWidth={2.5} />
          </div>
          <h2 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Upcoming Campus Events</h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('events')}
          className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-extrabold text-white transition-transform hover:scale-105"
        >
          View all
          <ArrowRight size={12} />
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-3">
        {upcomingEvents.map((ev, index) => {
          const { day, num } = formatEventDate(ev.date);
          const color = EVENT_COLORS[index % EVENT_COLORS.length];
          return (
            <li
              key={ev._id}
              className="dashboard-card-lift flex items-center gap-4 rounded-[20px] bg-white p-4"
              style={{ boxShadow: t.shadowSoft }}
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ backgroundColor: color }}>
                <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">{day}</span>
                <span className="text-xl font-extrabold tabular-nums leading-none">{num}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>{ev.title}</p>
                <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>{ev.startTime} · {ev.venue}</p>
                <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white" style={{ backgroundColor: color }}>
                  {ev.type === 'college' ? 'College Event' : 'Community'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default UpcomingEvents;