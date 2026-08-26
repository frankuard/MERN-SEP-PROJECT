import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestAttendanceReportModal = ({ isOpen, onClose, onSubmit, t, studentName, userEmail, studentInfo }) => {
  const [semester, setSemester] = useState('');
  const [reportType, setReportType] = useState('Full Official Attendance Transcript');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for this request');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        reason: reason.trim(),
        semester: semester.trim(),
        reportType,
      });
      toast.success('Attendance report request submitted to SSD', { icon: '📋' });
      setReason('');
      setSemester('');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: t.chipBg }}>
              <FileText size={16} style={{ color: t.textPrimary }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                Request Attendance Report
              </h3>
              <p className="text-xs" style={{ color: t.textMuted }}>Student Services Department</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        {/* Student info — separate, clearly-labeled card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border p-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: t.chipBg }}>
            <User size={16} style={{ color: t.textMuted }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{studentName || 'Student'}</p>
            <p className="truncate text-xs" style={{ color: t.textMuted }}>{userEmail}</p>
            {studentInfo?.department && (
              <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>
                {studentInfo.department}{studentInfo?.semester ? ` · Semester ${studentInfo.semester}` : ''}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
              Semester / Term (optional)
            </label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Semester 2, or leave blank for current"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            >
              <option value="Full Official Attendance Transcript">Full Attendance Transcript</option>
              <option value="Module-wise Attendance Summary">Module-wise Breakdown</option>
              <option value="SSD Exemption & Leave Certified Sheet">Exemption &amp; Leave Certified Sheet</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
              Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Scholarship renewal, visa verification..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-50"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: t.accentPrimary }}
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestAttendanceReportModal;