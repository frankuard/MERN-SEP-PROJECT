import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Video, MapPin, Clock, Tag, Filter, CheckCircle2,
  AlertCircle, RefreshCw, Layers, ShieldCheck, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import lostFoundApi from '../../api/lostFoundApi';
import CctvRequestModal from './modals/CctvRequestModal';
import ReportLostItemModal from './modals/ReportLostItemModal';

const CATEGORIES = ['All', 'Bags', 'Electronics', 'Keys', 'Books', 'General'];
const STATUS_OPTIONS = ['All', 'Unclaimed', 'Claimed', 'Returned'];

const LostFoundSection = ({
  t,
  lostFoundItems: initialItems = [],
  setLostFoundItems: setParentItems,
  cctvRequests: initialCctv = [],
  setCctvRequests: setParentCctv,
}) => {
  const [items, setItems] = useState(initialItems);
  const [cctvList, setCctvList] = useState(initialCctv);
  const [loading, setLoading] = useState(false);
  const [cctvLoading, setCctvLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [showCctvModal, setShowCctvModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // 1. Fetch live items from MongoDB
  const fetchItemsFromDb = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await lostFoundApi.getItems(params);
      setItems(data);
      if (setParentItems) setParentItems(data);
    } catch (err) {
      console.error('Failed to load lost & found items:', err);
      toast.error('Could not connect to MongoDB. Using cached data.');
    } finally {
      setLoading(false);
    }
  }, [setParentItems]);

  // 2. Fetch live CCTV requests from MongoDB
  const fetchCctvFromDb = useCallback(async () => {
    setCctvLoading(true);
    try {
      const data = await lostFoundApi.getMyCctvRequests();
      setCctvList(data);
      if (setParentCctv) setParentCctv(data);
    } catch (err) {
      console.error('Failed to load CCTV requests:', err);
    } finally {
      setCctvLoading(false);
    }
  }, [setParentCctv]);

  // Load from MongoDB on component mount
  useEffect(() => {
    fetchItemsFromDb();
    fetchCctvFromDb();
  }, [fetchItemsFromDb, fetchCctvFromDb]);

  // 3. Handle Add Lost Item -> MongoDB
  const handleAddLostItem = async (form) => {
    try {
      const newItem = await lostFoundApi.reportItem(form);
      setItems((prev) => [newItem, ...prev]);
      if (setParentItems) setParentItems((prev) => [newItem, ...prev]);
      toast.success('Lost item report added successfully!', { icon: '📦' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save item report';
      toast.error(msg);
    }
  };

  // 4. Handle Claim Item -> MongoDB
  const handleClaimItem = async (itemId) => {
    try {
      const updatedItem = await lostFoundApi.claimItem(itemId, {
        details: 'Claimed by logged-in student as rightful owner.',
      });

      setItems((prev) =>
        prev.map((item) => (item.id === itemId || item._id === itemId ? updatedItem : item))
      );
      if (setParentItems) {
        setParentItems((prev) =>
          prev.map((item) => (item.id === itemId || item._id === itemId ? updatedItem : item))
        );
      }
      toast.success('Item claimed successfully! Claim recorded.', { icon: '✅' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to claim item';
      toast.error(msg);
    }
  };

  // 5. Handle CCTV Request Submit -> MongoDB
  const handleCctvSubmit = async (formData) => {
    try {
      const newReq = await lostFoundApi.submitCctvRequest(formData);
      setCctvList((prev) => [newReq, ...prev]);
      if (setParentCctv) setParentCctv((prev) => [newReq, ...prev]);
      toast.success(`CCTV Footage Request #${newReq.id?.slice(-4) || 'New'} saved`, { icon: '📹' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit CCTV request';
      toast.error(msg);
    }
  };

  // Filtered Items (Client-side fast search across loaded MongoDB records)
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate live statistics from MongoDB data
  const totalCount = items.length;
  const unclaimedCount = items.filter((i) => i.status === 'Unclaimed' || i.status === 'open').length;
  const claimedCount = items.filter((i) => i.status === 'Claimed' || i.status === 'Claim Pending').length;
  const returnedCount = items.filter((i) => i.status === 'Returned' || i.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Search className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Lost &amp; Found Portal
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
            Report misplaced belongings, claim found items, and request official CCTV security footage review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => {
              fetchItemsFromDb();
              fetchCctvFromDb();
            }}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            style={{ borderColor: t.border, color: t.textPrimary }}
            title="Refresh  Data"
          >
            <RefreshCw size={13} className={loading || cctvLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCctvModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 text-xs font-bold text-red-700 dark:text-red-300 shadow-xs hover:bg-red-100 transition-all"
          >
            <Video size={14} className="text-red-600" />
            Request CCTV Footage
          </button>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b] transition-all"
          >
            + Report Lost Item
          </button>
        </div>
      </div>

      {/* Live MongoDB Statistics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          className="rounded-2xl border p-4 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
              Total Items
            </span>
            <Layers size={15} className="text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold" style={{ color: t.textPrimary }}>
            {totalCount}
          </p>
        </div>

        <div
          className="rounded-2xl border p-4 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Unclaimed
            </span>
            <AlertCircle size={15} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">
            {unclaimedCount}
          </p>
        </div>

        <div
          className="rounded-2xl border p-4 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Claimed
            </span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {claimedCount}
          </p>
        </div>

        <div
          className="rounded-2xl border p-4 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
              CCTV Requests
            </span>
            <ShieldCheck size={15} className="text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-red-600">
            {cctvList.length}
          </p>
        </div>
      </div>

      {/* CCTV Requests Banner */}
      {cctvList.length > 0 && (
        <div
          className="rounded-3xl border p-5 shadow-xs"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: t.border }}>
            <div className="flex items-center gap-2">
              <Video size={18} className="text-red-600" />
              <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                My CCTV Footage Verification Requests
              </h3>
            </div>
            <span className="text-xs font-semibold" style={{ color: t.textMuted }}>
              Campus Security Review ({cctvList.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {cctvList.map((req) => (
              <div
                key={req.id || req._id}
                className="flex flex-col justify-between gap-2 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: t.textPrimary }}>
                      {req.location}
                    </span>
                    <span className="rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                      {req.date}
                    </span>
                    <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-bold" style={{ color: t.textMuted }}>
                      {req.timeFrom} – {req.timeTo}
                    </span>
                  </div>
                  <p style={{ color: t.textMuted }}>
                    Reason: {req.reason}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold self-start sm:self-center ${
                    req.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : req.status === 'Rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  ⏳ {req.status || 'In Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div
        className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name, location, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2f4336] text-white shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={{
                color: selectedCategory === cat ? '#ffffff' : t.textMuted,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw size={28} className="animate-spin text-emerald-600 mb-2" />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
            Loading Lost &amp; Found items from MongoDB...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-3xl border p-12 text-center"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <Search size={36} className="text-slate-400 mb-3" />
          <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>
            No Lost &amp; Found Items Found
          </h4>
          <p className="mt-1 max-w-sm text-xs" style={{ color: t.textMuted }}>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search query or filter categories.'
              : 'No items have been reported yet. Click "+ Report Lost Item" to post one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const itemId = item.id || item._id;
            const isClaimed = item.status === 'Claimed' || item.status === 'Returned' || item.status === 'resolved';

            return (
              <div
                key={itemId}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                style={{
                  backgroundColor: t.cardBg || '#ffffff',
                  borderColor: t.border,
                }}
              >
                <div>
                  {item.image && (
                    <div className="relative -mx-5 -mt-5 mb-4 h-44 overflow-hidden bg-slate-100 dark:bg-zinc-900">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold truncate" style={{ color: t.textPrimary }}>
                      {item.title}
                    </h4>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                        isClaimed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.status || 'Unclaimed'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-xs line-clamp-2" style={{ color: t.textMuted }}>
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-1 text-xs" style={{ color: t.textMuted }}>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span>Reported: {item.time || new Date(item.createdAt).toLocaleDateString()}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Tag size={13} className="text-slate-400 shrink-0" />
                      <span>Category: {item.category}</span>
                    </p>
                    {item.authorName && (
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span>By: {item.authorName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t pt-3" style={{ borderColor: t.border }}>
                  {!isClaimed ? (
                    <button
                      type="button"
                      onClick={() => handleClaimItem(itemId)}
                      className="w-full rounded-xl bg-[#2f4336] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b] transition-all"
                    >
                      Claim this Item
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span>
                        {item.status === 'Returned' ? 'Claimed & Returned' : `Claimed${item.claimantName ? ` by ${item.claimantName}` : ''}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lost & Found Modals */}
      <CctvRequestModal
        isOpen={showCctvModal}
        onClose={() => setShowCctvModal(false)}
        t={t}
        onSubmit={handleCctvSubmit}
      />

      <ReportLostItemModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        t={t}
        onSubmit={handleAddLostItem}
      />
    </div>
  );
};

export default LostFoundSection;
