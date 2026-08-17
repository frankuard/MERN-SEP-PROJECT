import React, { useState } from 'react';
import { Search, Video, MapPin, Clock, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import lostFoundApi from '../../api/lostFoundApi';
import CctvRequestModal from './modals/CctvRequestModal';
import ReportLostItemModal from './modals/ReportLostItemModal';

const LostFoundSection = ({
  t,
  lostFoundItems,
  setLostFoundItems,
  cctvRequests,
  setCctvRequests,
}) => {
  const [showCctvModal, setShowCctvModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleAddLostItem = async (form) => {
    const newItem = await lostFoundApi.reportItem(form);
    setLostFoundItems((prev) => [newItem, ...prev]);
    toast.success('Lost item report posted successfully!');
  };

  const handleClaimItem = async (itemId) => {
    await lostFoundApi.claimItem(itemId);
    setLostFoundItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: 'Claimed' } : item))
    );
    toast.success('Item status marked as Claimed!');
  };

  const handleCctvSubmit = async (formData) => {
    const newReq = await lostFoundApi.submitCctvRequest(formData);
    setCctvRequests((prev) => [newReq, ...prev]);
    toast.success(`CCTV Footage Request #${newReq.id} submitted to Campus Security!`, { icon: '📹' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
            onClick={() => setShowCctvModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 text-xs font-bold text-red-700 dark:text-red-300 shadow-xs hover:bg-red-100 transition-all"
          >
            <Video size={14} className="text-red-600" />
            Request CCTV Footage
          </button>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="rounded-xl bg-[#2f4336] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
          >
            + Report Lost Item
          </button>
        </div>
      </div>

      {/* CCTV Requests Banner */}
      {cctvRequests.length > 0 && (
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
              Security Desk Review
            </span>
          </div>

          <div className="space-y-2.5">
            {cctvRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center"
                style={{ backgroundColor: t.pageBg, borderColor: t.border }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: t.textPrimary }}>
                      {req.location}
                    </span>
                    <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
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

                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 self-start sm:self-center">
                  ⏳ {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lostFoundItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
            style={{
              backgroundColor: t.cardBg || '#ffffff',
              borderColor: t.border,
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  {item.title}
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    item.status === 'Claimed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs" style={{ color: t.textMuted }}>
                <p className="flex items-center gap-1.5">
                  <MapPin size={13} /> {item.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={13} /> Reported: {item.time}
                </p>
                <p className="flex items-center gap-1.5">
                  <Tag size={13} /> Category: {item.category}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t pt-3" style={{ borderColor: t.border }}>
              {item.status === 'Unclaimed' ? (
                <button
                  type="button"
                  onClick={() => handleClaimItem(item.id)}
                  className="w-full rounded-xl bg-[#2f4336] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
                >
                  Claim this Item
                </button>
              ) : (
                <div className="text-center text-xs font-semibold text-emerald-600">
                  Claimed &amp; Returned
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
