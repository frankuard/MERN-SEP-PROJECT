import { useState, useEffect, useMemo } from 'react';
import { Save, Search, Users, Building2 } from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';
import toast from 'react-hot-toast';
import { DEPARTMENTS, getSemesterOptions } from '../../../data/departmentSemesters';

const ManageAttendanceSection = ({ t }) => {
  const [students, setStudents] = useState([]);
  const [semesterConfigs, setSemesterConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [activeConfigDept, setActiveConfigDept] = useState(DEPARTMENTS[0] || 'BCS');
  const [semTotalInput, setSemTotalInput] = useState('30');
  const [savingSemTotal, setSavingSemTotal] = useState(false);
  const [editValues, setEditValues] = useState({}); // { [studentId]: { present, absent, totalDays } }
  const [savingId, setSavingId] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      attendanceApi.getAttendanceSummaryAdmin().catch(() => []),
      attendanceApi.getSemesterConfigs().catch(() => ({})),
    ])
      .then(([studentsData, configsData]) => {
        if (Array.isArray(studentsData)) setStudents(studentsData);
        if (configsData && typeof configsData === 'object') setSemesterConfigs(configsData);
      })
      .catch(() => toast.error('Failed to load attendance data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Effective faculty for total days configuration
  const targetConfigDept = departmentFilter !== 'All' ? departmentFilter : activeConfigDept;

  // Whenever the active faculty or semester changes, load the saved total days for that faculty + semester
  useEffect(() => {
    if (semesterFilter !== 'All' && semesterFilter !== 'Unassigned') {
      const semKey = String(semesterFilter).replace(/^semester\s*/i, '').trim();
      const configKey = `${targetConfigDept}_${semKey}`;
      const existing = semesterConfigs[configKey] ?? semesterConfigs[semKey];
      setSemTotalInput(existing !== undefined ? String(existing) : '30');
    }
  }, [semesterFilter, targetConfigDept, semesterConfigs]);

  // Semester options depend on the selected faculty
  const semesterOptions = useMemo(() => {
    let sems = [];
    if (departmentFilter !== 'All') {
      sems = getSemesterOptions(departmentFilter).map(String);
    } else {
      sems = ['1', '2', '3', '4', '5', '6', '7', '8'];
    }

    const hasUnassigned = students.some((s) => !s.semester || String(s.semester).trim() === '');
    const list = ['All', ...sems];
    if (hasUnassigned) list.push('Unassigned');
    return list;
  }, [students, departmentFilter]);

  // Reset semester if currently selected semester doesn't exist in newly picked faculty
  useEffect(() => {
    if (departmentFilter !== 'All' && semesterFilter !== 'All' && semesterFilter !== 'Unassigned') {
      const allowed = getSemesterOptions(departmentFilter).map(String);
      if (!allowed.includes(semesterFilter)) {
        setSemesterFilter('All');
      }
    }
  }, [departmentFilter, semesterFilter]);

  // Strict student filtering by faculty, semester, and search
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students.filter((s) => {
      // Faculty / Department filter
      if (departmentFilter !== 'All') {
        const studentDept = String(s.department || '').trim().toLowerCase();
        const targetDept = departmentFilter.trim().toLowerCase();
        if (
          studentDept !== targetDept &&
          !studentDept.includes(targetDept) &&
          !targetDept.includes(studentDept)
        ) {
          return false;
        }
      }

      // Semester filter
      if (semesterFilter !== 'All') {
        const studentSem = String(s.semester || '')
          .replace(/^semester\s*/i, '')
          .trim();
        if (semesterFilter === 'Unassigned') {
          if (studentSem !== '') return false;
        } else {
          if (studentSem !== semesterFilter) return false;
        }
      }

      // Search filter
      if (q) {
        const nameMatch = s.username?.toLowerCase().includes(q);
        const emailMatch = s.email?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [students, semesterFilter, departmentFilter, search]);

  const getStudentTotalDays = (student) => {
    const sem = String(student.semester || '').replace(/^semester\s*/i, '').trim();
    const dept = String(student.department || '').trim();
    if (dept && sem && semesterConfigs[`${dept}_${sem}`] !== undefined) {
      return Number(semesterConfigs[`${dept}_${sem}`]);
    }
    if (sem && semesterConfigs[sem] !== undefined) {
      return Number(semesterConfigs[sem]);
    }
    return Number(student.totalDays || 0);
  };

  const getDisplayValue = (student, field) => {
    const edited = editValues[student.studentId];
    if (edited && edited[field] !== undefined) return edited[field];
    if (field === 'totalDays') return String(getStudentTotalDays(student));
    return String(student[field] ?? 0);
  };

  const handlePresentChange = (student, rawValue) => {
    if (rawValue !== '' && !/^\d+$/.test(rawValue)) return;
    const totalDays = getStudentTotalDays(student);
    const pNum = rawValue === '' ? 0 : Number(rawValue);

    if (pNum > totalDays && totalDays > 0) {
      toast.error(`Present cannot exceed total days (${totalDays})`);
      return;
    }

    const autoAbsent = Math.max(0, totalDays - pNum);
    setEditValues((prev) => ({
      ...prev,
      [student.studentId]: {
        present: rawValue,
        absent: String(autoAbsent),
        totalDays: String(totalDays),
      },
    }));
  };

  const handleAbsentChange = (student, rawValue) => {
    if (rawValue !== '' && !/^\d+$/.test(rawValue)) return;
    const totalDays = getStudentTotalDays(student);
    const aNum = rawValue === '' ? 0 : Number(rawValue);

    if (aNum > totalDays && totalDays > 0) {
      toast.error(`Absent cannot exceed total days (${totalDays})`);
      return;
    }

    const autoPresent = Math.max(0, totalDays - aNum);
    setEditValues((prev) => ({
      ...prev,
      [student.studentId]: {
        absent: rawValue,
        present: String(autoPresent),
        totalDays: String(totalDays),
      },
    }));
  };

  const handleSaveSemesterTotal = async () => {
    const totalDays = Number(semTotalInput);
    if (Number.isNaN(totalDays) || totalDays < 0) {
      toast.error('Please enter a valid positive number for total days');
      return;
    }

    setSavingSemTotal(true);
    try {
      await attendanceApi.setSemesterTotalDays({
        department: targetConfigDept,
        semester: semesterFilter,
        totalDays,
      });
      toast.success(`${targetConfigDept} Semester ${semesterFilter} total days set to ${totalDays}`);
      setSemesterConfigs((prev) => ({
        ...prev,
        [`${targetConfigDept}_${semesterFilter}`]: totalDays,
      }));
      setEditValues({});
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update semester total days');
    } finally {
      setSavingSemTotal(false);
    }
  };

  const handleSave = async (student) => {
    const totalDays = getStudentTotalDays(student);
    const presentDisplay = getDisplayValue(student, 'present');
    const absentDisplay = getDisplayValue(student, 'absent');
    const present = Number(presentDisplay) || 0;
    const absent = Number(absentDisplay) || 0;

    if (present + absent !== totalDays && totalDays > 0) {
      toast.error(`${present} + ${absent} must equal total days (${totalDays})`);
      return;
    }

    setSavingId(student.studentId);
    try {
      await attendanceApi.quickSetAttendance(student.studentId, { totalDays, present, absent });
      toast.success(`Attendance updated for ${student.username}`);
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[student.studentId];
        return next;
      });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSavingId(null);
    }
  };

  const computePercentage = (present, totalDays) => {
    if (totalDays <= 0) return 0;
    return Math.min(100, Math.round((present / totalDays) * 100));
  };

  const getPercentageBadgeStyle = (pct) => {
    if (pct >= 75) {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        color: '#22c55e',
      };
    }
    if (pct >= 50) {
      return {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        color: '#eab308',
      };
    }
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
    };
  };

  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.chipBg,
    color: t.textPrimary,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: t.chipBg }}
          >
            <Users size={19} style={{ color: t.textPrimary }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
              Manage Attendance
            </h2>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: t.textMuted }}>
              Filter by faculty and semester to track and update student attendance
            </p>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="space-y-4">
        {/* Search and stats bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {(departmentFilter !== 'All' || semesterFilter !== 'All' || search) && (
              <button
                type="button"
                onClick={() => {
                  setDepartmentFilter('All');
                  setSemesterFilter('All');
                  setSearch('');
                }}
                className="cursor-pointer text-sm font-bold underline"
                style={{ color: t.textMuted }}
              >
                Reset filters
              </button>
            )}
            <span className="text-sm font-semibold" style={{ color: t.textMuted }}>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: t.textMuted }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Faculty pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-sm shrink-0" style={{ color: t.textPrimary }}>
            <Building2 size={15} style={{ color: t.textMuted }} />
            Faculty:
          </div>
          <div
            className="inline-flex flex-wrap items-center gap-1.5 rounded-full border p-1"
            style={{ borderColor: t.border }}
          >
            {['All', ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  setDepartmentFilter(dept);
                  if (dept !== 'All') setActiveConfigDept(dept);
                }}
                className="cursor-pointer rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-colors"
                style={{
                  backgroundColor: departmentFilter === dept ? t.accentPrimary : 'transparent',
                  color: departmentFilter === dept ? t.pageBg : t.textPrimary,
                }}
              >
                {dept === 'All' ? 'All Faculties' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Semester division pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-bold text-sm shrink-0" style={{ color: t.textPrimary }}>
            Semester:
          </span>
          <div
            className="inline-flex flex-wrap items-center gap-1.5 rounded-full border p-1"
            style={{ borderColor: t.border }}
          >
            {semesterOptions.map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSemesterFilter(sem)}
                className="cursor-pointer rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-colors"
                style={{
                  backgroundColor: semesterFilter === sem ? t.accentPrimary : 'transparent',
                  color: semesterFilter === sem ? t.pageBg : t.textPrimary,
                }}
              >
                {sem === 'All' ? 'All Semesters' : sem === 'Unassigned' ? 'Unassigned' : `Sem ${sem}`}
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Total Class Days bar when a specific semester is active */}
        {semesterFilter !== 'All' && semesterFilter !== 'Unassigned' && (
          <div
            className="flex flex-wrap items-center gap-3.5 rounded-2xl border px-5 py-3 text-sm"
            style={{ backgroundColor: t.cardBg, borderColor: t.border }}
          >
            {departmentFilter === 'All' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: t.textMuted }}>Faculty:</span>
                <select
                  value={activeConfigDept}
                  onChange={(e) => {
                    setActiveConfigDept(e.target.value);
                    setDepartmentFilter(e.target.value);
                  }}
                  className="rounded-xl border py-2 px-3 text-sm font-bold outline-none"
                  style={inputStyle}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <span className="font-bold text-sm" style={{ color: t.textPrimary }}>
                Total Class Days:
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={semTotalInput}
                onChange={(e) => {
                  if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                    setSemTotalInput(e.target.value);
                  }
                }}
                className="w-24 rounded-xl border px-3 py-2 text-center text-sm font-bold outline-none sm:w-28"
                style={inputStyle}
                placeholder="30"
              />
              <button
                type="button"
                disabled={savingSemTotal}
                onClick={handleSaveSemesterTotal}
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}
              >
                {savingSemTotal ? 'Setting...' : 'Set'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div
          className="rounded-2xl border px-4 py-10 text-center text-sm font-semibold"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Loading attendance data...
        </div>
      )}

      {!loading && filteredStudents.length === 0 && (
        <div
          className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm font-semibold"
          style={{ borderColor: t.border, color: t.textMuted }}
        >
          No students found matching this filter.
        </div>
      )}

      {/* Desktop / tablet table */}
      {!loading && filteredStudents.length > 0 && (
        <div
          className="hidden overflow-x-auto rounded-2xl border sm:block"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: t.border, color: t.textMuted }}
              >
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Total Days</th>
                <th className="px-5 py-3.5">Present</th>
                <th className="px-5 py-3.5">Absent</th>
                <th className="px-5 py-3.5">Percentage</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const totalDaysNum = getStudentTotalDays(student);
                const presentDisplay = getDisplayValue(student, 'present');
                const absentDisplay = getDisplayValue(student, 'absent');
                const presentNum = Number(presentDisplay) || 0;
                const percentage = computePercentage(presentNum, totalDaysNum);
                const isDirty = !!editValues[student.studentId];
                const badgeStyle = getPercentageBadgeStyle(percentage);

                return (
                  <tr
                    key={student.studentId}
                    className="border-b last:border-0 align-middle"
                    style={{ borderColor: t.border }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-sm" style={{ color: t.textPrimary }}>
                        {student.username}
                      </p>
                      <p className="text-xs" style={{ color: t.textMuted }}>
                        {student.email}
                      </p>
                      <div
                        className="mt-1 flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: t.textMuted }}
                      >
                        {student.department && <span>{student.department}</span>}
                        {student.department && student.semester && <span>·</span>}
                        <span>{student.semester ? `Sem ${student.semester}` : 'Sem unset'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold"
                        style={{ backgroundColor: t.chipBg, color: t.textPrimary }}
                      >
                        {totalDaysNum} days
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={presentDisplay}
                        onChange={(e) => handlePresentChange(student, e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors sm:w-24"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={absentDisplay}
                        onChange={(e) => handleAbsentChange(student, e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition-colors sm:w-24"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-block rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{
                          backgroundColor: badgeStyle.backgroundColor,
                          color: badgeStyle.color,
                        }}
                      >
                        {percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={!isDirty || savingId === student.studentId}
                        onClick={() => handleSave(student)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                        style={{
                          backgroundColor: t.accentPrimary,
                          color: t.pageBg,
                        }}
                      >
                        <Save size={14} />
                        {savingId === student.studentId ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card view */}
      {!loading && filteredStudents.length > 0 && (
        <div className="space-y-3.5 sm:hidden">
          {filteredStudents.map((student) => {
            const totalDaysNum = getStudentTotalDays(student);
            const presentDisplay = getDisplayValue(student, 'present');
            const absentDisplay = getDisplayValue(student, 'absent');
            const presentNum = Number(presentDisplay) || 0;
            const percentage = computePercentage(presentNum, totalDaysNum);
            const isDirty = !!editValues[student.studentId];
            const badgeStyle = getPercentageBadgeStyle(percentage);

            return (
              <div
                key={student.studentId}
                className="rounded-2xl border p-4.5"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-sm" style={{ color: t.textPrimary }}>
                      {student.username}
                    </p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>
                      {student.email}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: t.textMuted }}
                    >
                      {student.department && <span>{student.department}</span>}
                      {student.department && student.semester && <span>·</span>}
                      <span>{student.semester ? `Sem ${student.semester}` : 'Sem unset'}</span>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
                    style={{
                      backgroundColor: badgeStyle.backgroundColor,
                      color: badgeStyle.color,
                    }}
                  >
                    {percentage}%
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
                      style={{ color: t.textMuted }}
                    >
                      Total
                    </label>
                    <div
                      className="flex h-10 items-center justify-center rounded-xl border text-sm font-bold"
                      style={{ backgroundColor: t.chipBg, borderColor: t.border, color: t.textPrimary }}
                    >
                      {totalDaysNum}d
                    </div>
                  </div>
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
                      style={{ color: t.textMuted }}
                    >
                      Present
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={presentDisplay}
                      onChange={(e) => handlePresentChange(student, e.target.value)}
                      className="h-10 w-full rounded-xl border px-2 text-center text-sm font-semibold outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
                      style={{ color: t.textMuted }}
                    >
                      Absent
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={absentDisplay}
                      onChange={(e) => handleAbsentChange(student, e.target.value)}
                      className="h-10 w-full rounded-xl border px-2 text-center text-sm font-semibold outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isDirty || savingId === student.studentId}
                  onClick={() => handleSave(student)}
                  className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: t.accentPrimary,
                    color: t.pageBg,
                  }}
                >
                  <Save size={15} />
                  {savingId === student.studentId ? 'Saving...' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageAttendanceSection;