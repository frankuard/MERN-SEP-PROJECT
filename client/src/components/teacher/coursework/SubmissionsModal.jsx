import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  AlertCircle,
  UserCheck,
  UserX,
  Search,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import courseworkApi from '../../../api/courseworkApi';

const SubmissionsModal = ({ t, isOpen, onClose, coursework, onGradeUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState('submitted');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Grading states: { [submissionId]: { grade: number|string, feedback: string, saving: boolean } }
  const [gradingState, setGradingState] = useState({});

  const fetchSubmissions = async () => {
    if (!coursework?._id) return;
    try {
      setLoading(true);
      const res = await courseworkApi.getSubmissions(coursework._id);
      setData(res);

      // Pre-fill grading state
      const initial = {};
      (res.submissions || []).forEach((s) => {
        initial[s._id] = {
          grade: s.grade !== null && s.grade !== undefined ? s.grade : '',
          feedback: s.feedback || '',
          saving: false,
        };
      });
      setGradingState(initial);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && coursework?._id) {
      fetchSubmissions();
    }
  }, [isOpen, coursework]);

  if (!isOpen || !coursework) return null;

  const handleSaveGrade = async (submissionId) => {
    const current = gradingState[submissionId];
    if (!current || current.grade === '' || current.grade === undefined) {
      return toast.error('Please enter a grade');
    }

    try {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: true },
      }));

      await courseworkApi.gradeSubmission(submissionId, {
        grade: Number(current.grade),
        feedback: current.feedback,
      });

      toast.success('Grade & feedback saved!');
      if (onGradeUpdated) onGradeUpdated();
      fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false },
      }));
    }
  };

  const submissions = data?.submissions || [];
  const missingStudents = data?.missingStudents || [];

  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.studentName || '').toLowerCase().includes(q) ||
      (s.studentEmail || '').toLowerCase().includes(q)
    );
  });

  const filteredMissing = missingStudents.filter((st) => {
    const q = searchQuery.toLowerCase();
    return (
      (st.username || '').toLowerCase().includes(q) ||
      (st.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          color: t.textPrimary,
        }}
      >
        {/* Modal Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5"
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
              <span
                className="rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                Cohort {coursework.targetGroup}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold sm:text-xl">{coursework.title}</h3>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              Due {new Date(coursework.dueDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} · Max {coursework.totalMarks} Marks
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

        {/* Tab & Search Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
          style={{ borderColor: t.border, backgroundColor: t.pageBg }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('submitted')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab === 'submitted'
                  ? 'shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeSubTab === 'submitted' ? t.cardBg : 'transparent',
                color: activeSubTab === 'submitted' ? t.textPrimary : t.textMuted,
              }}
            >
              <UserCheck size={14} className="text-emerald-500" />
              <span>Submitted ({submissions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('missing')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeSubTab === 'missing'
                  ? 'shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeSubTab === 'missing' ? t.cardBg : 'transparent',
                color: activeSubTab === 'missing' ? t.textPrimary : t.textMuted,
              }}
            >
              <UserX size={14} className="text-amber-500" />
              <span>Not Submitted ({missingStudents.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: t.textMuted }}
            />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: t.cardBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
            />
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm" style={{ color: t.textMuted }}>
              <Loader2 size={28} className="animate-spin mb-2" />
              <p>Loading submissions...</p>
            </div>
          ) : activeSubTab === 'submitted' ? (
            filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs" style={{ color: t.textMuted }}>
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="font-semibold text-sm">No submissions found</p>
                <p className="mt-1">
                  {submissions.length === 0
                    ? 'No students in this group have submitted their work yet.'
                    : 'No submissions match your search query.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => {
                  const state = gradingState[sub._id] || { grade: '', feedback: '', saving: false };
                  const isGraded = sub.status === 'graded';
                  const isLate = sub.status === 'late';

                  return (
                    <div
                      key={sub._id}
                      className="rounded-2xl border p-5 transition-all shadow-sm"
                      style={{
                        backgroundColor: t.pageBg,
                        borderColor: isGraded ? 'rgba(34, 197, 94, 0.3)' : t.border,
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold uppercase text-xs"
                            style={{
                              backgroundColor: t.pastelPurple || '#ede9fe',
                              color: '#6b21a8',
                            }}
                          >
                            {sub.studentName?.slice(0, 2) || 'ST'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm" style={{ color: t.textPrimary }}>
                                {sub.studentName}
                              </h4>
                              {isLate && (
                                <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  LATE
                                </span>
                              )}
                              {isGraded ? (
                                <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={11} />
                                  GRADED ({sub.grade}/{coursework.totalMarks})
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                  <Clock size={11} />
                                  PENDING REVIEW
                                </span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: t.textMuted }}>
                              {sub.studentEmail} · Submitted{' '}
                              {new Date(sub.submittedAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Submission Content Text */}
                      {sub.submissionText && (
                        <div
                          className="mt-3 rounded-xl border p-3 text-xs leading-relaxed"
                          style={{
                            backgroundColor: t.cardBg,
                            borderColor: t.border,
                            color: t.textSecondary,
                          }}
                        >
                          <p className="font-bold text-[11px] uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
                            Student Notes / Remarks:
                          </p>
                          <p className="whitespace-pre-wrap">{sub.submissionText}</p>
                        </div>
                      )}

                      {/* Submission Attachments */}
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="font-bold text-[11px] uppercase tracking-wider" style={{ color: t.textMuted }}>
                            Submitted Files:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sub.attachments.map((att, attIdx) => (
                              <a
                                key={attIdx}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{
                                  backgroundColor: t.cardBg,
                                  borderColor: t.border,
                                  color: t.textPrimary,
                                }}
                              >
                                <FileText size={14} className="text-emerald-500" />
                                <span className="max-w-[200px] truncate">{att.name}</span>
                                <ExternalLink size={12} style={{ color: t.textMuted }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grading Form */}
                      <div className="mt-4 pt-3 border-t grid grid-cols-1 gap-3 sm:grid-cols-4 items-end" style={{ borderColor: t.border }}>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
                            Grade (out of {coursework.totalMarks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={coursework.totalMarks}
                            placeholder="e.g. 85"
                            value={state.grade}
                            onChange={(e) =>
                              setGradingState((prev) => ({
                                ...prev,
                                [sub._id]: { ...prev[sub._id], grade: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none"
                            style={{
                              backgroundColor: t.cardBg,
                              borderColor: t.border,
                              color: t.textPrimary,
                            }}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>
                            Teacher Feedback
                          </label>
                          <input
                            type="text"
                            placeholder="Constructive feedback for the student..."
                            value={state.feedback}
                            onChange={(e) =>
                              setGradingState((prev) => ({
                                ...prev,
                                [sub._id]: { ...prev[sub._id], feedback: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border px-3 py-1.5 text-xs font-medium focus:outline-none"
                            style={{
                              backgroundColor: t.cardBg,
                              borderColor: t.border,
                              color: t.textPrimary,
                            }}
                          />
                        </div>

                        <div>
                          <button
                            type="button"
                            disabled={state.saving}
                            onClick={() => handleSaveGrade(sub._id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow transition-transform active:scale-95 disabled:opacity-50"
                            style={{
                              backgroundColor: t.textPrimary,
                              color: t.cardBg,
                            }}
                          >
                            {state.saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            <span>{isGraded ? 'Update Grade' : 'Save Grade'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Missing Students Tab
            filteredMissing.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-xs" style={{ color: t.textMuted }}>
                <CheckCircle2 size={32} className="mb-2 text-emerald-500" />
                <p className="font-semibold text-sm">Everyone has submitted!</p>
                <p className="mt-1">All enrolled students in cohort {coursework.targetGroup} have turned in their coursework.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredMissing.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center justify-between rounded-2xl border p-4 text-xs shadow-sm"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full font-bold uppercase text-xs"
                        style={{
                          backgroundColor: t.pastelYellow || '#fef9c3',
                          color: '#854d0e',
                        }}
                      >
                        {st.username?.slice(0, 2) || 'ST'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: t.textPrimary }}>
                          {st.username}
                        </h4>
                        <p style={{ color: t.textMuted }}>{st.email}</p>
                      </div>
                    </div>
                    <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Unsubmitted
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between border-t px-6 py-4"
          style={{ borderColor: t.border }}
        >
          <div className="text-xs font-semibold" style={{ color: t.textMuted }}>
            Cohort Enrollment: {data?.stats?.totalEnrolled || 0} Students · Submitted: {submissions.length} · Graded: {data?.stats?.gradedCount || 0}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-bold transition-colors hover:opacity-80"
            style={{ backgroundColor: t.pageBg, color: t.textPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsModal;
