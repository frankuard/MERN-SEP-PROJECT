import React, { useMemo } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

const EVENT_COLORS = ['#f472b6', '#a78bfa', '#38bdf8'];

const parseEventDate = (dateStr) => {
  const parsed = new Date(`${dateStr} ${new Date().getFullYear()}`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: dateStr.split(' ')[0]?.toUpperCase() || '—', num: '—' };
  }
  return {
    day: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    num: parsed.getDate(),
  };
};

const UpcomingEvents = ({ t, collegeEvents, communityEvents, onNavigateTab }) => {
  const upcomingEvents = useMemo(() => {
    const combined = [
      ...collegeEvents.map((ev) => ({ ...ev, type: 'college' })),
      ...communityEvents.map((ev) => ({ ...ev, type: 'community' })),
    ];
    return combined.slice(0, 3);
  }, [collegeEvents, communityEvents]);

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
          const { day, num } = parseEventDate(ev.date);
          const color = EVENT_COLORS[index % EVENT_COLORS.length];
          return (
            <li
              key={ev.id}
              className="dashboard-card-lift flex items-center gap-4 rounded-[20px] bg-white p-4"
              style={{ boxShadow: t.shadowSoft }}
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white" style={{ backgroundColor: color }}>
                <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-90">{day}</span>
                <span className="text-xl font-extrabold tabular-nums leading-none">{num}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-snug" style={{ color: t.textPrimary }}>{ev.name}</p>
                <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>{ev.time} · {ev.venue}</p>
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
