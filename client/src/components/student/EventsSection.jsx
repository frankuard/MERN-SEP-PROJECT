import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Building2, Users,
  CalendarOff, RefreshCw, AlertCircle,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';

const ACCENT            = '#2f4336';
const COLLEGE_ACCENT    = '#2563eb';
const COMMUNITY_ACCENT  = '#9333ea';

const accentFor = (type) => (type === 'college' ? COLLEGE_ACCENT : COMMUNITY_ACCENT);
const iconFor   = (type) => (type === 'college' ? Building2 : Users);

const formatDate = (isoString) => {
  if (!isoString) return 'Date TBA';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Date TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Status badge config (matches admin STATUS_BADGE exactly) ──────────────────
const STATUS_BADGE = {
  upcoming:  { bg: '#dbeafe', text: '#1d4ed8',  label: 'Upcoming'  },
  ongoing:   { bg: '#dcfce7', text: '#15803d',  label: 'Ongoing'   },
  completed: { bg: '#f1f5f9', text: '#475569',  label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c',  label: 'Cancelled' },
};

// ── Primary tab switcher (Upcoming Events / All Events) ───────────────────────
const PrimaryTabs = ({ active, onChange, t }) => (
  <div
    className="inline-flex items-center gap-1 rounded-full border p-1"
    style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    role="tablist"
  >
    {[
      { id: 'upcoming', label: 'Upcoming Events' },
      { id: 'all',      label: 'All Events'      },
    ].map(({ id, label }) => {
      const isActive = active === id;
      return (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(id)}
          className="rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{
            backgroundColor: isActive ? ACCENT : 'transparent',
            color: isActive ? '#ffffff' : t.textMuted,
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// ── College / Community side filter chips ─────────────────────────────────────
const TypeFilter = ({ active, onChange, t }) => (
  <div className="flex flex-wrap items-center gap-2">
    {[
      { id: 'all',       label: 'All Types'        },
      { id: 'college',   label: 'College Events'   },
      { id: 'community', label: 'Community Events' },
    ].map(({ id, label }) => {
      const isActive = active === id;
      const accent =
        id === 'college'   ? COLLEGE_ACCENT :
        id === 'community' ? COMMUNITY_ACCENT : t.textPrimary;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200"
          style={{
            backgroundColor: isActive
              ? id === 'all' ? t.accentPrimary : accent
              : t.cardBg,
            borderColor: isActive
              ? id === 'all' ? t.accentPrimary : accent
              : t.border,
            color: isActive ? '#ffffff' : t.textMuted,
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

// ── Event image / themed fallback banner ──────────────────────────────────────
const EventBanner = ({ event }) => {
  const accent = accentFor(event.type);
  const Icon   = iconFor(event.type);

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

// ── Organizer row ─────────────────────────────────────────────────────────────
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

// ── Event card ────────────────────────────────────────────────────────────────
const EventCard = ({ event, t }) => {
  const accent      = accentFor(event.type);
  const statusInfo  = STATUS_BADGE[event.status] || STATUS_BADGE.upcoming;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <EventBanner event={event} />

      {/* Type badge + status badge + registration indicator */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: accent, color: '#ffffff' }}
        >
          {event.type === 'college' ? 'College' : 'Community'}
        </span>

        {/* Status badge */}
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold capitalize"
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
        >
          {statusInfo.label}
        </span>

        {event.registrationEnabled && event.status !== 'cancelled' && event.status !== 'completed' && (
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
            <span>{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span>
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
      </div>

      <div className="mt-4 border-t pt-3" style={{ borderColor: t.border }}>
        <OrganizerRow organizer={event.organizer} t={t} />
      </div>
    </div>
  );
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
const LoadingGrid = ({ t }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border p-4"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="h-40 w-full rounded-xl" style={{ backgroundColor: t.pageBg }} />
        <div className="mt-4 h-4 w-2/3 rounded"  style={{ backgroundColor: t.pageBg }} />
        <div className="mt-2 h-3 w-full rounded"  style={{ backgroundColor: t.pageBg }} />
        <div className="mt-2 h-3 w-4/5 rounded"  style={{ backgroundColor: t.pageBg }} />
      </div>
    ))}
  </div>
);

// ── Error / empty states ──────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
const EventsSection = ({ t }) => {
  // Primary tab: 'upcoming' | 'all'
  const [primaryTab,  setPrimaryTab]  = useState('upcoming');
  // Side type filter: 'all' | 'college' | 'community'
  const [typeFilter,  setTypeFilter]  = useState('all');
  // All published events fetched once
  const [allEvents,   setAllEvents]   = useState([]);
  const [fetchStatus, setFetchStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  // Reset type filter when switching primary tab so context is fresh
  const handlePrimaryTabChange = (tab) => {
    setPrimaryTab(tab);
    setTypeFilter('all');
  };

  const fetchAllEvents = useCallback(async () => {
    setFetchStatus('loading');
    try {
      // Fetch all published events (no type param = all types)
      const data = await eventsApi.getEvents({});
      setAllEvents(Array.isArray(data) ? data : []);
      setFetchStatus('success');
    } catch {
      setFetchStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const visibleEvents = (() => {
    let events = allEvents;

    // 1. Primary tab filter
    if (primaryTab === 'upcoming') {
      // Show only upcoming + ongoing (admin-controlled statuses)
      events = events.filter((ev) => ev.status === 'upcoming' || ev.status === 'ongoing');
      // Sort: ongoing first (already started), then by date ascending
      events = [...events].sort((a, b) => {
        const aOngoing = a.status === 'ongoing' ? 0 : 1;
        const bOngoing = b.status === 'ongoing' ? 0 : 1;
        if (aOngoing !== bOngoing) return aOngoing - bOngoing;
        return new Date(a.date) - new Date(b.date);
      });
    } else {
      // All Events — all statuses, sorted by date descending (newest first)
      events = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 2. Side type filter
    if (typeFilter !== 'all') {
      events = events.filter((ev) => ev.type === typeFilter);
    }

    return events;
  })();

  // ── Empty state message ────────────────────────────────────────────────────
  const emptyMessage = (() => {
    const typeLabel =
      typeFilter === 'college'   ? 'college '   :
      typeFilter === 'community' ? 'community ' : '';

    return primaryTab === 'upcoming'
      ? `No upcoming ${typeLabel}events right now.`
      : `No ${typeLabel}events found.`;
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header row — title + primary tab switcher */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            Events
          </h2>
          <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
            Discover what's happening around campus.
          </p>
        </div>
        <PrimaryTabs active={primaryTab} onChange={handlePrimaryTabChange} t={t} />
      </div>

      {/* Side type filter (College / Community) */}
      <TypeFilter active={typeFilter} onChange={setTypeFilter} t={t} />

      {/* Content */}
      {fetchStatus === 'loading' && <LoadingGrid t={t} />}

      {fetchStatus === 'error' && (
        <ErrorState onRetry={fetchAllEvents} t={t} />
      )}

      {fetchStatus === 'success' && (
        visibleEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleEvents.map((ev) => (
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
