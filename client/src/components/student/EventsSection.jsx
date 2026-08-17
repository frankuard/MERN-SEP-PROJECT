import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Trophy } from 'lucide-react';

const EventsSection = ({
  t,
  collegeEvents,
  communityEvents,
  onToggleCollegeEvent,
  onToggleCommunityEvent,
  renderEventIcon,
}) => {
  const [eventsFilter, setEventsFilter] = useState('all');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Campus Events Hub
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
            Browse and register for official college programs and student community workshops.
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl border p-1 shadow-xs self-start"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <button
            type="button"
            onClick={() => setEventsFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              eventsFilter === 'all'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={() => setEventsFilter('college')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              eventsFilter === 'college'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            College Events
          </button>
          <button
            type="button"
            onClick={() => setEventsFilter('community')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              eventsFilter === 'community'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Community Events
          </button>
        </div>
      </div>

      {/* College Events */}
      {(eventsFilter === 'all' || eventsFilter === 'college') && (
        <div className="space-y-4">
          <h3 className="text-base font-bold border-b pb-2" style={{ color: t.textPrimary, borderColor: t.border }}>
            Official College Events
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collegeEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                      {renderEventIcon(ev.iconType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {ev.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-blue-600">{ev.badge}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    {ev.desc}
                  </p>
                  <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} /> <span className="font-semibold" style={{ color: t.textPrimary }}>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} /> <span>{ev.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} /> <span>{ev.venue}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => onToggleCollegeEvent(ev.id)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      ev.registered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                    }`}
                  >
                    {ev.registered ? 'Registered' : 'Register for Event'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Events */}
      {(eventsFilter === 'all' || eventsFilter === 'community') && (
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-bold border-b pb-2" style={{ color: t.textPrimary, borderColor: t.border }}>
            Student Community Events
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communityEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40">
                      {renderEventIcon(ev.iconType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {ev.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-purple-600">by {ev.org}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                    {ev.desc}
                  </p>
                  <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} /> <span className="font-semibold" style={{ color: t.textPrimary }}>{ev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} /> <span>{ev.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} /> <span>{ev.venue}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => onToggleCommunityEvent(ev.id)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      ev.joined
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-[#2f4336] text-white hover:bg-[#25362b] shadow-xs'
                    }`}
                  >
                    {ev.joined ? 'Joined Session' : 'Join Event'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsSection;
