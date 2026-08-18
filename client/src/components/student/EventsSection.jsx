import { useState, useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, Building2, Check, CalendarOff } from 'lucide-react';

const ACCENT = '#2f4336';
const COLLEGE_ACCENT = '#2563eb';
const COMMUNITY_ACCENT = '#9333ea';

/* ------------------------------------------------------------------ */
/* Filter pills — polished segmented control                           */
/* ------------------------------------------------------------------ */
const FilterTabs = ({ active, onChange, t }) => {
  const options = [
    { id: 'all', label: 'All Events' },
    { id: 'college', label: 'College Events' },
    { id: 'community', label: 'Community Events' },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border p-1"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className="rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              backgroundColor: isActive ? ACCENT : 'transparent',
              color: isActive ? '#ffffff' : t.textMuted,
              ['--tw-ring-color']: ACCENT,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Shared meta row: date / time / venue                                */
/* ------------------------------------------------------------------ */
const EventMeta = ({ date, time, venue, t, size = 'sm' }) => {
  const iconSize = size === 'lg' ? 16 : 14;
  const textClass = size === 'lg' ? 'text-sm' : 'text-sm';

  return (
    <div className={`space-y-1.5 ${textClass}`} style={{ color: t.textMuted }}>
      <div className="flex items-center gap-2">
        <Calendar size={iconSize} className="shrink-0" style={{ color: t.textMuted }} />
        <span className="font-semibold" style={{ color: t.textPrimary }}>{date}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock size={iconSize} className="shrink-0" />
        <span>{time}</span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={iconSize} className="shrink-0" />
        <span>{venue}</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Featured event — hero panel above the grid                          */
/* ------------------------------------------------------------------ */
const FeaturedEvent = ({ event, kind, onToggle, renderEventIcon, t }) => {
  const isJoined = kind === 'college' ? event.registered : event.joined;
  const label = kind === 'college'
    ? (event.registered ? 'Registered' : 'Register for Event')
    : (event.joined ? 'Joined Session' : 'Join Event');
  const badge = kind === 'college' ? event.badge : `by ${event.org}`;
  const eyebrow = kind === 'college' ? 'Next Official Event' : 'Next Community Event';
  const accent = kind === 'college' ? COLLEGE_ACCENT : COMMUNITY_ACCENT;

  return (
    <div
      className="overflow-hidden rounded-3xl border shadow-sm"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${ACCENT}12` }}
          >
            {renderEventIcon(event.iconType)}
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>
              {eyebrow}
            </span>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-tight sm:text-xl" style={{ color: t.textPrimary }}>
                {event.name}
              </h3>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: `${accent}14`, color: accent }}
              >
                {badge}
              </span>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: t.textMuted }}>
              {event.desc}
            </p>

            <div className="mt-5">
              <EventMeta date={event.date} time={event.time} venue={event.venue} t={t} size="lg" />
            </div>
          </div>
        </div>

        <div className="shrink-0 lg:pt-9">
          <button
            type="button"
            onClick={() => onToggle(event.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:opacity-90 lg:w-auto"
            style={
              isJoined
                ? { backgroundColor: t.pageBg, color: t.textPrimary, border: `1px solid ${t.border}` }
                : { backgroundColor: ACCENT, color: '#ffffff' }
            }
          >
            {isJoined && <Check size={15} />}
            {label}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Event card — used inside the responsive grid                       */
/* ------------------------------------------------------------------ */
const EventCard = ({ event, kind, onToggle, renderEventIcon, t }) => {
  const isJoined = kind === 'college' ? event.registered : event.joined;
  const label = kind === 'college'
    ? (event.registered ? 'Registered' : 'Register for Event')
    : (event.joined ? 'Joined Session' : 'Join Event');
  const badge = kind === 'college' ? event.badge : `by ${event.org}`;
  const accent = kind === 'college' ? COLLEGE_ACCENT : COMMUNITY_ACCENT;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}12` }}
        >
          {renderEventIcon(event.iconType)}
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {badge}
        </span>
      </div>

      <h4 className="mt-4 text-base font-bold leading-snug sm:text-lg" style={{ color: t.textPrimary }}>
        {event.name}
      </h4>

      <p className="mt-2 text-sm leading-relaxed" style={{ color: t.textMuted }}>
        {event.desc}
      </p>

      <div className="my-4 border-t" style={{ borderColor: t.border }} />

      <EventMeta date={event.date} time={event.time} venue={event.venue} t={t} />

      <button
        type="button"
        onClick={() => onToggle(event.id)}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 hover:opacity-90"
        style={
          isJoined
            ? { backgroundColor: t.pageBg, color: t.textPrimary, border: `1px solid ${t.border}` }
            : { backgroundColor: ACCENT, color: '#ffffff' }
        }
      >
        {isJoined && <Check size={14} />}
        {label}
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section header                                                       */
/* ------------------------------------------------------------------ */
const SectionHeader = ({ icon, title, subtitle, count, t }) => (
  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm" style={{ color: t.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <span className="text-sm font-semibold" style={{ color: t.textMuted }}>
      {count}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */
const EmptyState = ({ message, t }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
    style={{ borderColor: t.border }}
  >
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl"
      style={{ backgroundColor: t.pageBg }}
    >
      <CalendarOff size={20} style={{ color: t.textMuted }} />
    </div>
    <p className="text-sm font-medium" style={{ color: t.textMuted }}>
      {message}
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const EventsSection = ({
  t,
  collegeEvents,
  communityEvents,
  onToggleCollegeEvent,
  onToggleCommunityEvent,
  renderEventIcon,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const showCollege = activeFilter !== 'community';
  const showCommunity = activeFilter !== 'college';

  const featured = useMemo(() => {
    if (activeFilter === 'college') {
      return collegeEvents[0] ? { event: collegeEvents[0], kind: 'college' } : null;
    }
    if (activeFilter === 'community') {
      return communityEvents[0] ? { event: communityEvents[0], kind: 'community' } : null;
    }
    if (collegeEvents[0]) return { event: collegeEvents[0], kind: 'college' };
    if (communityEvents[0]) return { event: communityEvents[0], kind: 'community' };
    return null;
  }, [activeFilter, collegeEvents, communityEvents]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            Campus Events Hub
          </h2>
          <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
            Browse upcoming college programs, workshops, community activities, and student events.
          </p>
        </div>
        <FilterTabs active={activeFilter} onChange={setActiveFilter} t={t} />
      </div>

      {/* Featured event */}
      {featured && (
        <FeaturedEvent
          event={featured.event}
          kind={featured.kind}
          onToggle={featured.kind === 'college' ? onToggleCollegeEvent : onToggleCommunityEvent}
          renderEventIcon={renderEventIcon}
          t={t}
        />
      )}

      {/* College Events */}
      {showCollege && (
        <div className="space-y-4">
          <SectionHeader
            icon={<Building2 size={18} style={{ color: COLLEGE_ACCENT }} />}
            title="Official College Events"
            subtitle="Ceremonies, fests and institutional programs"
            count={`${collegeEvents.length} event${collegeEvents.length === 1 ? '' : 's'}`}
            t={t}
          />
          {collegeEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collegeEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  kind="college"
                  onToggle={onToggleCollegeEvent}
                  renderEventIcon={renderEventIcon}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No college events scheduled right now." t={t} />
          )}
        </div>
      )}

      {/* Community Events */}
      {showCommunity && (
        <div className="space-y-4">
          <SectionHeader
            icon={<Users size={18} style={{ color: COMMUNITY_ACCENT }} />}
            title="Student Community Events"
            subtitle="Organized by clubs and student-led groups"
            count={`${communityEvents.length} event${communityEvents.length === 1 ? '' : 's'}`}
            t={t}
          />
          {communityEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {communityEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  kind="community"
                  onToggle={onToggleCommunityEvent}
                  renderEventIcon={renderEventIcon}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No community events scheduled right now." t={t} />
          )}
        </div>
      )}
    </div>
  );
};

export default EventsSection;