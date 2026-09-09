import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Users, CalendarOff, RefreshCw, ArrowLeft, MessageCircle,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import communityPortalApi from '../../api/communityPortalApi';
import { DEV_CORPS_COMMUNITIES } from '../../data/devcorpsConfig';
import { getSocket } from '../../socket/socket';

const COMMUNITY_ACCENT = '#9333ea';

const formatDate = (isoString) => {
  if (!isoString) return 'Date TBA';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 'Date TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_BADGE = {
  upcoming:  { bg: '#dbeafe', text: '#1d4ed8',  label: 'Upcoming'  },
  ongoing:   { bg: '#dcfce7', text: '#15803d',  label: 'Ongoing'   },
  completed: { bg: '#f1f5f9', text: '#475569',  label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c',  label: 'Cancelled' },
};

const belongsToCommunity = (event, community) => {
  const organizerName = (event.organizer?.name || '').toLowerCase();
  return organizerName.includes(community.name.toLowerCase());
};

const CommunityCard = ({ community, count, t, onOpen, onOpenChat }) => {
  // The community's own stored logo where one exists; communities without a
  // stored logo keep the existing letter-tile avatar (no generic icons).
  const hasLogo = Boolean(community.logo);

  return (
    <div
      className="flex w-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md sm:p-5"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onOpen(community)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {hasLogo ? (
            <img
              src={community.logo}
              alt={`${community.name} logo`}
              className="h-12 w-12 shrink-0 rounded-2xl object-cover"
              style={{ border: `1px solid ${t.border}` }}
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold"
              style={{ backgroundColor: `${COMMUNITY_ACCENT}1A`, color: COMMUNITY_ACCENT }}
            >
              {community.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-extrabold" style={{ color: t.textPrimary }}>{community.name}</p>
            <p className="mt-0.5 text-xs font-medium" style={{ color: t.textMuted }}>
              View community events
            </p>
          </div>
        </button>

        {/* Chat icon — jumps straight to the existing Chat page so the six
            DevCorps communities can message each other directly. */}
        <button
          type="button"
          onClick={() => onOpenChat(community)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: COMMUNITY_ACCENT }}
          aria-label={`Open chat for ${community.name}`}
          title="Open chat"
        >
          <MessageCircle size={17} />
        </button>
      </div>

      {/* About Community — specific to this community's own field */}
      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed" style={{ color: t.textMuted }}>
        {community.about}
      </p>

      {/* Total Members — real accepted-member count from the database,
          updated in real time over WebSocket the moment a request is approved */}
      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: t.border }}>
        <div className="flex items-center gap-2">
          <Users size={16} className="shrink-0" style={{ color: COMMUNITY_ACCENT }} />
          <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Total Members</span>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-extrabold"
          style={{ backgroundColor: `${COMMUNITY_ACCENT}1A`, color: COMMUNITY_ACCENT }}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

const CommunityEventCard = ({ event, t }) => {
  const statusInfo = STATUS_BADGE[event.status] || STATUS_BADGE.upcoming;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      {event.eventImage ? (
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl">
          <img
            src={event.eventImage}
            alt={event.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="flex aspect-4/5 w-full items-center justify-center rounded-xl"
          style={{ backgroundColor: `${COMMUNITY_ACCENT}0F` }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${COMMUNITY_ACCENT}1A` }}
          >
            <Users size={22} style={{ color: COMMUNITY_ACCENT }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: COMMUNITY_ACCENT, color: '#ffffff' }}
        >
          Community
        </span>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold capitalize"
          style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
        >
          {statusInfo.label}
        </span>
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

      {event.organizer?.name && (
        <div className="mt-4 border-t pt-3 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: t.border, color: t.textMuted }}>
          Organized by <span className="font-bold" style={{ color: t.textPrimary }}>{event.organizer.name}</span>
        </div>
      )}
    </div>
  );
};

// Overview of all five member communities.
const CommunityOverview = ({ t, onOpen, onOpenChat }) => {
  // Live accepted-member counts keyed by community id. Seeded from the
  // database on mount, then kept in sync over WebSocket — the server emits
  // 'community:memberCount' the moment a membership request is approved, so
  // this updates instantly for every connected user (no page refresh).
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;

    communityPortalApi.getMemberCounts()
      .then((data) => {
        if (active && data?.counts) {
          setCounts((prev) => ({ ...prev, ...data.counts }));
        }
      })
      .catch(() => { /* silent — counts stay 0 until the socket kicks in */ });

    const socket = getSocket();
    const onMemberCount = (payload) => {
      if (!payload?.counts || typeof payload.counts !== 'object') return;
      setCounts((prev) => ({ ...prev, ...payload.counts }));
    };
    socket.on('community:memberCount', onMemberCount);

    return () => {
      active = false;
      socket.off('community:memberCount', onMemberCount);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Communities
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          The five member communities of the DevCorps Community Portal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEV_CORPS_COMMUNITIES.map((community) => (
          <CommunityCard
            key={community.id}
            community={community}
            count={counts[community.id] ?? 0}
            t={t}
            onOpen={onOpen}
            onOpenChat={onOpenChat}
          />
        ))}
      </div>
    </div>
  );
};

// Events belonging to a single selected community.
const CommunityEventsView = ({ t, community, onBack, onOpenChat }) => {
  const [events, setEvents] = useState([]);
  const [fetchStatus, setFetchStatus] = useState('loading');

  const fetchEvents = useCallback(async () => {
    setFetchStatus('loading');
    try {
      const data = await eventsApi.getEvents({ type: 'community' });
      const filtered = (Array.isArray(data) ? data : []).filter((ev) => belongsToCommunity(ev, community));
      setEvents(filtered);
      setFetchStatus('success');
    } catch {
      setFetchStatus('error');
    }
  }, [community]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: t.border, color: t.textPrimary }}
            aria-label="Back to all communities"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl font-extrabold"
              style={{ backgroundColor: `${COMMUNITY_ACCENT}1A`, color: COMMUNITY_ACCENT }}
            >
              {community.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
                {community.name}
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
                Community Events
              </p>
            </div>
          </div>
        </div>

        {/* Chat icon — opens the existing Chat page so the six DevCorps
            communities can message each other directly. */}
        <button
          type="button"
          onClick={() => onOpenChat(community)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: t.border, color: COMMUNITY_ACCENT }}
          aria-label={`Open chat for ${community.name}`}
          title="Open chat"
        >
          <MessageCircle size={16} />
        </button>
      </div>

      {fetchStatus === 'loading' && (
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
            </div>
          ))}
        </div>
      )}

      {fetchStatus === 'error' && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
          style={{ borderColor: t.border }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <RefreshCw size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load events</p>
          <button
            type="button"
            onClick={fetchEvents}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {fetchStatus === 'success' && (
        events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((ev) => (
              <CommunityEventCard key={ev._id} event={ev} t={t} />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
            style={{ borderColor: t.border }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
              <CalendarOff size={20} style={{ color: t.textMuted }} />
            </div>
            <p className="text-sm font-medium" style={{ color: t.textMuted }}>
              No events for {community.name} yet.
            </p>
          </div>
        )
      )}
    </div>
  );
};

const CommunitiesSection = ({ t, community, onNavigateCommunity, onBack, onOpenChat }) => {
  if (community) {
    return <CommunityEventsView t={t} community={community} onBack={onBack} onOpenChat={onOpenChat} />;
  }

  return <CommunityOverview t={t} onOpen={onNavigateCommunity} onBack={onBack} onOpenChat={onOpenChat} />;
};

export default CommunitiesSection;