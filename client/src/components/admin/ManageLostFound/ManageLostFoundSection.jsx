import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, User, Video, Trash2, CheckCircle2, Clock, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import lostFoundApi from '../../../api/lostFoundApi';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

const ACCENT = '#2f4336';

const STATUS_COLORS = {
  Unclaimed: { bg: '#fef3c7', text: '#92400e' },
  open: { bg: '#fef3c7', text: '#92400e' },
  'Claim Pending': { bg: '#dbeafe', text: '#1e40af' },
  Claimed: { bg: '#dcfce7', text: '#166534' },
  Returned: { bg: '#dcfce7', text: '#166534' },
  resolved: { bg: '#dcfce7', text: '#166534' },
};

const CCTV_STATUS_COLORS = {
  'In Review': { bg: '#fef3c7', text: '#92400e' },
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Approved: { bg: '#dbeafe', text: '#1e40af' },
  Completed: { bg: '#dcfce7', text: '#166534' },
  Rejected: { bg: '#fee2e2', text: '#991b1b' },
};

const CLAIM_STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Approved: { bg: '#dcfce7', text: '#166534' },
  Rejected: { bg: '#fee2e2', text: '#991b1b' },
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatusBadge = ({ status, colorMap }) => {
  const colors = colorMap[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span
      className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {status}
    </span>
  );
};

const TabButton = ({ active, onClick, children, count }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200"
    style={{
      backgroundColor: active ? ACCENT : 'transparent',
      color: active ? '#ffffff' : undefined,
    }}
  >
    {children}
    {typeof count === 'number' && (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-extrabold"
        style={{
          backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${ACCENT}14`,
          color: active ? '#ffffff' : ACCENT,
        }}
      >
        {count}
      </span>
    )}
  </button>
);

const ItemLogCard = ({ item, t, onMarkReturned, onDelete, processingId }) => {
  const isProcessing = processingId === item._id;
  const canMarkReturned = !['Returned', 'resolved'].includes(item.status);

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold" style={{ color: t.textPrimary }}>{item.title}</p>
            <StatusBadge status={item.status} colorMap={STATUS_COLORS} />
          </div>
          <p className="mt-1.5 text-sm" style={{ color: t.textMuted }}>{item.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <MapPin size={16} />
          {item.location}
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <Clock size={16} />
          {formatDate(item.createdAt)}
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <User size={16} />
          {item.type === 'lost' ? 'Lost by' : 'Found by'}: {item.authorName || item.createdBy?.username || 'Unknown'}
        </div>
        {item.claimantName && (
          <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
            <CheckCircle2 size={16} />
            Claimed by: {item.claimantName}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4" style={{ borderColor: t.border }}>
        <span
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
        >
          {item.category}
        </span>
        <div className="flex items-center gap-2">
          {canMarkReturned && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onMarkReturned(item._id)}
              className="cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              {isProcessing ? 'Updating...' : 'Mark Returned'}
            </button>
          )}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onDelete(item)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
            style={{ borderColor: '#fecaca', color: '#dc2626' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CctvLogCard = ({ request, t, onUpdateStatus, processingId }) => {
  const isProcessing = processingId === request._id;

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold" style={{ color: t.textPrimary }}>{request.location}</p>
            <StatusBadge status={request.status} colorMap={CCTV_STATUS_COLORS} />
          </div>
          <p className="mt-1.5 text-sm" style={{ color: t.textMuted }}>{request.reason}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <User size={16} />
          Requested by: {request.userName || request.user?.username || 'Unknown'}
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <Clock size={16} />
          {request.date} · {request.timeFrom} – {request.timeTo}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4" style={{ borderColor: t.border }}>
        {['In Review', 'Pending'].includes(request.status) && (
          <>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onUpdateStatus(request._id, 'Approved')}
              className="cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onUpdateStatus(request._id, 'Rejected')}
              className="cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
              style={{ borderColor: '#fecaca', color: '#dc2626' }}
            >
              Reject
            </button>
          </>
        )}
        {request.status === 'Approved' && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onUpdateStatus(request._id, 'Completed')}
            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            Mark Completed
          </button>
        )}
      </div>
    </div>
  );
};

const ClaimLogCard = ({ claim, t, onUpdateClaim, processingId }) => {
  const isProcessing = processingId === claim._id;

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-bold" style={{ color: t.textPrimary }}>{claim.itemTitle}</p>
            <StatusBadge status={claim.status} colorMap={CLAIM_STATUS_COLORS} />
          </div>
          <p className="mt-1.5 text-sm" style={{ color: t.textMuted }}>{claim.details}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <User size={16} />
          Claimed by: {claim.userName} ({claim.userEmail})
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
          <Clock size={16} />
          {formatDate(claim.claimedAt)}
        </div>
      </div>

      {claim.status === 'Pending' && (
        <div className="mt-4 flex justify-end gap-2 border-t pt-4" style={{ borderColor: t.border }}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onUpdateClaim(claim.itemId, claim._id, 'Approved')}
            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            Approve Claim
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onUpdateClaim(claim.itemId, claim._id, 'Rejected')}
            className="cursor-pointer rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/30"
            style={{ borderColor: '#fecaca', color: '#dc2626' }}
          >
            Reject Claim
          </button>
        </div>
      )}
    </div>
  );
};

// Controlled/uncontrolled, same pattern as ManageCampusHelpSection — when
// a parent (Resources dept sidebar) passes activeTab, this component's
// own switcher hides and CCTV Requests becomes a fully separate sidebar
// view. Standalone (main admin dashboard) is unaffected.
const ManageLostFoundSection = ({ t, activeTab: controlledActiveTab, onTabChange }) => {
  const [internalTab, setInternalTab] = useState('lost'); // 'lost' | 'found' | 'cctv' | 'claims'
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;
  const setActiveTab = (id) => {
    if (controlledActiveTab === undefined) setInternalTab(id);
    onTabChange?.(id);
  };
  const [items, setItems] = useState([]);
  const [cctvRequests, setCctvRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lostFoundData, cctvData] = await Promise.all([
        lostFoundApi.getItems(search ? { search } : {}),
        lostFoundApi.getMyCctvRequests(),
      ]);
      setItems(Array.isArray(lostFoundData) ? lostFoundData : []);
      setCctvRequests(Array.isArray(cctvData) ? cctvData : []);
    } catch {
      toast.error('Failed to load Lost & Found data');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const lostItems = items.filter((it) => it.type === 'lost');
  const foundItems = items.filter((it) => it.type === 'found');

  const allClaims = items.flatMap((item) =>
    (item.claims || []).map((claim) => ({
      ...claim,
      itemId: item._id,
      itemTitle: item.title,
      itemType: item.type,
    }))
  );

  const handleMarkReturned = async (itemId) => {
    setProcessingId(itemId);
    try {
      const updated = await lostFoundApi.returnItem(itemId);
      setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)));
      toast.success('Item marked as returned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setProcessingId(deleteTarget._id);
    try {
      await lostFoundApi.deleteItem(deleteTarget._id);
      setItems((prev) => prev.filter((it) => it._id !== deleteTarget._id));
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setProcessingId(null);
      setDeleteTarget(null);
    }
  };

  const handleUpdateCctvStatus = async (requestId, status) => {
    setProcessingId(requestId);
    try {
      const updated = await lostFoundApi.updateCctvStatus(requestId, { status });
      setCctvRequests((prev) => prev.map((r) => (r._id === requestId ? updated : r)));
      toast.success(`Request marked as ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateClaim = async (itemId, claimId, status) => {
    setProcessingId(claimId);
    try {
      const updated = await lostFoundApi.updateClaimStatus(itemId, claimId, status);
      setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)));
      toast.success(`Claim ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update claim');
    } finally {
      setProcessingId(null);
    }
  };

  const activeList =
    activeTab === 'lost' ? lostItems :
    activeTab === 'found' ? foundItems :
    activeTab === 'cctv' ? cctvRequests :
    allClaims;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <Search size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Lost &amp; Found</h2>
      </div>

      <div className="rounded-[28px] p-5 sm:p-6" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            placeholder="Search by title, location, or category..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-1"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: ACCENT }}
          />
        </div>

        {controlledActiveTab === undefined && (
          <div className="mt-4 flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
            <TabButton active={activeTab === 'lost'} onClick={() => setActiveTab('lost')} count={lostItems.length}>
              Lost Items
            </TabButton>
            <TabButton active={activeTab === 'found'} onClick={() => setActiveTab('found')} count={foundItems.length}>
              Found Items
            </TabButton>
            <TabButton active={activeTab === 'cctv'} onClick={() => setActiveTab('cctv')} count={cctvRequests.length}>
              <Video size={16} className="inline -mt-0.5 mr-1" />
              CCTV Requests
            </TabButton>
            <TabButton active={activeTab === 'claims'} onClick={() => setActiveTab('claims')} count={allClaims.length}>
              <FileCheck size={16} className="inline -mt-0.5 mr-1" />
              Claims
            </TabButton>
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          Loading...
        </div>
      )}

      {!loading && activeList.length === 0 && (
        <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
          No {activeTab === 'cctv' ? 'CCTV requests' : activeTab === 'claims' ? 'claims' : `${activeTab} items`} found.
        </div>
      )}

      {!loading && activeList.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeTab === 'lost' || activeTab === 'found'
            ? activeList.map((item) => (
                <ItemLogCard
                  key={item._id}
                  item={item}
                  t={t}
                  onMarkReturned={handleMarkReturned}
                  onDelete={setDeleteTarget}
                  processingId={processingId}
                />
              ))
            : activeTab === 'cctv'
            ? activeList.map((request) => (
                <CctvLogCard
                  key={request._id}
                  request={request}
                  t={t}
                  onUpdateStatus={handleUpdateCctvStatus}
                  processingId={processingId}
                />
              ))
            : activeList.map((claim) => (
                <ClaimLogCard
                  key={claim._id}
                  claim={claim}
                  t={t}
                  onUpdateClaim={handleUpdateClaim}
                  processingId={processingId}
                />
              ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete this item?"
          message={`This will permanently delete "${deleteTarget.title}" from the log. This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          deleting={processingId === deleteTarget._id}
          t={t}
        />
      )}
    </div>
  );
};

export default ManageLostFoundSection;