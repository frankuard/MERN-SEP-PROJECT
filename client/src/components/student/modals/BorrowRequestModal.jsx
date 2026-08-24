import { useState } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ACCENT = '#5c8a72';

const BorrowRequestModal = ({ isOpen, onClose, t, book, onSubmit }) => {
  const [returnBy, setReturnBy] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !book) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  const resetAndClose = () => {
    setReturnBy('');
    setStudentId('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!returnBy) {
      toast.error('Please choose a return date');
      return;
    }
    if (!studentId.trim()) {
      toast.error('Please enter your student ID');
      return;
    }
    if (returnBy <= todayStr) {
      toast.error('Return date must be after today');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ returnBy, studentId: studentId.trim() });
      resetAndClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-sm rounded-[28px] border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: ACCENT }}>
              <BookOpen size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Request to Borrow</h3>
              <p className="truncate text-xs font-semibold" style={{ color: t.textMuted, maxWidth: '220px' }}>{book.name}</p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>When will you return it?</label>
            <input
              type="date"
              min={todayStr}
              value={returnBy}
              onChange={(e) => setReturnBy(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Your Student ID</label>
            <input
              type="text"
              placeholder="e.g. BIC-2026-0142"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="cursor-pointer rounded-xl border px-4 py-2.5 font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowRequestModal;