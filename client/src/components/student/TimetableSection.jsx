import React, { useState } from 'react';
import {
  Clock, Calendar, MapPin, User, Users, BookOpen, AlertCircle,
  CheckCircle2, Bell, Shield, Info, School, FileText, Sparkles
} from 'lucide-react';
import { L4CG3_TIMETABLE_ROUTINE, INITIAL_RTE_SCHEDULE_CHANGES } from '../../data/studentDashboardData';

const TimetableSection = ({ t, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState('routine'); // 'routine' | 'rte-changes'
  const [selectedDay, setSelectedDay] = useState('All'); // 'All' | 'Sunday' | 'Monday' ...

  const daysList = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredRoutine = selectedDay === 'All'
    ? L4CG3_TIMETABLE_ROUTINE
    : L4CG3_TIMETABLE_ROUTINE.filter((d) => d.day === selectedDay);

  const getClassTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'tutorial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'workshop':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'room changed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case 'time changed':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Group Identifier */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Clock className="text-[#2f4336] dark:text-emerald-400" size={26} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Academic Timetable &amp; Class Schedule
            </h2>
            <span className="rounded-full bg-[#2f4336] text-white px-3 py-0.5 text-xs font-extrabold shadow-xs">
              L4CG3
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
            Bachelor of Science (Hons) Computer Science · Group L4CG3 Weekly Academic Routine &amp; Official RTE Notices
          </p>
        </div>

        {/* SubTab Toggle: Timetable vs. Official RTE Schedule Changes */}
        <div
          className="flex items-center gap-1 rounded-2xl border p-1 shadow-xs self-start"
          style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('routine')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
              activeSubTab === 'routine'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Calendar size={14} />
            <span>L4CG3 Class Routine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rte-changes')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all ${
              activeSubTab === 'rte-changes'
                ? 'bg-[#2f4336] text-white shadow-xs'
                : 'text-gray-600 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Bell size={14} className="text-amber-500" />
            <span>RTE Schedule Changes</span>
            <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-black">
              {INITIAL_RTE_SCHEDULE_CHANGES.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: L4CG3 WEEKLY CLASS ROUTINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'routine' && (
        <div className="space-y-6">
          {/* Day Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {daysList.map((day) => {
              const isOff = day === 'Thursday' || day === 'Saturday';
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    selectedDay === day
                      ? 'bg-[#2f4336] text-white shadow-xs'
                      : 'border hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: selectedDay === day ? '#2f4336' : t.border,
                    color: selectedDay === day ? '#ffffff' : t.textPrimary,
                    backgroundColor: selectedDay === day ? undefined : (t.cardBg || '#ffffff'),
                  }}
                >
                  {day} {isOff && <span className="text-[10px] opacity-75 font-normal">(OFF)</span>}
                </button>
              );
            })}
          </div>

          {/* Daily Schedule Cards */}
          <div className="space-y-5">
            {filteredRoutine.map((dayData) => {
              const isOffDay = dayData.isOffDay;

              return (
                <div
                  key={dayData.day}
                  className="overflow-hidden rounded-3xl border shadow-xs transition-all hover:shadow-md"
                  style={{
                    backgroundColor: t.cardBg || '#ffffff',
                    borderColor: t.border,
                  }}
                >
                  {/* Day Banner Header */}
                  <div
                    className={`flex items-center justify-between border-b px-6 py-3.5 ${
                      isOffDay
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/20'
                        : 'bg-black/5 dark:bg-white/5'
                    }`}
                    style={{ borderColor: t.border }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2f4336] text-white text-xs font-extrabold shadow-xs">
                        {dayData.day.slice(0, 3)}
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                          {dayData.day}
                        </h3>
                        <p className="text-[11px]" style={{ color: t.textMuted }}>
                          {isOffDay ? 'No classes scheduled' : `${dayData.periods.length} Academic Session${dayData.periods.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        isOffDay
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {isOffDay ? '🌴 FULL DAY OFF' : `${dayData.periods.length} Class${dayData.periods.length > 1 ? 'es' : ''}`}
                    </span>
                  </div>

                  {/* Day Content */}
                  <div className="p-6">
                    {isOffDay ? (
                      /* FULL DAY OFF Banner */
                      <div
                        className="rounded-2xl border border-dashed p-6 text-center"
                        style={{
                          backgroundColor: t.pageBg,
                          borderColor: t.border,
                        }}
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-2">
                          <CheckCircle2 size={24} />
                        </div>
                        <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                          FULL DAY OFF
                        </h4>
                        <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: t.textMuted }}>
                          No scheduled lectures, workshops, or tutorials for group L4CG3 on {dayData.day}. Use this time for project work, coursework preparation, or self-study in the campus library.
                        </p>
                      </div>
                    ) : (
                      /* Class Periods Grid */
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {dayData.periods.map((period) => (
                          <div
                            key={period.id}
                            className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all hover:border-gray-400"
                            style={{
                              backgroundColor: t.pageBg,
                              borderColor: t.border,
                            }}
                          >
                            <div className="space-y-3">
                              {/* Top Time & Type Badge */}
                              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: t.border }}>
                                <div className="flex items-center gap-1.5 font-extrabold text-sm" style={{ color: t.textPrimary }}>
                                  <Clock size={15} className="text-[#2f4336] dark:text-emerald-400" />
                                  <span>{period.time}</span>
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getClassTypeBadge(period.classType)}`}>
                                  {period.classType}
                                </span>
                              </div>

                              {/* Module Code & Name */}
                              <div>
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                                  {period.moduleCode}
                                </span>
                                <h4 className="text-base font-bold leading-snug mt-0.5" style={{ color: t.textPrimary }}>
                                  {period.moduleName}
                                </h4>
                              </div>

                              {/* Meta Details Grid */}
                              <div className="space-y-2 text-xs pt-1" style={{ color: t.textMuted }}>
                                {/* Lecturer */}
                                <div className="flex items-center gap-2">
                                  <User size={14} className="text-amber-600 shrink-0" />
                                  <span className="font-semibold" style={{ color: t.textPrimary }}>
                                    Lecturer:
                                  </span>
                                  <span>{period.lecturer}</span>
                                </div>

                                {/* Room / Location */}
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-red-500 shrink-0" />
                                  <span className="font-semibold" style={{ color: t.textPrimary }}>
                                    Room:
                                  </span>
                                  <span className="rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 font-bold" style={{ color: t.textPrimary }}>
                                    {period.room}
                                  </span>
                                </div>

                                {/* Group */}
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-purple-600 shrink-0" />
                                  <span className="font-semibold" style={{ color: t.textPrimary }}>
                                    Class Group:
                                  </span>
                                  <span>{period.group}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: OFFICIAL SCHEDULE CHANGES (RTE DEPARTMENT — VIEW-ONLY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rte-changes' && (
        <div className="space-y-6">
          {/* RTE Official Notice Banner */}
          <div
            className="rounded-3xl border p-6 shadow-xs relative overflow-hidden"
            style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold uppercase tracking-wide" style={{ color: t.textPrimary }}>
                      RTE Department Official Schedule Notices
                    </h3>
                    <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[10px] font-extrabold">
                      View-Only
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                    Registry, Timetabling &amp; Examination (RTE) Department authorized adjustments and classroom updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3.5 py-2 self-start sm:self-auto">
                <Info size={14} />
                <span>Published by Campus RTE Administration</span>
              </div>
            </div>

            {/* List of Official RTE Schedule Changes */}
            <div className="mt-5 space-y-4">
              {INITIAL_RTE_SCHEDULE_CHANGES.map((chg) => (
                <div
                  key={chg.id}
                  className="rounded-2xl border p-5 shadow-xs transition-all space-y-3"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: t.border }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        {chg.moduleCode}
                      </span>
                      <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                        {chg.moduleName}
                      </h4>
                      <span className="rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold" style={{ color: t.textMuted }}>
                        {chg.group}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${getStatusBadge(chg.status)}`}>
                        {chg.status}
                      </span>
                    </div>
                  </div>

                  {/* Comparison: Original vs. New Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Original Schedule */}
                    <div className="rounded-xl border p-3 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40">
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block mb-1">
                        Original Schedule
                      </span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 line-through">
                        {chg.originalSchedule}
                      </p>
                    </div>

                    {/* New Effective Schedule */}
                    <div className="rounded-xl border p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                        ✅ New Rescheduled Session
                      </span>
                      <p className="font-extrabold text-emerald-900 dark:text-emerald-200">
                        {chg.newSchedule}
                      </p>
                    </div>
                  </div>

                  {/* Notice / Reason & Effective Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-2.5 text-xs" style={{ borderColor: t.border }}>
                    <p className="text-[11px]" style={{ color: t.textMuted }}>
                      <strong className="text-gray-700 dark:text-gray-300">Reason / Notice:</strong> {chg.reason}
                    </p>
                    <div className="flex items-center gap-3 shrink-0 text-[11px]" style={{ color: t.textMuted }}>
                      <span>Effective: <strong className="text-[#2f4336] dark:text-emerald-400">{chg.effectiveDate}</strong></span>
                      <span>·</span>
                      <span className="font-semibold text-blue-600">{chg.publishedBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableSection;
