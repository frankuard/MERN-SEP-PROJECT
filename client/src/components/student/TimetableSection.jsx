import React, { useState, useEffect } from 'react';
import {
  Timer, MapPin, User, BookOpen, Terminal, Database, Cpu, CheckCircle2
} from 'lucide-react';
import timetableApi from '../../api/timetableApi';
import { TIMETABLE_ROUTINE } from '../../data/studentDashboardData';

const PythonIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M63.5 12.5C39.6 12.5 41 23 41 23L41.05 34.5H64V38H28.5C14 38 12.5 50.5 12.5 64C12.5 76 21 82 28.5 82H36.5V70.5C36.5 57 48.5 57 48.5 57H72C83 57 84 46.5 84 46.5V23C84 23 85.5 12.5 63.5 12.5ZM50.5 22C52.9853 22 55 24.0147 55 26.5C55 28.9853 52.9853 31 50.5 31C48.0147 31 46 28.9853 46 26.5C46 24.0147 48.0147 22 50.5 22Z" fill="#387EB8"/>
    <path d="M64.5 115.5C88.4 115.5 87 105 87 105L86.95 93.5H64V90H99.5C114 90 115.5 77.5 115.5 64C115.5 52 107 46 99.5 46H91.5V57.5C91.5 71 79.5 71 79.5 71H56C45 71 44 81.5 44 81.5V105C44 105 42.5 115.5 64.5 115.5ZM77.5 106C75.0147 106 73 103.985 73 101.5C73 99.0147 75.0147 97 77.5 97C79.9853 97 82 99.0147 82 101.5C82 103.985 79.9853 106 77.5 106Z" fill="#FFE052"/>
  </svg>
);

const TimetableSection = ({ t }) => {
  const [routine, setRoutine] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    timetableApi.getTimetable({ format: 'grouped' })
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setRoutine(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  const getSubjectIcon = (moduleCode) => {
    switch (moduleCode) {
      case '4CS001':
        return <Terminal size={16} className="text-blue-600 dark:text-blue-400" />;
      case '4CS017':
        return <Database size={16} className="text-emerald-600 dark:text-emerald-400" />;
      case '4CS015':
        return <Cpu size={16} className="text-purple-600 dark:text-purple-400" />;
      default:
        return <BookOpen size={16} className="text-amber-600 dark:text-amber-400" />;
    }
  };

  const getDayBadgeIcon = (dayName) => {
    switch (dayName?.toLowerCase()) {
      case 'sunday':
        return <PythonIcon className="h-3.5 w-3.5 shrink-0" />;
      case 'monday':
        return <Database size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'tuesday':
        return <Terminal size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'wednesday':
        return <Database size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'thursday':
        return <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'friday':
        return <Cpu size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'saturday':
        return <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <PythonIcon className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
          Timetable
        </h2>
        <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>
          Class Schedule
        </p>
      </div>

      {/* Grid of Medium Blocks for all days (Sunday to Saturday) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {(routine.length > 0 ? routine : TIMETABLE_ROUTINE).map((dayData) => {
          const isOff = dayData.isOffDay;
          const classCount = dayData.periods.length;
          const countLabel = isOff ? '0 Classes' : `${classCount} Class${classCount > 1 ? 'es' : ''}`;

          return (
            <div
              key={dayData.day}
              className="flex flex-col justify-between rounded-3xl border p-5 shadow-xs transition-all hover:shadow-md"
              style={{
                backgroundColor: t.cardBg || '#ffffff',
                borderColor: t.border,
              }}
            >
              {/* Day Header Block */}
              <div>
                <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: t.border }}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2f4336] text-white text-xs font-black shadow-xs">
                      {dayData.day.slice(0, 3)}
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
                        {dayData.day}
                      </h3>
                      <p className="text-[11px] font-medium" style={{ color: t.textMuted }}>
                        {isOff ? 'No classes' : `${classCount} session${classCount > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                      isOff
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {isOff ? 'Day Off' : `${classCount} Class${classCount > 1 ? 'es' : ''}`}
                  </span>
                </div>

                {/* Class periods or Off-Day banner */}
                <div className="mt-4 space-y-3.5">
                  {isOff ? (
                    <div
                      className="rounded-2xl border border-dashed p-5 text-center my-2"
                      style={{
                        backgroundColor: t.pageBg,
                        borderColor: t.border,
                      }}
                    >
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-2">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        Full Day Off
                      </h4>
                      <p className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>
                        Self-study &amp; library project work
                      </p>
                    </div>
                  ) : (
                    dayData.periods.map((period) => (
                      <div
                        key={period.id}
                        className="rounded-2xl border p-3.5 shadow-xs space-y-2.5 transition-all hover:border-gray-400/60"
                        style={{
                          backgroundColor: t.pageBg,
                          borderColor: t.border,
                        }}
                      >
                        {/* Time & Badge */}
                        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: t.border }}>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-tight tabular-nums" style={{ color: t.textPrimary }}>
                            <Timer size={14} className="text-[#2f4336] dark:text-emerald-400 shrink-0" />
                            <span>{period.time}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getClassTypeBadge(period.classType)}`}>
                            {period.classType}
                          </span>
                        </div>

                        {/* Subject info */}
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
                            {getSubjectIcon(period.moduleCode)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              {period.moduleCode}
                            </span>
                            <h4 className="text-xs font-bold leading-tight line-clamp-2" style={{ color: t.textPrimary }}>
                              {period.moduleName}
                            </h4>
                          </div>
                        </div>

                        {/* Teacher & Room */}
                        <div className="space-y-1 text-[11px] pt-1" style={{ color: t.textMuted }}>
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={13} className="text-amber-600 shrink-0" />
                            <span className="font-semibold" style={{ color: t.textPrimary }}>
                              Teacher:
                            </span>
                            <span className="truncate">{period.lecturer}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-red-500 shrink-0" />
                            <span className="font-semibold" style={{ color: t.textPrimary }}>
                              Room:
                            </span>
                            <span className="rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.2 font-bold" style={{ color: t.textPrimary }}>
                              {period.room}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom-right: Day-specific Icon & No. of Classes badge */}
              <div className="mt-5 flex items-center justify-end border-t pt-3.5" style={{ borderColor: t.border }}>
                <div
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 shadow-xs"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  {getDayBadgeIcon(dayData.day)}
                  <span className="text-[11px] font-black tracking-wide" style={{ color: t.textPrimary }}>
                    {countLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimetableSection;
