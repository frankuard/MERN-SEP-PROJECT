import React, { useState } from 'react';
import {
  GraduationCap, CheckCircle2, HeartHandshake, Calendar, Clock,
  FileText, CheckCheck, Users, Plus, Sparkles, MapPin, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import RequestAttendanceReportModal from './modals/RequestAttendanceReportModal';

const SSDHelpSection = ({
  t,
  user,
  studentName,
  attendanceRecords,
  isLoggedToday,
  onTrackAttendanceToday,
  volunteeringHistory,
  volunteerRequests,
  onToggleApplyVolunteer,
}) => {
  const [ssdActiveSubTab, setSsdActiveSubTab] = useState('attendance'); // 'attendance' | 'volunteering' | 'volunteer-requests'
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Student Services Department (SSD) Help
            </h2>
          </div>
          <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
            Official attendance records &amp; reports, volunteering service history, and event volunteer opportunities.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div
          className="flex items-center gap-1 rounded-xl border p-1 shadow-xs self-start"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <button
            type="button"
            onClick={() => setSsdActiveSubTab('attendance')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              ssdActiveSubTab === 'attendance'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Attendance Tracker
          </button>
          <button
            type="button"
            onClick={() => setSsdActiveSubTab('volunteering')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              ssdActiveSubTab === 'volunteering'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Volunteering History
          </button>
          <button
            type="button"
            onClick={() => setSsdActiveSubTab('volunteer-requests')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              ssdActiveSubTab === 'volunteer-requests'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Upcoming Events / Volunteer Requests
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ATTENDANCE TRACKER & ATTENDANCE PERCENTAGE */}
      {/* ========================================================================= */}
      {ssdActiveSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar with Attendance Percentage */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Main Attendance Percentage */}
            <div
              className="rounded-2xl border p-5 shadow-xs text-center relative overflow-hidden"
              style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
            >
              <div className="absolute top-2 right-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-600">87%</p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                Overall Attendance
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Above 75% Academic Requirement
              </p>
            </div>

            {/* Present Days */}
            <div
              className="rounded-2xl border p-5 shadow-xs text-center"
              style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
            >
              <p className="text-3xl font-extrabold text-blue-600">42</p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                Present Days
              </p>
              <p className="text-[10px]" style={{ color: t.textMuted }}>Total sessions attended</p>
            </div>

            {/* Absent Days */}
            <div
              className="rounded-2xl border p-5 shadow-xs text-center"
              style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
            >
              <p className="text-3xl font-extrabold text-red-500">6</p>
              <p className="mt-1 text-xs font-bold" style={{ color: t.textPrimary }}>
                Absent Days
              </p>
              <p className="text-[10px]" style={{ color: t.textMuted }}>Excused/Unexcused</p>
            </div>

            {/* Daily Check-In & Action */}
            <div
              className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs"
              style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
            >
              <div>
                <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                  Daily Attendance Check-In
                </p>
                <p className="text-[11px]" style={{ color: t.textMuted }}>
                  {isLoggedToday ? 'Verified Present Today 🟢' : 'Pending Check-In'}
                </p>
              </div>
              <button
                type="button"
                onClick={onTrackAttendanceToday}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#2f4336] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#25362b]"
              >
                <CheckCircle2 size={14} /> Click to Track Attendance
              </button>
            </div>
          </div>

          {/* Request Attendance Report Callout Banner */}
          <div
            className="rounded-3xl border p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-xs shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Need an Official Attendance Certificate or Report?
                </h3>
                <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                  Request formal stamped and signed attendance transcripts for scholarship renewal, visa verifications, or medical exemptions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 shrink-0 transition-transform active:scale-95"
            >
              <FileText size={14} /> Request Attendance Report
            </button>
          </div>

          {/* Attendance Log Table */}
          <div
            className="rounded-2xl border p-6 shadow-xs"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: t.border }}>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Recent Attendance Activity Log
              </h3>
              <span className="text-xs font-semibold text-emerald-600">
                87% Aggregate Record
              </span>
            </div>

            <div className="space-y-2.5">
              {attendanceRecords.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border p-3.5 text-xs"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-2.5 w-2.5 rounded-full ${
                        rec.status === 'Present' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-bold" style={{ color: t.textPrimary }}>
                        {rec.date}
                      </p>
                      <p className="text-[11px]" style={{ color: t.textMuted }}>
                        {rec.room !== '-' ? `Room: ${rec.room}` : 'No entry recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px]" style={{ color: t.textMuted }}>
                      {rec.time}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: VOLUNTEERING HISTORY */}
      {/* ========================================================================= */}
      {ssdActiveSubTab === 'volunteering' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-6 shadow-xs"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Community Volunteering &amp; Service Hours
                </h3>
                <p className="text-xs" style={{ color: t.textMuted }}>
                  Official verified records registered with Student Services Department (SSD)
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                36 Total Hours Completed
              </span>
            </div>

            <div className="space-y-3.5">
              {volunteeringHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {item.role}
                      </h4>
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                        {item.event}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      Date: {item.date} · Verified by SSD Campus Coordinator
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                      +{item.hours} Hours
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Verified ✅
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: UPCOMING EVENTS / VOLUNTEER REQUESTS */}
      {/* ========================================================================= */}
      {ssdActiveSubTab === 'volunteer-requests' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-6 shadow-xs"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-5 gap-2" style={{ borderColor: t.border }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>
                  Upcoming Events / Volunteer Opportunities
                </h3>
                <p className="text-xs" style={{ color: t.textMuted }}>
                  Sign up as a student volunteer to gain leadership experience, event credentials, and recognized service hours.
                </p>
              </div>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-800 self-start sm:self-auto">
                {volunteerRequests.length} Active Callouts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {volunteerRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-md bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                        {req.department}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {req.slotsOpen} slots open
                      </span>
                    </div>

                    <h4 className="text-sm font-bold leading-snug" style={{ color: t.textPrimary }}>
                      {req.eventTitle}
                    </h4>

                    <p className="text-xs" style={{ color: t.textMuted }}>
                      Role: {req.role}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
                      <Calendar size={13} /> {req.date}
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-3" style={{ borderColor: t.border }}>
                    <button
                      type="button"
                      onClick={() => onToggleApplyVolunteer(req.id)}
                      className={`w-full rounded-xl py-2 text-xs font-bold transition-all shadow-xs ${
                        req.applied
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-[#2f4336] text-white hover:bg-[#25362b]'
                      }`}
                    >
                      {req.applied ? 'Application Submitted ✅' : 'Sign Up to Volunteer →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Request Attendance Report Modal */}
      <RequestAttendanceReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        t={t}
        studentName={studentName}
        userEmail={user?.email}
      />
    </div>
  );
};

export default SSDHelpSection;
