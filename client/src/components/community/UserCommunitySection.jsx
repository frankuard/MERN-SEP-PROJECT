import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Clock,
  Info,
  Loader2,
  Lock,
  MapPin,
  Presentation,
  RefreshCw,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import eventsApi from '../../api/eventsApi';
import communityPortalApi from '../../api/communityPortalApi';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../socket/socket';
import CommunityAboutPanel from './CommunityAboutPanel';

const ACCENT = '#9333ea';

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

// ── Event card (reuses the existing community event visual language) ────────
const CommunityEventCard = ({ event, t }) => {
  const statusInfo = STATUS_BADGE[event.status] || STATUS_BADGE.upcoming;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
    >
      {event.eventImage ? (
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl">
          <img src={event.eventImage} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="flex aspect-4/5 w-full items-center justify-center rounded-xl" style={{ backgroundColor: `${ACCENT}0F` }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${ACCENT}1A` }}>
            <Users size={22} style={{ color: ACCENT }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: ACCENT, color: '#ffffff' }}>
          Community
        </span>
        <span className="rounded-full px-3 py-1 text-[11px] font-bold capitalize" style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}>
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
    </div>
  );
};

// ── Workshop detail overlay ─────────────────────────────────────────────────
const WorkshopModal = ({ workshop, t, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
    <div
      className="relative w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl"
      style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
    >
      {workshop.image && (
        <div className="aspect-[16/7] w-full overflow-hidden">
          <img src={workshop.image} alt={workshop.title} className="h-full w-full object-cover" />
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        aria-label="Close details"
      >
        <X size={15} />
      </button>
      <div className="p-6">
        <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}>
          {workshop.communityName}
        </span>
        <h3 className="mt-3 text-2xl font-extrabold leading-snug" style={{ color: t.textPrimary }}>
          {workshop.title}
        </h3>
        {workshop.description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: t.textSecondary }}>
            {workshop.description}
          </p>
        )}

        <div className="mt-5 space-y-2.5 text-sm" style={{ color: t.textMuted }}>
          {workshop.date && (
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} className="shrink-0" />
              <span className="font-semibold" style={{ color: t.textPrimary }}>{workshop.date}</span>
            </div>
          )}
          {workshop.time && (
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="shrink-0" />
              <span>{workshop.time}{workshop.duration ? ` (${workshop.duration})` : ''}</span>
            </div>
          )}
          {workshop.venue && (
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0" />
              <span>{workshop.venue}</span>
            </div>
          )}
          {workshop.instructor && (
            <div className="flex items-center gap-2.5">
              <UserRound size={15} className="shrink-0" />
              <span>{workshop.instructor}</span>
            </div>
          )}
          {workshop.capacity > 0 && (
            <div className="flex items-center gap-2.5">
              <Users size={15} className="shrink-0" />
              <span>Capacity: {workshop.capacity}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ── Community Workshops tab ─────────────────────────────────────────────────
const CommunityWorkshopsView = ({ community, t }) => {
  const [workshops, setWorkshops] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setStatus('loading');
    communityPortalApi
      .getCommunityWorkshops(community.id)
      .then((data) => {
        setWorkshops(Array.isArray(data?.workshops) ? data.workshops : []);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [community.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12" style={{ borderColor: t.border }}>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading workshops...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load workshops</p>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {status === 'success' && (
        workshops.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
            <Presentation size={22} style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No workshops released by {community.name} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workshops.map((workshop) => (
              <button
                key={workshop._id}
                type="button"
                onClick={() => setSelected(workshop)}
                className="flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                {workshop.image ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={workshop.image} alt={workshop.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center" style={{ backgroundColor: `${ACCENT}0F` }}>
                    <Presentation size={26} style={{ color: ACCENT }} />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h4 className="text-lg font-extrabold leading-snug" style={{ color: t.textPrimary }}>
                    {workshop.title}
                  </h4>
                  {workshop.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed" style={{ color: t.textMuted }}>
                      {workshop.description}
                    </p>
                  )}
                  <div className="mt-3 space-y-1 text-xs" style={{ color: t.textMuted }}>
                    {workshop.date && (
                      <p className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="shrink-0" /> {workshop.date}
                        {workshop.time ? ` · ${workshop.time}` : ''}
                      </p>
                    )}
                    {workshop.venue && (
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="shrink-0" /> {workshop.venue}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {selected && <WorkshopModal workshop={selected} t={t} onClose={() => setSelected(null)} />}
    </div>
  );
};

// ── Community Events tab ────────────────────────────────────────────────────
const CommunityEventsView = ({ community, t }) => {
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
    <div className="space-y-4">
      {fetchStatus === 'loading' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <div className="h-40 w-full rounded-xl" style={{ backgroundColor: t.pageBg }} />
              <div className="mt-4 h-4 w-2/3 rounded" style={{ backgroundColor: t.pageBg }} />
              <div className="mt-2 h-3 w-full rounded" style={{ backgroundColor: t.pageBg }} />
            </div>
          ))}
        </div>
      )}

      {fetchStatus === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load events</p>
          <button
            type="button"
            onClick={fetchEvents}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} /> Retry
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
            <CalendarOff size={20} style={{ color: t.textMuted }} />
            <p className="text-sm font-medium" style={{ color: t.textMuted }}>
              No community events for {community.name} yet.
            </p>
          </div>
        )
      )}
    </div>
  );
};

// ── About Community tab ─────────────────────────────────────────────────────
// Renders the community's About Community content from the SAME shared
// CommunityProfile the community edits under Manage User → About Community.
// When a community updates its About content there, the change lands in the
// DB and is broadcast over WebSocket ('community:profile'), so this user tab
// reflects the edit immediately — no refresh needed.
const CommunityAboutView = ({ community, t }) => {
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({});
  const [pendingCounts, setPendingCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      communityPortalApi.getCommunityProfiles(),
      communityPortalApi.getMemberCounts(),
    ])
      .then(([profilesData, countsData]) => {
        if (!active) return;
        setProfile((profilesData?.profiles || []).find((p) => p.communityId === community.id) || null);
        if (countsData?.counts) setCounts(countsData.counts);
        if (countsData?.pendingCounts) setPendingCounts(countsData.pendingCounts);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    const socket = getSocket();
    const onProfile = (payload) => {
      if (payload && typeof payload === 'object' && payload.communityId === community.id && payload.profile) {
        setProfile(payload.profile);
      }
    };
    const onMemberCount = (payload) => {
      if (!payload || typeof payload !== 'object') return;
      if (payload.counts && typeof payload.counts === 'object') {
        setCounts((prev) => ({ ...prev, ...payload.counts }));
      }
      if (payload.pendingCounts && typeof payload.pendingCounts === 'object') {
        setPendingCounts((prev) => ({ ...prev, ...payload.pendingCounts }));
      }
    };
    socket.on('community:profile', onProfile);
    socket.on('community:memberCount', onMemberCount);

    return () => {
      active = false;
      socket.off('community:profile', onProfile);
      socket.off('community:memberCount', onMemberCount);
    };
  }, [community.id]);

  const memberCount = counts[community.id] ?? 0;
  const pendingCount = pendingCounts[community.id] ?? 0;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12" style={{ borderColor: t.border }}>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading About Community...</p>
        </div>
      ) : (
        <>
          {/* Same About content the community manages, shown verbatim — with
              the community's own stored logo up top (how it appears in that
              community's Manage User → About Community screen). */}
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
            <div className="flex items-center gap-3">
              {community.logo ? (
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
                  style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                >
                  {community.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: t.textPrimary }}>
                  {community.name}
                </h3>
                <p className="text-sm font-medium" style={{ color: t.textMuted }}>
                  Community account · DevCorps Community Portal
                </p>
              </div>
            </div>

            <div className="mt-5">
              <CommunityAboutPanel profile={profile} t={t} />
            </div>
          </div>

          {/* Live stats from the database (same cards as About Community) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textMuted }}>
                <UserCheck size={16} style={{ color: ACCENT }} />
                Community Members
              </div>
              <p className="mt-3 text-3xl font-extrabold" style={{ color: t.textPrimary }}>{memberCount}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
                Approved members with the Community section in their sidebar
              </p>
            </div>
            <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textMuted }}>
                <ClipboardList size={16} style={{ color: ACCENT }} />
                Pending Requests
              </div>
              <p className="mt-3 text-3xl font-extrabold" style={{ color: t.textPrimary }}>{pendingCount}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
                Invitations waiting for the user&apos;s decision
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── User Community section shell ─────────────────────────────────────────────
const UserCommunitySection = ({ community, t }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about');

  const isMember = Array.isArray(user?.communityMemberships)
    && user.communityMemberships.some((m) => m.communityId === community.id);

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${ACCENT}1A` }}>
          <Lock size={22} style={{ color: ACCENT }} />
        </div>
        <p className="text-lg font-extrabold" style={{ color: t.textPrimary }}>{community.name}</p>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: t.textMuted }}>
          You aren&apos;t a member of this community yet. The community unlocks its content
          only after you approve its membership request.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About Community', icon: Info },
    { id: 'events', label: 'Community Events', icon: Calendar },
    { id: 'workshops', label: 'Community Workshops', icon: Presentation },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold"
          style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
        >
          {community.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
            {community.name}
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
            You are an approved member of this community
          </p>
        </div>
        <span className="ml-auto hidden rounded-full px-3 py-1 text-[11px] font-bold sm:block" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
          Member
        </span>
      </div>

      {/* Community navigation/tabs */}
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        role="tablist"
        aria-label="Community sections"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: isActive ? ACCENT : 'transparent',
                color: isActive ? '#ffffff' : t.textMuted,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'about' && <CommunityAboutView community={community} t={t} />}
      {activeTab === 'events' && <CommunityEventsView community={community} t={t} />}
      {activeTab === 'workshops' && <CommunityWorkshopsView community={community} t={t} />}
    </div>
  );
};

export default UserCommunitySection;