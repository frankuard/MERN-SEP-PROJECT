import { useState, useEffect } from 'react';
import { Users, TrendingUp, UserCheck, UserX } from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';

const AdminDashboardHome = ({ t, adminName }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi.getAllStudents()
      .then((data) => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStudents = students.length;
  const avgPercentage = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / totalStudents)
    : 0;
  const belowThreshold = students.filter((s) => s.percentage < 75 && s.totalDays > 0).length;

  const cards = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: '#111' },
    { label: 'Average Attendance', value: `${avgPercentage}%`, icon: TrendingUp, color: '#059669' },
    { label: 'Below 75% Requirement', value: belowThreshold, icon: UserX, color: '#dc2626' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: t.textMuted }}>
          Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: t.textPrimary }}>
          Welcome back, {adminName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: t.textMuted }}>
          Here's a quick overview of student attendance across campus.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: t.cardBg, borderColor: t.border }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${card.color}15`, color: card.color }}
            >
              <card.icon size={20} />
            </div>
            <p className="mt-4 text-2xl font-extrabold" style={{ color: t.textPrimary }}>
              {loading ? '—' : card.value}
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardHome;