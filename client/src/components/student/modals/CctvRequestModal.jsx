import React, { useState } from 'react';
import { X, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const CctvRequestModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [form, setForm] = useState({
    location: 'Library, 2nd Floor',
    date: '2026-08-17',
    timeFrom: '10:00 AM',
    timeTo: '12:30 PM',
    reason: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      toast.error('Please provide a reason / details of the lost item');
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2 text-left">
            <Video size={20} className="text-red-600" />
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Request CCTV Security Footage
              </h3>
              <p className="text-[11px]" style={{ color: t.textMuted }}>
                Campus Security &amp; Surveillance Department
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Incident Location / Camera Zone
            </label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="Library, 2nd Floor">Library 2nd Floor (Reading Tables &amp; Racks)</option>
              <option value="Cafeteria & Canteen Area">Cafeteria &amp; Canteen Area</option>
              <option value="Block A Main Hallway & Stairs">Block A Main Hallway &amp; Stairs</option>
              <option value="Block B Ground Floor">Block B Ground Floor (Labs)</option>
              <option value="Classroom SR01 Wolves">Classroom SR01 Wolves</option>
              <option value="LT01 Main Lecture Hall">LT01 Main Lecture Hall</option>
              <option value="College Parking Area & Gate">College Parking Area &amp; Main Gate</option>
            </select>
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Incident Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold" style={{ color: t.textPrimary }}>
                Time From
              </label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM"
                value={form.timeFrom}
                onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                required
              />
            </div>

            <div>
              <label className="block font-bold" style={{ color: t.textPrimary }}>
                Time To
              </label>
              <input
                type="text"
                placeholder="e.g. 12:30 PM"
                value={form.timeTo}
                onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                className="mt-1 w-full rounded-xl border p-2.5 outline-none"
                style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>
              Reason &amp; Description of Misplaced Item
            </label>
            <textarea
              rows={2}
              placeholder="Describe your missing item, who you were with, and exact location details..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 font-bold"
              style={{ borderColor: t.border }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white shadow-xs hover:bg-red-700"
            >
              Submit CCTV Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CctvRequestModal;
