import { useState } from 'react';
import { X, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ACCENT = '#2f4336';

const CctvRequestModal = ({ isOpen, onClose, t, onSubmit }) => {
  const [form, setForm] = useState({
    location: 'Library, 2nd Floor',
    date: '',
    timeFrom: '',
    timeTo: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.timeFrom.trim() || !form.timeTo.trim() || !form.reason.trim()) {
      toast.error('Please fill in date, time range, and reason');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      // parent already toasts the error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-[28px] border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2">
            <Video size={18} style={{ color: ACCENT }} />
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Request CCTV Footage</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Incident Location / Camera Zone</label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="Library, 2nd Floor">Library 2nd Floor</option>
              <option value="Cafeteria & Canteen Area">Cafeteria &amp; Canteen Area</option>
              <option value="Block A Main Hallway & Stairs">Block A Main Hallway &amp; Stairs</option>
              <option value="Block B Ground Floor">Block B Ground Floor</option>
              <option value="College Parking Area & Gate">College Parking Area &amp; Main Gate</option>
            </select>
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Incident Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold" style={{ color: t.textPrimary }}>Time From</label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={form.timeFrom}
                onChange={(e) => setForm({ ...form, timeFrom: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
                style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                required
              />
            </div>
            <div>
              <label className="block font-bold" style={{ color: t.textPrimary }}>Time To</label>
              <input
                type="text"
                placeholder="12:30 PM"
                value={form.timeTo}
                onChange={(e) => setForm({ ...form, timeTo: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
                style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Reason &amp; Item Details</label>
            <textarea
              rows={3}
              placeholder="Describe your missing item and exact location details..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit CCTV Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CctvRequestModal;