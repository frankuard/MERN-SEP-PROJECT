import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, Users, CalendarOff, RefreshCw, ArrowLeft, MessageCircle,
  UserCheck, ClipboardList, ChevronDown, ArrowRight, Info, ScrollText,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import communityPortalApi from '../../api/communityPortalApi';
import { DEV_CORPS_COMMUNITIES } from '../../data/devcorpsConfig';
import { getSocket } from '../../socket/socket';
import CommunityAboutPanel from '../community/CommunityAboutPanel';
import { AboutCommunity } from '../community/CommunityPortalManageUser';
import { ManageConstitution } from '../community/CommunityConstitutionSection';

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

// One expandable dropdown per community. The collapsed header shows the
// community's own stored logo (or letter tile), its name, and its live Total
// Members count straight from the database. Expanding reveals the EXACT About
// Community content configured in that community's own portal — pulled from
// the shared CommunityProfile endpoint that the Managed Users → About
// Community screen also reads and edits, so updates there appear here
// automatically (and in real time over WebSocket).
const CommunityDropdown = ({ community, profile, memberCount, pendingCount, open, t, onToggle, onOpen, onOpenChat }) => {
  const hasLogo = Boolean(community.logo);

  return (
    <div
      className="overflow-hidden rounded-2xl border transition-colors duration-300"
      style={{ backgroundColor: t.cardBg, borderColor: open ? `${COMMUNITY_ACCENT}66` : t.border }}
    >
      {/* Header — click the toggle area to expand/collapse. The chat button is
          a separate element so it never triggers the dropdown. */}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            style={{ color: t.textMuted }}
          />
          {hasLogo ? (
            <img
              src={community.logo}
              alt={`${community.name} logo`}
              className="h-11 w-11 shrink-0 rounded-2xl object-cover"
              style={{ border: `1px solid ${t.border}` }}
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-extrabold"
              style={{ backgroundColor: `${COMMUNITY_ACCENT}1A`, color: COMMUNITY_ACCENT }}
            >
              {community.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold sm:text-lg" style={{ color: t.textPrimary }}>
              {community.name}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium" style={{ color: t.textMuted }}>
              Community account · DevCorps Community Portal
            </p>
          </div>
        </button>

        {/* Live Total Members — real database count */}
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: `${COMMUNITY_ACCENT}14`, color: COMMUNITY_ACCENT }}
        >
          <Users size={13} />
          {memberCount} member{memberCount === 1 ? '' : 's'}
        </span>

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

      {/* Collapsible body — clean expand/collapse animation. */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t px-4 pb-5 pt-4 sm:px-5 sm:pb-6" style={{ borderColor: t.border }}>
            {/* About Community — the exact content from this community's own
                Managed Users About screen (shared CommunityProfile data). */}
            <CommunityAboutPanel profile={profile} t={t} />

            {/* Live stats from the database (same cards as About Community) */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
              >
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: t.textMuted }}>
                  <UserCheck size={14} className="shrink-0" style={{ color: COMMUNITY_ACCENT }} />
                  Community Members
                </div>
                <p className="mt-2 text-2xl font-extrabold" style={{ color: t.textPrimary }}>
                  {memberCount}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug" style={{ color: t.textMuted }}>
                  Approved members with the Community section in their sidebar
                </p>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
              >
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: t.textMuted }}>
                  <ClipboardList size={14} className="shrink-0" style={{ color: COMMUNITY_ACCENT }} />
                  Pending Requests
                </div>
                <p className="mt-2 text-2xl font-extrabold" style={{ color: t.textPrimary }}>
                  {pendingCount}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug" style={{ color: t.textMuted }}>
                  Invitations waiting for the user&apos;s decision
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpen(community)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
              style={{ borderColor: t.border, color: t.textSecondary }}
            >
              Open {community.name}
              <ArrowRight size={14} style={{ color: t.textMuted }} />
            </button>
          </div>
        </div>
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

// Overview of the five member communities as dropdown sections. Each dropdown
// shows the exact About Community content that was configured in that
// community's own portal (Managed Users → About Community) — the data comes
// from the shared CommunityProfile collection/API, NOT hardcoded here, so any
// edit made in Managed Users appears in this portal automatically.
const CommunityOverview = ({ t, onOpen, onOpenChat }) => {
  // Live member stats keyed by community id — accepted members (Total Members)
  // and pending requests. Seeded from the database on mount, then kept in sync
  // over WebSocket: the server broadcasts 'community:memberCount' the moment a
  // request is sent, approved, or rejected.
  const [counts, setCounts] = useState({});
  const [pendingCounts, setPendingCounts] = useState({});
  // About Community content keyed by community id, from /communities. Updated
  // from the 'community:profile' socket event when Managed Users edits a
  // community's About page.
  const [profiles, setProfiles] = useState({});
  // Accordion — only the selected dropdown expands (one open at a time).
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let active = true;

    communityPortalApi.getMemberCounts()
      .then((data) => {
        if (!active) return;
        if (data?.counts) setCounts((prev) => ({ ...prev, ...data.counts }));
        if (data?.pendingCounts) setPendingCounts((prev) => ({ ...prev, ...data.pendingCounts }));
      })
      .catch(() => { /* silent — stats stay 0 until the socket kicks in */ });

    communityPortalApi.getCommunityProfiles()
      .then((data) => {
        if (!active) return;
        const map = {};
        for (const p of Array.isArray(data?.profiles) ? data.profiles : []) {
          map[p.communityId] = p;
        }
        setProfiles(map);
      })
      .catch(() => { /* silent — sections still render with the logo header */ });

    const socket = getSocket();
    const onMemberCount = (payload) => {
      if (!payload || typeof payload !== 'object') return;
      if (payload.counts && typeof payload.counts === 'object') {
        setCounts((prev) => ({ ...prev, ...payload.counts }));
      }
      if (payload.pendingCounts && typeof payload.pendingCounts === 'object') {
        setPendingCounts((prev) => ({ ...prev, ...payload.pendingCounts }));
      }
    };
    // Managed Users edited a community's About page → reflect it here live.
    const onProfile = (payload) => {
      if (!payload || typeof payload !== 'object' || !payload.communityId || !payload.profile) return;
      setProfiles((prev) => ({ ...prev, [payload.communityId]: payload.profile }));
    };
    socket.on('community:memberCount', onMemberCount);
    socket.on('community:profile', onProfile);

    return () => {
      active = false;
      socket.off('community:memberCount', onMemberCount);
      socket.off('community:profile', onProfile);
    };
  }, []);

  const toggleDropdown = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Communities
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          Five dropdown sections — one for each community. Open one to see its About Community.
        </p>
      </div>

      <div className="space-y-3">
        {DEV_CORPS_COMMUNITIES.map((community) => (
          <CommunityDropdown
            key={community.id}
            community={community}
            profile={profiles[community.id]}
            memberCount={counts[community.id] ?? 0}
            pendingCount={pendingCounts[community.id] ?? 0}
            open={openId === community.id}
            onToggle={() => toggleDropdown(community.id)}
            t={t}
            onOpen={onOpen}
            onOpenChat={onOpenChat}
          />
        ))}
      </div>
    </div>
  );
};

// Events belonging to a single selected community. When `embedded` is true the
// standalone header (back button/chat) is skipped so the view can be shown
// inside the selected community's About/Events tabbed screen.
const CommunityEventsView = ({ t, community, onBack, onOpenChat, embedded = false }) => {
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
    <div className={embedded ? '' : 'space-y-6 animate-in fade-in duration-200'}>
      {!embedded && (
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
      )}

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

// A single community selected from the DevCorps sidebar's Communities menu.
// Defaults to that community's About Community screen — the EXACT same content
// (logo/name header, About text, and live member + pending counts) as that
// community's own portal under Manage User → About Community, reused verbatim —
// with an "Events" tab on the side so the previous events view isn't lost.
const CommunityAboutView = ({ t, community, onBack, onOpenChat }) => {
  const [tab, setTab] = useState('about');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top row — back to all communities, About/Events switcher, chat */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                {tab === 'about' ? 'About Community' : tab === 'constitution' ? 'Constitution' : 'Community Events'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* About / Events / Constitution switcher */}
          <div
            className="inline-flex items-center gap-1 rounded-full border p-1"
            style={{ backgroundColor: t.cardBg, borderColor: t.border }}
            role="tablist"
            aria-label={`${community.name} sections`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'about'}
              onClick={() => setTab('about')}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: tab === 'about' ? COMMUNITY_ACCENT : 'transparent',
                color: tab === 'about' ? '#ffffff' : t.textMuted,
              }}
            >
              <Info size={15} />
              About Community
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'events'}
              onClick={() => setTab('events')}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: tab === 'events' ? COMMUNITY_ACCENT : 'transparent',
                color: tab === 'events' ? '#ffffff' : t.textMuted,
              }}
            >
              <Calendar size={15} />
              Events
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'constitution'}
              onClick={() => setTab('constitution')}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: tab === 'constitution' ? COMMUNITY_ACCENT : 'transparent',
                color: tab === 'constitution' ? '#ffffff' : t.textMuted,
              }}
            >
              <ScrollText size={15} />
              Constitution
            </button>
          </div>

          {/* Chat icon — existing Chat page for the six DevCorps communities */}
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
      </div>

      {tab === 'about' ? (
        // Reused verbatim from the community's Manage User → About Community
        // portal — the exact About content and member counts.
        <AboutCommunity community={community} t={t} />
      ) : tab === 'constitution' ? (
        // The DevCorps portal admin oversees every community's constitution
        // here (same manager the community's own Manage User tab uses).
        <ManageConstitution community={community} t={t} />
      ) : (
        <CommunityEventsView t={t} community={community} onBack={onBack} onOpenChat={onOpenChat} embedded />
      )}
    </div>
  );
};

const CommunitiesSection = ({ t, community, onNavigateCommunity, onBack, onOpenChat }) => {
  if (community) {
    return <CommunityAboutView t={t} community={community} onBack={onBack} onOpenChat={onOpenChat} />;
  }

  return <CommunityOverview t={t} onOpen={onNavigateCommunity} onBack={onBack} onOpenChat={onOpenChat} />;
};

export default CommunitiesSection;