import { useEffect, useState } from 'react';
import {
  Building2,
  ClipboardList,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import communityPortalApi from '../../api/communityPortalApi';

const ACCENT = '#9333ea';

const STATUS_BADGE = {
  pending:  { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  accepted: { bg: '#dcfce7', text: '#15803d', label: 'Accepted' },
  rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
};

const statusBadge = (status) => STATUS_BADGE[status] || STATUS_BADGE.pending;

// ── About Community ─────────────────────────────────────────────────────────
const AboutCommunity = ({ community, t }) => {
  const [stats, setStats] = useState({ members: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    communityPortalApi
      .getMemberships(community.id)
      .then((data) => {
        const list = Array.isArray(data?.memberships) ? data.memberships : [];
        if (!mounted) return;
        setStats({
          total: list.length,
          members: list.filter((m) => m.status === 'accepted').length,
          pending: list.filter((m) => m.status === 'pending').length,
        });
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [community.id]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div
        className="flex flex-col rounded-2xl border p-5 sm:col-span-2 sm:p-6"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
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
        <p className="mt-4 text-sm leading-relaxed sm:text-[15px]" style={{ color: t.textSecondary }}>
          {community.about}
        </p>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textMuted }}>
          <UserCheck size={16} style={{ color: ACCENT }} />
          Community Members
        </div>
        <p className="mt-3 text-3xl font-extrabold" style={{ color: t.textPrimary }}>
          {loading ? '—' : stats.members}
        </p>
        <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
          Approved members with the Community section in their sidebar
        </p>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: t.textMuted }}>
          <ClipboardList size={16} style={{ color: ACCENT }} />
          Pending Requests
        </div>
        <p className="mt-3 text-3xl font-extrabold" style={{ color: t.textPrimary }}>
          {loading ? '—' : stats.pending}
        </p>
        <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
          Invitations waiting for the user&apos;s decision
        </p>
      </div>
    </div>
  );
};

// ── Members Management ──────────────────────────────────────────────────────
const MembersManagement = ({ community, t }) => {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = () => {
    setStatus('loading');
    communityPortalApi
      .getMemberships(community.id)
      .then((data) => {
        const list = Array.isArray(data?.memberships) ? data.memberships : [];
        setMembers(list.filter((m) => m.status === 'accepted'));
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, [community.id]);

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12" style={{ borderColor: t.border }}>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading members...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load members</p>
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
        members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
            <Users size={22} style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No approved members yet. Send invites from Member Requests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-3 rounded-2xl border p-4"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold"
                  style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                >
                  {m.user?.profileImage ? (
                    <img src={m.user.profileImage} alt={m.user.username} className="h-full w-full object-cover" />
                  ) : (
                    (m.user?.username || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                    {m.user?.username || 'Unknown user'}
                  </p>
                  <p className="truncate text-xs font-medium" style={{ color: t.textMuted }}>
                    {m.user?.email || ''}
                  </p>
                  {m.user?.department && (
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      {m.user.department}
                    </p>
                  )}
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: STATUS_BADGE.accepted.bg, color: STATUS_BADGE.accepted.text }}
                >
                  Member
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// ── Member Requests ─────────────────────────────────────────────────────────
const MemberRequests = ({ community, t }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState([]);
  const [sendingId, setSendingId] = useState(null);

  const loadHistory = () => {
    communityPortalApi
      .getMemberships(community.id)
      .then((data) => setHistory(Array.isArray(data?.memberships) ? data.memberships : []))
      .catch(() => {});
  };

  useEffect(loadHistory, [community.id]);

  const runSearch = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const data = await communityPortalApi.searchUsers(q);
      setResults(Array.isArray(data?.results) ? data.results : []);
      setHasSearched(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (user) => {
    setSendingId(user._id);
    try {
      const data = await communityPortalApi.sendMembershipRequest(community.id, user._id);
      toast.success(data?.message || 'Membership request sent');
      // Re-run the search results so the matching user shows "Pending".
      runSearch();
      loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send request');
      runSearch();
      loadHistory();
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form
        onSubmit={runSearch}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search registered users by name or email..."
            className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search Users
        </button>
      </form>

      {/* Search results */}
      {hasSearched && (
        <div className="space-y-3">
          <h4 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
            Search Results
          </h4>
          {results.length === 0 && !searching ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center" style={{ borderColor: t.border }}>
              <UserPlus size={20} style={{ color: t.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>No matching users found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((user) => {
                const badge = statusBadge(user.membershipStatus);
                return (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 rounded-2xl border p-4"
                    style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold"
                      style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                    >
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
                      ) : (
                        (user.username || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                        {user.username}
                      </p>
                      <p className="truncate text-xs font-medium" style={{ color: t.textMuted }}>
                        {user.email}
                      </p>
                      <p className="truncate text-[11px] font-semibold capitalize" style={{ color: t.textMuted }}>
                        {user.role || 'User'}{user.department ? ` · ${user.department}` : ''}
                      </p>
                    </div>
                    {user.membershipStatus ? (
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSend(user)}
                        disabled={sendingId === user._id}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {sendingId === user._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        Send Request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!searching && hasSearched && results.length === 0 && (
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              Tip: search a user&apos;s name or email — every approved registered user is searchable.
            </p>
          )}
        </div>
      )}

      {/* Request history with statuses */}
      <div className="space-y-3">
        <h4 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Request History
        </h4>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-10 text-center" style={{ borderColor: t.border }}>
            <ClipboardList size={20} style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No memberships yet. Search for a user to send your first request.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {history.map((m) => {
              const badge = statusBadge(m.status);
              return (
                <div
                  key={m._id}
                  className="flex items-center gap-3 rounded-2xl border p-4"
                  style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl font-extrabold"
                    style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                  >
                    {m.user?.profileImage ? (
                      <img src={m.user.profileImage} alt={m.user.username} className="h-full w-full object-cover" />
                    ) : (
                      (m.user?.username || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                      {m.user?.username || 'Unknown user'}
                    </p>
                    <p className="truncate text-xs font-medium" style={{ color: t.textMuted }}>
                      {m.user?.email || ''}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Manage User shell — exactly three sections ───────────────────────────────
const CommunityPortalManageUser = ({ community, t }) => {
  const [activeTab, setActiveTab] = useState('about');

  if (!community) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center"
        style={{ borderColor: t.border }}
      >
        <Building2 size={26} style={{ color: t.textMuted }} />
        <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
          No community account resolved.
        </p>
        <p className="text-sm" style={{ color: t.textMuted }}>
          This screen is only available to the five member community accounts.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About Community', icon: Info },
    { id: 'members', label: 'Members Management', icon: Users },
    { id: 'requests', label: 'Member Requests', icon: UserPlus },
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
            Manage User
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
            {community.name} · invite, approve, and manage your community members
          </p>
        </div>
      </div>

      {/* Dedicated navigation — only these three sections */}
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        role="tablist"
        aria-label="Manage User sections"
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

      {activeTab === 'about' && <AboutCommunity community={community} t={t} />}
      {activeTab === 'members' && <MembersManagement community={community} t={t} />}
      {activeTab === 'requests' && <MemberRequests community={community} t={t} />}
    </div>
  );
};

export default CommunityPortalManageUser;