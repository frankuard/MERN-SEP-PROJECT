import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Building2, Users,
  CalendarOff, RefreshCw, AlertCircle, Loader2, ImageOff,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';

const ACCENT = '#2f4336';
const COLLEGE_ACCENT = '#2563eb';
const COMMUNITY_ACCENT = '#9333ea';

const accentFor = (type) => (type === 'college' ? COLLEGE_ACCENT : COMMUNITY_ACCENT);
const iconFor = (type) => (type === 'college' ? Building2 : Users);

const formatDate = (isoString) => {
  if (!isoString) return 'Date TBA';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Date TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
/* Event image / themed fallback banner                                */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Organizer row                                                       */
/* ------------------------------------------------------------------ */
const OrganizerRow = ({ organizer, t }) => {
  const name = organizer?.name || 'Campus Organizer';
  const logo = organizer?.logo;

  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <img
          src={logo}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: t.pageBg, color: t.textMuted }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: t.textMuted }}>
          Organized by
        </p>
        <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>
          {name}
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Event card                                                          */
/* ------------------------------------------------------------------ */
const EventCard = ({ event, t }) => {
  const accent = accentFor(event.type);

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <EventBanner event={event} />

           <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: accent, color: '#ffffff' }}
        >
          {event.type === 'college' ? 'College' : 'Community'}
        </span>
        {event.registrationEnabled && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ACCENT }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
            Registration open
          </span>
        )}
      </div>

      <h4 className="mt-3 text-lg font-extrabold leading-snug sm:text-xl" style={{ color: t.textPrimary }}>    
            {event.title}
      </h4>

      {event.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: t.textMuted }}>
          {event.description}
        </p>
      )}

      <div className="my-4 border-t" style={{ borderColor: t.border }} />

      <div className="space-y-1.5 text-sm" style={{ color: t.textMuted }}>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0" />
          <span className="font-semibold" style={{ color: t.textPrimary }}>{formatDate(event.date)}</span>
        </div>
        {event.startTime && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0" />
            <span>{event.startTime}</span>
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t" style={{ borderColor: t.border }}>
        <OrganizerRow organizer={event.organizer} t={t} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Loading / error / empty states                                      */
/* ------------------------------------------------------------------ */
const LoadingGrid = ({ t }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border p-4"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="h-40 w-full rounded-xl" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-4 h-4 w-2/3 rounded" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-2 h-3 w-full rounded" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-2 h-3 w-4/5 rounded" style={{ backgroundColor: t.pageBg }} />
      </div>
    ))}
  </div>
);

const ErrorState = ({ onRetry, t }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
    style={{ borderColor: t.border }}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
      <AlertCircle size={20} style={{ color: t.textMuted }} />
    </div>
    <div>
      <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load events</p>
      <p className="text-sm" style={{ color: t.textMuted }}>Please try again.</p>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="mt-1 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
      style={{ backgroundColor: ACCENT }}
    >
      <RefreshCw size={14} />
      Retry
    </button>
  </div>
);

const EmptyState = ({ message, t }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
    style={{ borderColor: t.border }}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
      <CalendarOff size={20} style={{ color: t.textMuted }} />
    </div>
    <p className="text-sm font-medium" style={{ color: t.textMuted }}>{message}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
const EventsSection = ({ t }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  const fetchEvents = useCallback(async (filter) => {
    setStatus('loading');
    try {
      const type = filter === 'all' ? null : filter;
      const data = await eventsApi.getEvents(type);
      setEvents(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchEvents(activeFilter);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [activeFilter, fetchEvents]);

  const emptyMessage = activeFilter === 'college'
    ? 'No college events scheduled right now.'
    : activeFilter === 'community'
      ? 'No community events scheduled right now.'
      : 'No events available right now.';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            Events
          </h2>
          <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
            Discover what's happening around campus.
          </p>
        </div>
        <FilterTabs active={activeFilter} onChange={setActiveFilter} t={t} />
      </div>

      {status === 'loading' && <LoadingGrid t={t} />}

      {status === 'error' && (
        <ErrorState onRetry={() => fetchEvents(activeFilter)} t={t} />
      )}

      {status === 'success' && (
        events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((ev) => (
              <EventCard key={ev._id} event={ev} t={t} />
            ))}
          </div>
        ) : (
          <EmptyState message={emptyMessage} t={t} />
        )
      )}
    </div>
  );
};

export default EventsSection;