import { useState, useEffect } from 'react';
import { Save, Search, Users } from 'lucide-react';
import attendanceApi from '../../../api/attendanceApi';
import toast from 'react-hot-toast';

const ManageAttendanceSection = ({ t }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editValues, setEditValues] = useState({}); // { [studentId]: { totalDays, present, absent } } — kept as STRINGS while editing
  const [savingId, setSavingId] = useState(null);

  const loadStudents = () => {
    setLoading(true);
    attendanceApi.getAllStudents()
      .then((data) => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => toast.error('Failed to load attendance data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const getDisplayValue = (student, field) => {
    const edited = editValues[student.studentId];
    if (edited && edited[field] !== undefined) return edited[field];
    return String(student[field]);
  };

  const getNumericValue = (student, field) => {
    const raw = getDisplayValue(student, field);
    const n = Number(raw);
    return raw === '' || Number.isNaN(n) ? 0 : n;
  };

  const handleFieldChange = (studentId, field, rawValue) => {
    if (rawValue !== '' && !/^\d+$/.test(rawValue)) return;
    setEditValues((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: rawValue },
    }));
  };

  const handleBlur = (studentId, field) => {
    setEditValues((prev) => {
      const current = prev[studentId]?.[field];
      if (current === '') {
        return { ...prev, [studentId]: { ...prev[studentId], [field]: '0' } };
      }
      return prev;
    });
  };

  const computePercentage = (present, totalDays) => {
    if (totalDays <= 0) return 0;
    return Math.min(100, Math.round((present / totalDays) * 100));
  };

  const handleSave = async (student) => {
    const totalDays = getNumericValue(student, 'totalDays');
    const present = getNumericValue(student, 'present');
    const absent = getNumericValue(student, 'absent');
    const sum = present + absent;

    if (sum !== totalDays) {
      toast.error(`${present} + ${absent} = ${sum}, not ${totalDays}. Fix before saving.`);
      return;
    }

    setSavingId(student.studentId);
    try {
      await attendanceApi.updateStudentAttendance(student.studentId, { totalDays, present, absent });
      toast.success(`Attendance updated for ${student.username}`);
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[student.studentId];
        return next;
      });
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSavingId(null);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderInput = (student, field, displayValue, hasMismatch) => (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={(e) => handleFieldChange(student.studentId, field, e.target.value)}
      onBlur={() => handleBlur(student.studentId, field)}
      className="w-full rounded-lg border px-2 py-1.5 text-sm sm:w-20"
      style={{
        backgroundColor: t.pageBg,
        borderColor: hasMismatch ? '#ef4444' : t.border,
        color: t.textPrimary,
      }}
    />
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <Users size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Attendance</h2>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border py-2.5 pl-11 pr-4 text-sm outline-none"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textPrimary }}
        />
      </div>

      {loading && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          Loading attendance data...
        </div>
      )}

      {!loading && filteredStudents.length === 0 && (
        <div
          className="rounded-2xl border px-4 py-6 text-center text-sm"
          style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}
        >
          No students found.
        </div>
      )}

      {/* ===== Desktop / tablet: table (hidden on mobile) ===== */}
      {!loading && filteredStudents.length > 0 && (
        <div
          className="hidden overflow-x-auto rounded-2xl border sm:block"
          style={{ backgroundColor: t.cardBg, borderColor: t.border }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-bold uppercase tracking-wide" style={{ borderColor: t.border, color: t.textMuted }}>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Total Days</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const totalDaysDisplay = getDisplayValue(student, 'totalDays');
                const presentDisplay = getDisplayValue(student, 'present');
                const absentDisplay = getDisplayValue(student, 'absent');
                const totalDaysNum = getNumericValue(student, 'totalDays');
                const presentNum = getNumericValue(student, 'present');
                const absentNum = getNumericValue(student, 'absent');
                const sum = presentNum + absentNum;
                const percentage = computePercentage(presentNum, totalDaysNum);
                const isDirty = !!editValues[student.studentId];
                const sumMismatch = isDirty && sum !== totalDaysNum;

                return (
                  <tr key={student.studentId} className="border-b last:border-0 align-top" style={{ borderColor: t.border }}>
                    <td className="px-4 py-3">
                      <p className="font-bold" style={{ color: t.textPrimary }}>{student.username}</p>
                      <p className="text-xs" style={{ color: t.textMuted }}>{student.email}</p>
                    </td>
                    <td className="px-4 py-3">{renderInput(student, 'totalDays', totalDaysDisplay, sumMismatch)}</td>
                    <td className="px-4 py-3">{renderInput(student, 'present', presentDisplay, sumMismatch)}</td>
                    <td className="px-4 py-3">{renderInput(student, 'absent', absentDisplay, sumMismatch)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        {percentage}%
                      </span>
                      {sumMismatch && (
                        <p className="mt-1 text-[10px] font-semibold text-red-500">
                          {presentNum} + {absentNum} = {sum}, not {totalDaysNum}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={!isDirty || savingId === student.studentId}
                        onClick={() => handleSave(student)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Save size={13} />
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

      {/* ===== Mobile: stacked cards (hidden on sm+) ===== */}
      {!loading && filteredStudents.length > 0 && (
        <div className="space-y-3 sm:hidden">
          {filteredStudents.map((student) => {
            const totalDaysDisplay = getDisplayValue(student, 'totalDays');
            const presentDisplay = getDisplayValue(student, 'present');
            const absentDisplay = getDisplayValue(student, 'absent');
            const totalDaysNum = getNumericValue(student, 'totalDays');
            const presentNum = getNumericValue(student, 'present');
            const absentNum = getNumericValue(student, 'absent');
            const sum = presentNum + absentNum;
            const percentage = computePercentage(presentNum, totalDaysNum);
            const isDirty = !!editValues[student.studentId];
            const sumMismatch = isDirty && sum !== totalDaysNum;

            return (
              <div
                key={student.studentId}
                className="rounded-2xl border p-4"
                style={{ backgroundColor: t.cardBg, borderColor: t.border }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold" style={{ color: t.textPrimary }}>{student.username}</p>
                    <p className="truncate text-xs" style={{ color: t.textMuted }}>{student.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {percentage}%
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      Total
                    </label>
                    {renderInput(student, 'totalDays', totalDaysDisplay, sumMismatch)}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      Present
                    </label>
                    {renderInput(student, 'present', presentDisplay, sumMismatch)}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                      Absent
                    </label>
                    {renderInput(student, 'absent', absentDisplay, sumMismatch)}
                  </div>
                </div>

                {sumMismatch && (
                  <p className="mt-2 text-[11px] font-semibold text-red-500">
                    {presentNum} + {absentNum} = {sum}, not {totalDaysNum}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!isDirty || savingId === student.studentId}
                  onClick={() => handleSave(student)}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-black py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Save size={13} />
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