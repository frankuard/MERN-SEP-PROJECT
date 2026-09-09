import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ClipboardList,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import communityPortalApi from '../../api/communityPortalApi';
import { useAuth } from '../../context/AuthContext';

const ACCENT = '#9333ea';

const STATUS_BADGE = {
  pending:  { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
  accepted: { bg: '#dcfce7', text: '#15803d', label: 'Accepted' },
  rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Rejected' },
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ── Approval overlay/modal — exactly two primary actions: Approve, Reject ──
const ApprovalModal = ({ request, t, submitting, onApprove, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl"
        style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-extrabold"
                style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
              >
                {(request.communityName || 'C').charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight" style={{ color: t.textPrimary }}>
                  Community Membership Request
                </h3>
                <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
                  {request.communityName}
                </p>
              </div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{ backgroundColor: STATUS_BADGE[request.status]?.bg || '#f1f5f9', color: STATUS_BADGE[request.status]?.text || t.textMuted }}
            >
              {STATUS_BADGE[request.status]?.label || request.status}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: t.textSecondary }}>
            <span className="font-bold" style={{ color: t.textPrimary }}>{request.communityName}</span> has
            invited you to join their community. Approving unlocks the Community section in your
            sidebar, where you can explore the community and its released workshops.
          </p>
        </div>

        <div className="flex gap-3 border-t p-5" style={{ borderColor: t.border }}>
          <button
            type="button"
            onClick={onReject}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: t.border, color: t.textPrimary }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#16a34a' }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

const MembershipRequestsSection = ({ t }) => {
  const { refreshUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('loading');
  const [openRequestId, setOpenRequestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setStatus('loading');
    communityPortalApi
      .getMyRequests()
      .then((data) => {
        const list = Array.isArray(data?.requests) ? data.requests : [];
        setRequests(list);
        setStatus('success');
        const pending = list.find((r) => r.status === 'pending');
        if (pending) setOpenRequestId((current) => current || pending._id);
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingForModal = requests.find((r) => r._id === openRequestId && r.status === 'pending');

  const handleRespond = async (requestId, action) => {
    setSubmitting(true);
    try {
      const data = await communityPortalApi.respondToMembershipRequest(requestId, action);
      toast.success(data?.message || (action === 'accept' ? 'Membership approved' : 'Request rejected'));
      // Re-fetch /auth/me so the sidebar's Community section appears/updates
      // right away after an approval.
      await refreshUser();
      setOpenRequestId(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Community Requests
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          Approve or reject community membership requests sent to you by the five campus communities.
        </p>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12" style={{ borderColor: t.border }}>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading requests...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load requests</p>
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
        requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: t.border }}>
            <ClipboardList size={24} style={{ color: t.textMuted }} />
            <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
              No community membership requests yet.
            </p>
            <p className="max-w-sm text-xs leading-relaxed" style={{ color: t.textMuted }}>
              When a community invites you, the request appears here — approve it to unlock the
              Community section in your sidebar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {requests.map((request) => {
              const badge = STATUS_BADGE[request.status] || STATUS_BADGE.pending;
              return (
                <div
                  key={request._id}
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-extrabold"
                      style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                    >
                      {(request.communityName || 'C').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
                        {request.communityName}
                      </p>
                      <p className="text-xs font-medium" style={{ color: t.textMuted }}>
                        {timeAgo(request.createdAt)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-4 flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOpenRequestId(request._id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: t.border, color: t.textPrimary }}
                      >
                        Review Request
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(request._id, 'accept')}
                        disabled={submitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundColor: '#16a34a' }}
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  )}

                  {(request.status === 'accepted' || request.status === 'rejected') && (
                    <p className="mt-4 text-xs font-medium leading-relaxed" style={{ color: t.textMuted }}>
                      {request.status === 'accepted'
                        ? 'You are a member of this community. It is available from the Community section of your sidebar.'
                        : 'You declined this request. The community will not be added to your sidebar.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Approval overlay — a specific pending request is opened */}
      {pendingForModal && (
        <ApprovalModal
          request={pendingForModal}
          t={t}
          submitting={submitting}
          onApprove={() => handleRespond(pendingForModal._id, 'accept')}
          onReject={() => handleRespond(pendingForModal._id, 'reject')}
        />
      )}
    </div>
  );
};

export default MembershipRequestsSection;