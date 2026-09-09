import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit2,
  Trash2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Layers,
  Inbox,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import courseworkApi from '../../../api/courseworkApi';
import CreateCourseworkModal from './CreateCourseworkModal';
import SubmissionsModal from './SubmissionsModal';

const TeacherCourseworkSection = ({ t, user }) => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [courseworkList, setCourseworkList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCoursework, setEditingCoursework] = useState(null);
  const [submissionsModalCoursework, setSubmissionsModalCoursework] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignedRes, courseworkRes] = await Promise.all([
        courseworkApi.getTeacherAssignedClasses(),
        courseworkApi.getTeacherCoursework(),
      ]);

      setAssignedClasses(assignedRes.assignedClasses || []);
      setCourseworkList(Array.isArray(courseworkRes) ? courseworkRes : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load coursework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const totalAssignments = courseworkList.length;
  const totalSubmissions = courseworkList.reduce((acc, c) => acc + (c.totalSubmissions || 0), 0);
  const totalPending = courseworkList.reduce((acc, c) => acc + (c.pendingCount || 0), 0);
  const totalGraded = courseworkList.reduce((acc, c) => acc + (c.gradedCount || 0), 0);

  // Filtered Coursework
  const filteredCoursework = courseworkList.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.title.toLowerCase().includes(q) ||
      c.moduleCode.toLowerCase().includes(q) ||
      c.moduleName.toLowerCase().includes(q) ||
      c.targetGroup.toLowerCase().includes(q);

    const matchModule = selectedModule === 'All' || c.moduleCode === selectedModule;
    const matchGroup = selectedGroup === 'All' || c.targetGroup === selectedGroup;
    const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;

    return matchSearch && matchModule && matchGroup && matchStatus;
  });

  // Handle Create / Edit Submit
  const handleSaveCoursework = async (formData) => {
    if (editingCoursework) {
      await courseworkApi.updateCoursework(editingCoursework._id, formData);
      toast.success('Coursework updated successfully');
    } else {
      await courseworkApi.createCoursework(formData);
      toast.success('Coursework published successfully');
    }
    setEditingCoursework(null);
    fetchData();
  };

  // Handle Delete
  const handleDeleteCoursework = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also remove all student submissions.`)) {
      return;
    }

    try {
      await courseworkApi.deleteCoursework(id);
      toast.success('Coursework deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coursework');
    }
  };

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
              Coursework & Assignments
            </h1>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingCoursework(null);
                setCreateModalOpen(true);
              }}
              disabled={assignedClasses.length === 0}
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition-all hover:opacity-95 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: t.textPrimary,
                color: t.cardBg,
              }}
            >
              <Plus size={18} />
              <span>Create Coursework</span>
            </button>
          </div>
        </div>
      </section>

      {/* Scope Banner: Timetable-Assigned Modules & Cohorts */}
      <section
        className="rounded-[28px] border p-6 sm:p-7 transition-all"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          boxShadow: t.shadowSoft,
        }}
      >
        <div className="mb-4">
          <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: t.textPrimary }}>
            Your Timetable Assigned Cohorts ({assignedClasses.length} Module{assignedClasses.length === 1 ? '' : 's'})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm" style={{ color: t.textMuted }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Loading assigned modules...</span>
          </div>
        ) : assignedClasses.length === 0 ? (
          <div
            className="rounded-2xl p-5 text-sm"
            style={{
              backgroundColor: t.pageBg,
              color: t.textMuted,
              border: `1px solid ${t.border}`,
            }}
          >
            No active timetable periods assigned under your username ({user?.username}).
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {assignedClasses.map((cls) => (
              <div
                key={cls.moduleCode}
                className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                }}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="rounded-xl px-3 py-1 text-xs font-extrabold"
                    style={{
                      backgroundColor: t.cardBg,
                      color: t.textPrimary,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    {cls.moduleCode}
                  </span>
                  <span className="text-sm sm:text-base font-bold" style={{ color: t.textPrimary }}>
                    {cls.moduleName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                    Assigned Groups:
                  </span>
                  {cls.groups.map((g) => (
                    <span
                      key={g}
                      className="rounded-xl px-3 py-1 font-bold text-xs"
                      style={{
                        backgroundColor: t.cardBg,
                        color: t.textPrimary,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Coursework',
            value: totalAssignments,
            icon: BookMarked,
            tint: t.pastelBlue || '#dbeafe',
            color: '#1e40af',
          },
          {
            label: 'Submissions Received',
            value: totalSubmissions,
            icon: Inbox,
            tint: t.pastelPurple || '#ede9fe',
            color: '#6b21a8',
          },
          {
            label: 'Pending Grading',
            value: totalPending,
            icon: Clock,
            tint: t.pastelYellow || '#fef9c3',
            color: '#854d0e',
          },
          {
            label: 'Graded',
            value: totalGraded,
            icon: CheckCircle2,
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
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: t.textMuted }}
          />
          <input
            type="text"
            placeholder="Search coursework title or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-medium focus:outline-none"
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          >
            <option value="All">All Modules</option>
            {assignedClasses.map((c) => (
              <option key={c.moduleCode} value={c.moduleCode}>
                {c.moduleCode}
              </option>
            ))}
          </select>

          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          >
            <option value="All">All Groups</option>
            {Array.from(new Set(assignedClasses.flatMap((c) => c.groups))).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
            style={{
              backgroundColor: t.pageBg,
              borderColor: t.border,
              color: t.textPrimary,
            }}
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Coursework Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-sm" style={{ color: t.textMuted }}>
          <Loader2 size={32} className="animate-spin mb-3" />
          <p>Loading your coursework assignments...</p>
        </div>
      ) : filteredCoursework.length === 0 ? (
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
            No Coursework Found
          </h3>
          <p className="mt-1 text-xs max-w-sm" style={{ color: t.textMuted }}>
            {courseworkList.length === 0
              ? 'You have not created any coursework assignments yet. Click "Create Coursework" above to publish your first assignment for your timetable group.'
              : 'No coursework matches your current search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCoursework.map((coursework) => {
            const isDueSoon =
              new Date(coursework.dueDate) > new Date() &&
              new Date(coursework.dueDate) - new Date() < 3 * 24 * 60 * 60 * 1000;
            const isPastDue = new Date() > new Date(coursework.dueDate);

            const submitted = coursework.totalSubmissions || 0;
            const enrolled = coursework.enrolledCount || 1;
            const percent = Math.min(100, Math.round((submitted / (enrolled || 1)) * 100));

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

                    <span
                      className="rounded-lg px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: t.pageBg,
                        color: t.textPrimary,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      Cohort {coursework.targetGroup}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-3.5 text-base font-bold leading-snug line-clamp-2" style={{ color: t.textPrimary }}>
                    {coursework.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed line-clamp-3" style={{ color: t.textSecondary }}>
                    {coursework.description}
                  </p>

                  {/* Attachments Preview */}
                  {coursework.attachments && coursework.attachments.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: t.textMuted }}>
                      <FileText size={13} className="text-emerald-500" />
                      <span>{coursework.attachments.length} reference file(s) attached</span>
                    </div>
                  )}

                  {/* Due Date & Marks */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: isPastDue ? '#ef4444' : isDueSoon ? '#f59e0b' : t.textMuted }} />
                      <span className="font-semibold" style={{ color: isPastDue ? '#ef4444' : isDueSoon ? '#f59e0b' : t.textPrimary }}>
                        {isPastDue ? 'Closed' : `Due ${new Date(coursework.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>

                    <span className="font-bold" style={{ color: t.textMuted }}>
                      {coursework.totalMarks} Marks
                    </span>
                  </div>

                  {/* Submissions Progress */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span style={{ color: t.textMuted }}>Submissions ({submitted}/{enrolled})</span>
                      <span style={{ color: t.textPrimary }}>{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: t.pageBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: percent === 100 ? '#22c55e' : t.textPrimary,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] pt-1" style={{ color: t.textMuted }}>
                      <span className="text-emerald-500 font-bold">{coursework.gradedCount || 0} Graded</span>
                      <span>·</span>
                      <span className="text-amber-500 font-bold">{coursework.pendingCount || 0} To Grade</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t flex items-center justify-between gap-2" style={{ borderColor: t.border }}>
                  <button
                    type="button"
                    onClick={() => setSubmissionsModalCoursework(coursework)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold shadow-sm transition-all hover:opacity-90 active:scale-95"
                    style={{
                      backgroundColor: t.textPrimary,
                      color: t.cardBg,
                    }}
                  >
                    <span>Submissions</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCoursework(coursework);
                      setCreateModalOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: t.pageBg,
                      borderColor: t.border,
                      color: t.textMuted,
                    }}
                    title="Edit Coursework"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCoursework(coursework._id, coursework.title)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors text-rose-500 hover:opacity-80"
                    style={{
                      backgroundColor: t.pageBg,
                      borderColor: t.border,
                    }}
                    title="Delete Coursework"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CreateCourseworkModal
        t={t}
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingCoursework(null);
        }}
        onSubmit={handleSaveCoursework}
        assignedClasses={assignedClasses}
        editingCoursework={editingCoursework}
      />

      {/* Submissions & Grading Modal */}
      <SubmissionsModal
        t={t}
        isOpen={!!submissionsModalCoursework}
        coursework={submissionsModalCoursework}
        onClose={() => setSubmissionsModalCoursework(null)}
        onGradeUpdated={fetchData}
      />
    </div>
  );
};

export default TeacherCourseworkSection;
