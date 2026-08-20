import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import lostFoundApi from '../../api/lostFoundApi';
import { useAuth } from '../../context/AuthContext';
import LostFoundList from './LostFound/LostFoundList';
import ReportLostItemModal from './modals/ReportLostItemModal';
import CctvRequestModal from './modals/CctvRequestModal';

const ACCENT = '#2f4336';
const CATEGORIES = ['All', 'Bags', 'Electronics', 'Keys', 'Books', 'General'];

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FilterTabs = ({ active, onChange, t }) => {
  const options = [
    { id: 'all', label: 'All' },
    { id: 'lost', label: 'Lost' },
    { id: 'found', label: 'Found' },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
      {options.map((opt) => {
        const isActive = active === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200"
            style={{ backgroundColor: isActive ? ACCENT : 'transparent', color: isActive ? '#ffffff' : t.textMuted }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

const ActivityCard = ({ entry, t }) => (
  <div className="rounded-2xl border p-4" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>
        {entry.kind === 'cctv' ? 'CCTV Request' : entry.type === 'lost' ? 'Lost Item' : 'Found Item'}
      </span>
      <span className="text-[11px] font-semibold" style={{ color: t.textMuted }}>{formatDate(entry.createdAt)}</span>
    </div>
    <p className="mt-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>{entry.title}</p>
    <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>{entry.subtitle}</p>
    <p className="mt-2 text-xs font-semibold" style={{ color: t.textPrimary }}>Status: {entry.status}</p>
  </div>
);

const LostFoundSection = ({ t }) => {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [typeFilter, setTypeFilter] = useState('all');
  const [category, setCategory] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [activity, setActivity] = useState([]);
  const [claimingId, setClaimingId] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showCctvModal, setShowCctvModal] = useState(false);

  // Debounce search input -> search query
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchItems = useCallback(async () => {
    setStatus('loading');
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const data = await lostFoundApi.getItems(params);
      setItems(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [typeFilter, category, search]);

  const fetchActivity = useCallback(async () => {
    try {
      const [mine, cctv] = await Promise.all([
        lostFoundApi.getItems({ mine: true }),
        lostFoundApi.getMyCctvRequests(),
      ]);

      const mineEntries = (Array.isArray(mine) ? mine : []).map((it) => ({
        kind: 'lostfound',
        id: it._id,
        type: it.type,
        title: it.title,
        subtitle: `Reported at ${it.location}`,
        status: it.status,
        createdAt: it.createdAt,
      }));

      const cctvEntries = (Array.isArray(cctv) ? cctv : []).map((c) => ({
        kind: 'cctv',
        id: c._id,
        title: c.location,
        subtitle: c.reason,
        status: c.status,
        createdAt: c.createdAt,
      }));

      const merged = [...mineEntries, ...cctvEntries].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setActivity(merged);
    } catch {
      // Activity is secondary; failing silently here just leaves the section empty,
      // the main items grid above still reports its own errors.
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const handleClaim = async (itemId) => {
    setClaimingId(itemId);
    try {
      const updated = await lostFoundApi.claimItem(itemId, {
        details: 'I am claiming this item as its rightful owner.',
      });
      setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)));
      toast.success('Claim submitted!');
      fetchActivity();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim item');
    } finally {
      setClaimingId(null);
    }
  };

  const handleReportSubmit = async (form) => {
    try {
      const newItem = await lostFoundApi.reportItem(form);
      setItems((prev) => [newItem, ...prev]);
      toast.success('Item reported successfully!');
      fetchActivity();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report item');
      throw err;
    }
  };

  const handleCctvSubmit = async (form) => {
    try {
      await lostFoundApi.submitCctvRequest(form);
      toast.success('CCTV request submitted!');
      fetchActivity();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit CCTV request');
      throw err;
    }
  };

  const currentUserEmail = user?.email;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Lost &amp; Found
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          Find something you've lost or help someone find theirs.
        </p>
      </div>

      <div className="rounded-[28px] p-5 sm:p-6" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            placeholder="Search lost or found items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-1"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary, ['--tw-ring-color']: ACCENT }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <FilterTabs active={typeFilter} onChange={setTypeFilter} t={t} />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: category === cat ? `${ACCENT}14` : 'transparent',
                  color: category === cat ? ACCENT : t.textMuted,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Report Lost / Found Item
        </button>
        <button
          type="button"
          onClick={() => setShowCctvModal(true)}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          <Video size={15} />
          Request CCTV
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>Recent Lost &amp; Found</h3>
        <LostFoundList
          status={status}
          items={items}
          currentUserEmail={currentUserEmail}
          claimingId={claimingId}
          onClaim={handleClaim}
          onRetry={fetchItems}
          onReport={() => setShowReportModal(true)}
          t={t}
        />
      </div>

      {activity.length > 0 && (
        <div className="rounded-[28px] p-5 sm:p-6" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
          <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>Your Activity</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activity.slice(0, 6).map((entry) => (
              <ActivityCard key={`${entry.kind}-${entry.id}`} entry={entry} t={t} />
            ))}
          </div>
        </div>
      )}

      <ReportLostItemModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} t={t} onSubmit={handleReportSubmit} />
      <CctvRequestModal isOpen={showCctvModal} onClose={() => setShowCctvModal(false)} t={t} onSubmit={handleCctvSubmit} />
    </div>
  );
};

export default LostFoundSection;