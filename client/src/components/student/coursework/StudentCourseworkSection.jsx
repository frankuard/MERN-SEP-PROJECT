import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  User,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Inbox,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import courseworkApi from '../../../api/courseworkApi';
import SubmitWorkModal from './SubmitWorkModal';

const StudentCourseworkSection = ({ t, user }) => {
  const [courseworkList, setCourseworkList] = useState([]);
  const [studentGroup, setStudentGroup] = useState(user?.group || '');
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'todo' | 'submitted' | 'graded'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [activeCoursework, setActiveCoursework] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const fetchCoursework = async () => {
    try {
      setLoading(true);
      const res = await courseworkApi.getStudentCoursework();
      setCourseworkList(res.coursework || []);
      if (res.studentGroup) setStudentGroup(res.studentGroup);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load coursework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursework();
  }, []);

  const handleOpenSubmit = (coursework) => {
    setActiveCoursework(coursework);
    setSubmitModalOpen(true);
  };

  const handleSubmitWork = async (courseworkId, payload) => {
    await courseworkApi.submitCoursework(courseworkId, payload);
    fetchCoursework();
  };

  // Metrics
  const totalCount = courseworkList.length;
  const submittedCount = courseworkList.filter((c) => c.hasSubmitted).length;
  const gradedCount = courseworkList.filter((c) => c.mySubmission?.status === 'graded').length;
  const pendingCount = totalCount - submittedCount;

  // Filtered
  const filteredList = courseworkList.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      c.moduleCode.toLowerCase().includes(q) ||
      c.moduleName.toLowerCase().includes(q) ||
      c.teacherName.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'todo') return !c.hasSubmitted;
    if (statusFilter === 'submitted') return c.hasSubmitted && c.mySubmission?.status !== 'graded';
    if (statusFilter === 'graded') return c.mySubmission?.status === 'graded';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <section
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
        style={{
          backgroundColor: t.cardBg,
          boxShadow: t.shadowCard,
          border: `1px solid ${t.border}`,
        }}
      >
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: t.textPrimary }}>
              My Coursework & Assignments
            </h1>
          </div>

          {/* Group Badge */}
          <div
            className="flex flex-col justify-center rounded-2xl border px-5 py-3 shrink-0"
            style={{ backgroundColor: t.pageBg, borderColor: t.border }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
              Your Cohort Group
            </p>
            <p className="text-base font-extrabold mt-0.5" style={{ color: t.textPrimary }}>
              {studentGroup || 'No Group Assigned'}
            </p>
          </div>
        </div>
      </section>


      {/* KPI Counters */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Coursework',
            value: totalCount,
            icon: BookMarked,
            tint: t.pastelBlue || '#dbeafe',
            color: '#1e40af',
          },
          {
            label: 'To Submit',
            value: pendingCount,
            icon: Clock,
            tint: t.pastelYellow || '#fef9c3',
            color: '#854d0e',
          },
          {
            label: 'Submitted',
            value: submittedCount,
            icon: CheckCircle2,
            tint: t.pastelPurple || '#ede9fe',
            color: '#6b21a8',
          },
          {
            label: 'Graded',
            value: gradedCount,
            icon: Sparkles,
            tint: t.pastelPink || '#fce7f3',
            color: '#9d174d',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="dashboard-card-lift flex flex-col justify-between rounded-[24px] border p-5"
              style={{
                backgroundColor: t.cardBg,
                borderColor: t.border,
                boxShadow: t.shadowSoft,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  {kpi.label}
                </span>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: kpi.tint, color: kpi.color }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black sm:text-3xl" style={{ color: t.textPrimary }}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border p-4"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          boxShadow: t.shadowSoft,
        }}
      >
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'todo', label: 'To Do', count: pendingCount },
            { key: 'submitted', label: 'Submitted', count: submittedCount - gradedCount },
            { key: 'graded', label: 'Graded', count: gradedCount },
          ].map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => setStatusFilter(pill.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive ? t.textPrimary : t.pageBg,
                  color: isActive ? t.cardBg : t.textPrimary,
                }}
              >
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span
                    className="rounded-full px-1.5 py-0.2 text-[10px] font-extrabold"
                    style={{
                      backgroundColor: isActive ? t.cardBg : t.cardBg,
                      color: isActive ? t.textPrimary : t.textMuted,
                    }}
                  >
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />
          <input
            type="text"
            placeholder="Search module or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border py-1.5 pl-8 pr-3 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Coursework Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-sm" style={{ color: t.textMuted }}>
          <Loader2 size={32} className="animate-spin mb-3" />
          <p>Loading coursework for cohort {studentGroup}...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[28px] border p-12 text-center"
          style={{
            backgroundColor: t.cardBg,
            borderColor: t.border,
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl mb-4"
            style={{ backgroundColor: t.pageBg, color: t.textMuted }}
          >
            <BookMarked size={28} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
            No Coursework
          </h3>
          <p className="mt-1 text-xs max-w-sm" style={{ color: t.textMuted }}>
            {courseworkList.length === 0
              ? `No coursework has been assigned to cohort ${studentGroup || 'your group'} yet. Check back later!`
              : 'No coursework matches your current filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredList.map((coursework) => {
            const hasSubmitted = coursework.hasSubmitted;
            const isGraded = coursework.mySubmission?.status === 'graded';
            const isPastDue = coursework.isPastDue;
            const sub = coursework.mySubmission;

            return (
              <div
                key={coursework._id}
                className="dashboard-card-lift flex flex-col justify-between rounded-[28px] border p-6 transition-all"
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.border,
                  boxShadow: t.shadowSoft,
                }}
              >
                <div>
                  {/* Card Header Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: t.pastelBlue || '#dbeafe',
                        color: '#1e40af',
                      }}
                    >
                      {coursework.moduleCode}
                    </span>

                    {/* Status Badge */}
                    {isGraded ? (
                      <span
                        className="rounded-lg px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: t.pageBg,
                          color: t.textPrimary,
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        {sub.grade}/{coursework.totalMarks}
                      </span>
                    ) : hasSubmitted ? (
                      <span className="flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        <Check size={12} />
                        Submitted
                      </span>
                    ) : isPastDue ? (
                      <span className="rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        Overdue
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Title & Teacher */}
                  <h3 className="mt-3 text-base font-bold leading-snug line-clamp-2" style={{ color: t.textPrimary }}>
                    {coursework.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
                    <User size={13} />
                    <span>Assigned by {coursework.teacherName}</span>
                  </p>

                  {/* Description snippet */}
                  <p className="mt-2 text-xs leading-relaxed line-clamp-3" style={{ color: t.textSecondary }}>
                    {coursework.description}
                  </p>

                  {/* Attached Briefs */}
                  {coursework.attachments && coursework.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {coursework.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold hover:opacity-80"
                          style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
                        >
                          <FileText size={11} className="text-emerald-500" />
                          <span className="truncate max-w-[120px]">{att.name}</span>
                          <ExternalLink size={9} style={{ color: t.textMuted }} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Due Date & Marks bar */}
                  <div
                    className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: isPastDue ? '#ef4444' : t.textMuted }} />
                      <span className="font-semibold" style={{ color: isPastDue ? '#ef4444' : t.textPrimary }}>
                        Due {new Date(coursework.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span className="font-bold" style={{ color: t.textMuted }}>
                      {coursework.totalMarks} Marks
                    </span>
                  </div>

                  {/* Feedback preview if graded */}
                  {isGraded && sub?.feedback && (
                    <div
                      className="mt-3 rounded-xl border p-2.5 text-xs"
                      style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                    >
                      <p className="font-semibold text-[11px]" style={{ color: t.textMuted }}>
                        Teacher Feedback:
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed line-clamp-3" style={{ color: t.textPrimary }}>
                        {sub.feedback}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="mt-5 pt-4 border-t" style={{ borderColor: t.border }}>
                  <button
                    type="button"
                    onClick={() => handleOpenSubmit(coursework)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold shadow transition-all active:scale-95 hover:opacity-90"
                    style={{
                      backgroundColor: hasSubmitted ? t.pageBg : t.textPrimary,
                      color: hasSubmitted ? t.textPrimary : t.cardBg,
                      border: hasSubmitted ? `1px solid ${t.border}` : 'none',
                    }}
                  >
                    <span>{isGraded ? 'View Submission & Grade' : hasSubmitted ? 'Edit Submission' : 'Turn In Assignment'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      <SubmitWorkModal
        t={t}
        isOpen={submitModalOpen}
        coursework={activeCoursework}
        onClose={() => {
          setSubmitModalOpen(false);
          setActiveCoursework(null);
        }}
        onSubmitWork={handleSubmitWork}
      />
    </div>
  );
};

export default StudentCourseworkSection;
