import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';
import DashboardMascot from './DashboardMascot';

const GreetingHeader = ({ t, greeting, studentName, onNavigateTab }) => {
  // Real attendance summary from the backend — replaces the old hardcoded
  // DASHBOARD_ATTENDANCE import. Defaults to zeros until the fetch resolves.
  const [attendance, setAttendance] = useState({ percentage: 0, present: 0, absent: 0 });

  useEffect(() => {
    let mounted = true;
    attendanceApi.getMyAttendance()
      .then((data) => {
        if (mounted && data) setAttendance(data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const { percentage, present, absent } = attendance;

  return (
    <section
      className="dashboard-hero relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-8"
      style={{
        backgroundColor: t.heroBg || t.pastelBlue,
        boxShadow: t.shadowCard,
      }}
    >
      {/* Colorful decorative blobs */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-pink-300/40" />
      <div className="pointer-events-none absolute bottom-4 left-1/3 h-20 w-20 rounded-full bg-purple-300/30" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-14 w-14 rounded-full bg-yellow-300/40" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <div className="hidden shrink-0 sm:block">
            <DashboardMascot className="h-28 w-auto sm:h-32" />
          </div>
          <div className="min-w-0">
            <span
              className="dashboard-pill mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide"
              style={{ backgroundColor: '#111', color: '#fff' }}
            >
              Campus Today
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: t.textPrimary }}>
              {greeting}, {studentName}!
            </h1>
            <p className="mt-2 text-sm font-semibold sm:text-base" style={{ color: t.textSecondary }}>
              Here&apos;s what&apos;s happening around campus today.
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
              Biratnagar International College
            </p>
          </div>
        </div>

        {/* Attendance card — white floating */}
        <div
          className="dashboard-card-lift shrink-0 rounded-[24px] bg-white p-5 sm:min-w-[210px]"
          style={{ boxShadow: t.shadowSoft }}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: t.textMuted }}>
            Attendance
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#111 ${percentage * 3.6}deg, #e8e8e8 0deg)` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-extrabold tabular-nums text-black">
                {percentage}%
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold text-green-600">{present} Present</p>
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>{absent} Absent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ssd-help')}
            className="dashboard-btn-bounce mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-2.5 text-xs font-extrabold text-white"
          >
            View attendance
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default GreetingHeader;