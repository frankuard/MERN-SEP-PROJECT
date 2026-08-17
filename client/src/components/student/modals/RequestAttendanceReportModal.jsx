import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestAttendanceReportModal = ({ isOpen, onClose, t, studentName, userEmail }) => {
  const [semester, setSemester] = useState('5th Semester (Spring 2026)');
  const [reportType, setReportType] = useState('Full Official Attendance Transcript');
  const [reason, setReason] = useState('Scholarship & Visa Verification');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      toast.success('Official Attendance Report request submitted to SSD! You will receive a copy via email within 24 hours.', {
        icon: '📋',
        duration: 5000,
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2 text-left">
            <FileText size={20} className="text-blue-600" />
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Request Official Attendance Report
              </h3>
              <p className="text-[11px]" style={{ color: t.textMuted }}>
                Student Services Department (SSD) · Room 102
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
            <label className="block font-bold mb-1" style={{ color: t.textPrimary }}>
              Student Information
            </label>
            <div className="rounded-xl border p-3 bg-black/5 dark:bg-white/5" style={{ borderColor: t.border }}>
              <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{studentName || 'Suraj Poddar'}</p>
              <p className="text-[11px]" style={{ color: t.textMuted }}>{userEmail || 'suraj.student@campus.edu'} · Student ID: BIC-2024-884</p>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1" style={{ color: t.textPrimary }}>
              Academic Semester / Term
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full rounded-xl border p-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="5th Semester (Spring 2026)">5th Semester (Spring 2026) — Current</option>
              <option value="4th Semester (Fall 2025)">4th Semester (Fall 2025)</option>
              <option value="3rd Semester (Spring 2025)">3rd Semester (Spring 2025)</option>
              <option value="All Semesters Aggregate">All Semesters (Cumulative Record)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1" style={{ color: t.textPrimary }}>
              Report Type Format
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border p-2.5 outline-none font-semibold"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            >
              <option value="Full Official Attendance Transcript">Full Official Attendance Transcript (Signed PDF)</option>
              <option value="Module-wise Attendance Summary">Module-wise Attendance Breakdown</option>
              <option value="SSD Exemption & Leave Certified Sheet">SSD Exemption &amp; Leave Certified Sheet</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1" style={{ color: t.textPrimary }}>
              Purpose / Reason of Request
            </label>
            <input
              type="text"
              placeholder="e.g. Scholarship renewal, Visa verification, Medical leave review..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border p-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 text-[11px] text-blue-900 dark:text-blue-300">
            ℹ️ Digital certified report will be generated and signed by SSD In-Charge within 24 working hours.
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#2f4336] px-5 py-2.5 font-bold text-white shadow-xs hover:bg-[#25362b] disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request to SSD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestAttendanceReportModal;
