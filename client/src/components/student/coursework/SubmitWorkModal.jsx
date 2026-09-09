import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import uploadApi from '../../../api/uploadApi';

const SubmitWorkModal = ({ t, isOpen, onClose, coursework, onSubmitWork }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (coursework?.mySubmission) {
      setSubmissionText(coursework.mySubmission.submissionText || '');
      setAttachments(coursework.mySubmission.attachments || []);
    } else {
      setSubmissionText('');
      setAttachments([]);
    }
  }, [coursework, isOpen]);

  if (!isOpen || !coursework) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const res = await uploadApi.uploadDocument(file, 'coursework');
      const newAtt = {
        name: res.name || file.name,
        url: res.url,
        fileType: file.type || 'application/octet-stream',
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAtt]);
      toast.success(`Attached ${file.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && attachments.length === 0) {
      return toast.error('Please write notes or upload at least one file');
    }

    try {
      setSubmitting(true);
      await onSubmitWork(coursework._id, {
        submissionText,
        attachments,
      });
      toast.success(coursework.mySubmission ? 'Submission updated!' : 'Coursework submitted successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit coursework');
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDue = new Date() > new Date(coursework.dueDate);
  const isGraded = coursework.mySubmission?.status === 'graded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: t.border }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: t.pageBg, color: t.textMuted }}
              >
                {coursework.moduleCode}
              </span>
              <span className="rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Cohort {coursework.targetGroup}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold sm:text-xl">
              {coursework.mySubmission ? 'Edit Submission' : 'Submit Coursework'}
            </h3>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              Due {new Date(coursework.dueDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: t.pageBg, color: t.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Late Notice */}
          {isPastDue && (
            <div className="flex items-center gap-3 rounded-2xl p-4 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} className="shrink-0" />
              <span>
                The due date for this assignment has passed. Your submission will be marked as <strong>Late</strong>.
              </span>
            </div>
          )}

          {/* Graded Notice */}
          {isGraded && (
            <div
              className="rounded-2xl p-4 border text-xs space-y-2"
              style={{ backgroundColor: t.pageBg, borderColor: t.border }}
            >
              <div className="flex items-center justify-between font-semibold" style={{ color: t.textPrimary }}>
                <span>Graded by {coursework.teacherName}</span>
                <span className="font-bold text-sm" style={{ color: t.textPrimary }}>
                  {coursework.mySubmission.grade}/{coursework.totalMarks}
                </span>
              </div>
              {coursework.mySubmission.feedback && (
                <div className="pt-2 border-t" style={{ borderColor: t.border }}>
                  <p className="text-[11px] font-medium" style={{ color: t.textMuted }}>Teacher Feedback:</p>
                  <p className="mt-0.5 text-xs leading-relaxed" style={{ color: t.textPrimary }}>
                    {coursework.mySubmission.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Coursework Details summary */}
          <div className="rounded-2xl border p-4 text-xs space-y-1.5" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
            <h4 className="font-bold text-sm" style={{ color: t.textPrimary }}>
              {coursework.title}
            </h4>
            <p className="whitespace-pre-wrap leading-relaxed" style={{ color: t.textSecondary }}>
              {coursework.description}
            </p>
            {coursework.attachments && coursework.attachments.length > 0 && (
              <div className="pt-2">
                <p className="font-bold text-[11px] uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
                  Coursework Brief & Materials:
                </p>
                <div className="flex flex-wrap gap-2">
                  {coursework.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold hover:opacity-80"
                      style={{ backgroundColor: t.cardBg, borderColor: t.border }}
                    >
                      <FileText size={12} className="text-emerald-500" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <ExternalLink size={10} style={{ color: t.textMuted }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Response Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
              Your Response / Explanatory Notes
            </label>
            <textarea
              rows={4}
              placeholder="Describe your solution, repository links, or any comments for your teacher..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              className="w-full rounded-xl border p-3.5 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
            />
          </div>

          {/* File Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Attach Files (PDF, Code, Docx, Zip, Images)
              </label>
              <label
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80 border"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              >
                {uploadingFile ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border p-2.5 text-xs"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-emerald-500" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-semibold underline hover:opacity-80"
                      >
                        {att.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="ml-2 text-rose-500 hover:opacity-80"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: t.textMuted }}>
                No files uploaded yet.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: t.border }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold transition-colors hover:opacity-80"
              style={{ backgroundColor: t.pageBg, color: t.textMuted }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: t.textPrimary,
                color: t.cardBg,
              }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              <span>{coursework.mySubmission ? 'Update Submission' : 'Turn In Work'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitWorkModal;
