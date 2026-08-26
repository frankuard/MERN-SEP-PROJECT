import { useState, useEffect } from 'react';
import {
  Users, Calendar, TrendingUp, CheckSquare, ArrowRight, ClipboardList,
} from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';
import eventsApi from '../../../api/eventsApi';



const StatCard = ({ icon, label, value, sublabel, t }) => (

  
  <div
    className="rounded-2xl border p-5"
    style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
      {icon}
    </div>
    <p className="mt-4 text-2xl font-extrabold tracking-tight" style={{ color: t.textPrimary }}>
      {value}
    </p>
    <p className="mt-0.5 text-sm font-bold" style={{ color: t.textPrimary }}>{label}</p>
    {sublabel && (
      <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textMuted }}>{sublabel}</p>
    )}
  </div>
);

const QuickAction = ({ icon, title, description, onClick, t }) => (
  <button
    type="button"
    onClick={onClick}
className="flex cursor-pointer items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:scale-[1.01] hover:shadow-md"
    style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
  >
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{title}</p>
      <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textMuted }}>{description}</p>
    </div>
    <ArrowRight size={16} style={{ color: t.textMuted }} className="shrink-0" />
  </button>
);

const AdminDashboardHome = ({ t, adminName = 'Admin', onNavigate }) => {
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    Promise.all([
      attendanceApi.getAttendanceSummaryAdmin().catch(() => []),
      eventsApi.getAllEventsAdmin().catch(() => []),
    ]).then(([attendance, allEvents]) => {
      setAttendanceSummary(Array.isArray(attendance) ? attendance : []);
      setEvents(Array.isArray(allEvents) ? allEvents : []);
      setLoading(false);
    });
  }, []);

  const trackedStudents = attendanceSummary.filter((s) => s.totalDays > 0);
  const avgAttendance = trackedStudents.length > 0
    ? Math.round(trackedStudents.reduce((sum, s) => sum + s.percentage, 0) / trackedStudents.length)
    : 0;

  const publishedEvents = events.filter((e) => e.isPublished).length;
  const draftEvents = events.length - publishedEvents;

  const atRiskStudents = [...attendanceSummary]
    .filter((s) => s.totalDays > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);

  const upcomingEvents = [...events]
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Greeting header */}
      <div
        className="rounded-3xl p-6 sm:p-8"
        style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
          Admin Panel
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
          Welcome back, {adminName}
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium" style={{ color: t.textMuted }}>
          Here's a snapshot of student attendance and campus events. Jump into a module below to manage the details.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users size={18} />}
          label="Students Tracked"
          value={loading ? '—' : trackedStudents.length}
          sublabel={loading ? '' : `of ${attendanceSummary.length} approved students`}
          t={t}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Avg Attendance"
          value={loading ? '—' : `${avgAttendance}%`}
          sublabel="Across tracked students"
          t={t}
        />
        <StatCard
          icon={<Calendar size={18} />}
          label="Total Events"
          value={loading ? '—' : events.length}
          sublabel={loading ? '' : `${publishedEvents} published`}
          t={t}
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Draft Events"
          value={loading ? '—' : draftEvents}
          sublabel="Not yet visible to students"
          t={t}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={<ClipboardList size={18} />}
            title="Manage Attendance"
            description="View and edit every student's records"
            onClick={() => onNavigate('manage-attendance')}
            t={t}
          />
          <QuickAction
            icon={<Calendar size={18} />}
            title="Manage Events"
            description="Create, edit, publish or delete events"
            onClick={() => onNavigate('manage-events')}
            t={t}
          />
          <QuickAction
            icon={<CheckSquare size={18} />}
            title="Pending Approvals"
            description="Review new teacher/staff signups"
            onClick={() => onNavigate('approvals')}
            t={t}
          />
        </div>
      </div>

      {/* Two-column detail panels — no header links, Quick Actions above handles navigation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* At-risk attendance */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
        >
          <h3 className="border-b pb-3 text-sm font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
            Lowest Attendance
          </h3>

          {loading ? (
            <p className="mt-4 text-sm" style={{ color: t.textMuted }}>Loading...</p>
          ) : atRiskStudents.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: t.textMuted }}>No attendance data recorded yet.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {atRiskStudents.map((s) => (
                <div key={s.studentId} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{s.username}</p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{s.department || 'No department'}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: s.percentage < 75 ? '#fee2e2' : t.accentEmerald + '22',
                      color: s.percentage < 75 ? '#b91c1c' : t.accentEmerald,
                    }}
                  >
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}
        >
          <h3 className="border-b pb-3 text-sm font-bold" style={{ borderColor: t.border, color: t.textPrimary }}>
            Upcoming Events
          </h3>

          {loading ? (
            <p className="mt-4 text-sm" style={{ color: t.textMuted }}>Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: t.textMuted }}>No upcoming events scheduled.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcomingEvents.map((ev) => (
                <div key={ev._id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{ev.title}</p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>
                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {ev.venue}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{
                      backgroundColor: ev.isPublished ? t.accentEmerald + '22' : t.accentAmber + '22',
                      color: ev.isPublished ? t.accentEmerald : t.accentAmber,
                    }}
                  >
                    {ev.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;