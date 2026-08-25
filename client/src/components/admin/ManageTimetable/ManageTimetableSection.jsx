import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Pencil, Trash2, X, BookOpen, Users, School,
  History, ClipboardCheck, Clock, CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import timetableApi from '../../../api/timetableApi';
import moduleApi from '../../../api/moduleApi';
import groupApi from '../../../api/groupApi';
import classroomApi from '../../../api/classroomApi';
import classroomRequestApi from '../../../api/classroomRequestApi';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TYPES = ['Lecture', 'Tutorial', 'Workshop'];
const CHANGE_STATUSES = ['Time Changed', 'Room Changed', 'Rescheduled', 'Cancelled'];
const BADGE_COLORS = ['amber', 'blue', 'purple', 'red'];
const REQUEST_STATUSES = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

const ADMIN_TABS = [
  { id: 'periods', label: 'Class Periods', icon: Calendar },
  { id: 'modules', label: 'Modules & Groups', icon: BookOpen },
  { id: 'classrooms', label: 'Classrooms', icon: School },
  { id: 'changes', label: 'Schedule Changes', icon: History },
  { id: 'requests', label: 'Room Requests', icon: ClipboardCheck },
];

const emptyPeriodForm = {
  day: DAY_ORDER[0], startTime: '', endTime: '', classType: 'Lecture',
  moduleId: '', lecturer: '', groupId: '', roomId: '', order: 0,
};

const emptyClassroomForm = { name: '', capacity: '', facilities: '' };

const emptyChangeForm = {
  periodId: '', newDay: '', newStartTime: '', newEndTime: '', newRoom: '',
  reason: '', effectiveDate: '', publishedBy: '', status: CHANGE_STATUSES[0], badgeColor: BADGE_COLORS[0],
};

const emptyBlockForm = { day: DAY_ORDER[0], startTime: '', endTime: '', reason: '' };

const ManageTimetableSection = ({ t }) => {
  const [tab, setTab] = useState('periods');

  // -------- Shared master data --------
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const loadMasters = () => {
    moduleApi.getModules().then(setModules).catch(() => setModules([]));
    groupApi.getGroups().then(setGroups).catch(() => setGroups([]));
    classroomApi.getClassrooms().then(setClassrooms).catch(() => setClassrooms([]));
  };

  useEffect(() => { loadMasters(); }, []);

  // -------- Periods --------
  const [periods, setPeriods] = useState(null);
  const [periodDay, setPeriodDay] = useState(DAY_ORDER[new Date().getDay()]);
  const [periodModal, setPeriodModal] = useState(null); // { mode: 'add'|'edit', form, editingId }
  const [periodError, setPeriodError] = useState('');
  const [savingPeriod, setSavingPeriod] = useState(false);

  const loadPeriods = () => {
    setPeriods(null);
    timetableApi.getTimetableAdmin().then(setPeriods).catch(() => setPeriods([]));
  };

  useEffect(() => { if (tab === 'periods' && periods === null) loadPeriods(); }, [tab]);
  useEffect(() => { if (tab === 'changes' && periods === null) loadPeriods(); }, [tab]);

  const periodsForDay = (periods || []).filter((p) => p.day === periodDay);

  const openAddPeriod = () => {
    setPeriodModal({ mode: 'add', form: { ...emptyPeriodForm, day: periodDay }, editingId: null });
    setPeriodError('');
  };

  const openEditPeriod = (p) => {
    setPeriodModal({
      mode: 'edit',
      form: {
        day: p.day, startTime: p.startTime, endTime: p.endTime, classType: p.classType,
        moduleId: p.module, lecturer: p.lecturer, groupId: p.group || '', roomId: p.room, order: p.order || 0,
      },
      editingId: p._id,
    });
    setPeriodError('');
  };

  const savePeriod = async () => {
    const f = periodModal.form;
    if (!f.day || !f.startTime.trim() || !f.endTime.trim() || !f.moduleId || !f.lecturer.trim() || !f.roomId) {
      setPeriodError('Day, start time, end time, module, lecturer, and room are required.');
      return;
    }
    setSavingPeriod(true);
    setPeriodError('');
    const payload = {
      day: f.day,
      startTime: f.startTime.trim(),
      endTime: f.endTime.trim(),
      classType: f.classType,
      moduleId: f.moduleId,
      lecturer: f.lecturer.trim(),
      groupId: f.groupId || null,
      roomId: f.roomId,
      order: Number(f.order) || 0,
    };
    try {
      if (periodModal.mode === 'add') {
        await timetableApi.createPeriod(payload);
      } else {
        await timetableApi.updatePeriod(periodModal.editingId, payload);
      }
      setPeriodModal(null);
      loadPeriods();
    } catch (err) {
      setPeriodError(err?.response?.data?.message || 'Could not save period.');
    } finally {
      setSavingPeriod(false);
    }
  };

  const deletePeriod = async (id) => {
    try {
      await timetableApi.deletePeriod(id);
      loadPeriods();
    } catch {
      // list stays as-is; user can retry
    }
  };

  // -------- Modules --------
  const [moduleModal, setModuleModal] = useState(null); // { mode, form: {code, name}, editingId }
  const [moduleError, setModuleError] = useState('');
  const [savingModule, setSavingModule] = useState(false);

  const openAddModule = () => { setModuleModal({ mode: 'add', form: { code: '', name: '' }, editingId: null }); setModuleError(''); };
  const openEditModule = (m) => { setModuleModal({ mode: 'edit', form: { code: m.code, name: m.name }, editingId: m._id }); setModuleError(''); };

  const saveModule = async () => {
    const f = moduleModal.form;
    if (!f.code.trim() || !f.name.trim()) { setModuleError('Code and name are required.'); return; }
    setSavingModule(true); setModuleError('');
    try {
      const payload = { code: f.code.trim(), name: f.name.trim() };
      if (moduleModal.mode === 'add') await moduleApi.createModule(payload);
      else await moduleApi.updateModule(moduleModal.editingId, payload);
      setModuleModal(null);
      loadMasters();
    } catch (err) {
      setModuleError(err?.response?.data?.message || 'Could not save module.');
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = async (id) => {
    try { await moduleApi.deleteModule(id); loadMasters(); } catch { /* keep list as-is */ }
  };

  // -------- Groups --------
  const [groupModal, setGroupModal] = useState(null); // { mode, form: {name}, editingId }
  const [groupError, setGroupError] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  const openAddGroup = () => { setGroupModal({ mode: 'add', form: { name: '' }, editingId: null }); setGroupError(''); };
  const openEditGroup = (g) => { setGroupModal({ mode: 'edit', form: { name: g.name }, editingId: g._id }); setGroupError(''); };

  const saveGroup = async () => {
    const f = groupModal.form;
    if (!f.name.trim()) { setGroupError('Name is required.'); return; }
    setSavingGroup(true); setGroupError('');
    try {
      const payload = { name: f.name.trim() };
      if (groupModal.mode === 'add') await groupApi.createGroup(payload);
      else await groupApi.updateGroup(groupModal.editingId, payload);
      setGroupModal(null);
      loadMasters();
    } catch (err) {
      setGroupError(err?.response?.data?.message || 'Could not save group.');
    } finally {
      setSavingGroup(false);
    }
  };

  const deleteGroup = async (id) => {
    try { await groupApi.deleteGroup(id); loadMasters(); } catch { /* keep list as-is */ }
  };

  // -------- Classrooms --------
  const [classroomModal, setClassroomModal] = useState(null); // { mode, form: {name, capacity, facilities}, editingId }
  const [classroomError, setClassroomError] = useState('');
  const [savingClassroom, setSavingClassroom] = useState(false);

  const openAddClassroom = () => { setClassroomModal({ mode: 'add', form: { ...emptyClassroomForm }, editingId: null }); setClassroomError(''); };
  const openEditClassroom = (c) => {
    setClassroomModal({
      mode: 'edit',
      form: { name: c.name, capacity: c.capacity ?? '', facilities: c.facilities || '' },
      editingId: c._id,
    });
    setClassroomError('');
  };

  const saveClassroom = async () => {
    const f = classroomModal.form;
    if (!f.name.trim() || !f.capacity) { setClassroomError('Name and capacity are required.'); return; }
    setSavingClassroom(true); setClassroomError('');
    try {
      const payload = { name: f.name.trim(), capacity: Number(f.capacity), facilities: f.facilities.trim() };
      if (classroomModal.mode === 'add') await classroomApi.createClassroom(payload);
      else await classroomApi.updateClassroom(classroomModal.editingId, payload);
      setClassroomModal(null);
      loadMasters();
    } catch (err) {
      setClassroomError(err?.response?.data?.message || 'Could not save classroom.');
    } finally {
      setSavingClassroom(false);
    }
  };

  const deleteClassroom = async (id) => {
    try { await classroomApi.deleteClassroom(id); loadMasters(); } catch { /* keep list as-is */ }
  };

  // -------- Classroom manual blocks --------
  const [blockModal, setBlockModal] = useState(null); // { classroomId, classroomName } or null
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [blockError, setBlockError] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);

  // Derived live from `classrooms`, so it stays in sync after every loadMasters() refresh.
  const activeBlockClassroom = blockModal
    ? classrooms.find((c) => c._id === blockModal.classroomId)
    : null;
  const activeBlocks = activeBlockClassroom?.manualBlocks || [];

  const openBlockManager = (classroom) => {
    setBlockModal({ classroomId: classroom._id, classroomName: classroom.name });
    setBlockForm(emptyBlockForm);
    setBlockError('');
  };

  const addBlock = async () => {
    if (!blockForm.day || !blockForm.startTime.trim() || !blockForm.endTime.trim()) {
      setBlockError('Day, start time, and end time are required.');
      return;
    }
    setSavingBlock(true);
    setBlockError('');
    try {
      await classroomApi.addManualBlock(blockModal.classroomId, {
        day: blockForm.day,
        startTime: blockForm.startTime.trim(),
        endTime: blockForm.endTime.trim(),
        reason: blockForm.reason.trim(),
      });
      loadMasters();
      setBlockForm(emptyBlockForm);
    } catch (err) {
      setBlockError(err?.response?.data?.message || 'Could not add block.');
    } finally {
      setSavingBlock(false);
    }
  };

  const removeBlock = async (blockId) => {
    try {
      await classroomApi.removeManualBlock(blockModal.classroomId, blockId);
      loadMasters();
    } catch {
      // list stays as-is; user can retry
    }
  };

  // -------- Schedule Changes --------
  const [changes, setChanges] = useState(null);
  const [changeModal, setChangeModal] = useState(null); // { mode, form, editingId }
  const [changeError, setChangeError] = useState('');
  const [savingChange, setSavingChange] = useState(false);

  const loadChanges = () => {
    setChanges(null);
    timetableApi.getScheduleChangesAdmin().then(setChanges).catch(() => setChanges([]));
  };

  useEffect(() => { if (tab === 'changes') loadChanges(); }, [tab]);

  const openAddChange = () => { setChangeModal({ mode: 'add', form: { ...emptyChangeForm }, editingId: null }); setChangeError(''); };
  const openEditChange = (c) => {
    setChangeModal({
      mode: 'edit',
      form: {
        periodId: c.period || '', newDay: c.newDay || '', newStartTime: c.newStartTime || '',
        newEndTime: c.newEndTime || '', newRoom: c.newRoom || '', reason: c.reason || '',
        effectiveDate: c.effectiveDate || '', publishedBy: c.publishedBy || '',
        status: c.status || CHANGE_STATUSES[0], badgeColor: c.badgeColor || BADGE_COLORS[0],
      },
      editingId: c._id,
    });
    setChangeError('');
  };

  const saveChange = async () => {
    const f = changeModal.form;
    if (!f.periodId || !f.reason.trim() || !f.effectiveDate.trim() || !f.publishedBy.trim()) {
      setChangeError('Period, reason, effective date, and published by are required.');
      return;
    }
    setSavingChange(true); setChangeError('');
    const payload = { ...f, reason: f.reason.trim(), effectiveDate: f.effectiveDate.trim(), publishedBy: f.publishedBy.trim() };
    try {
      if (changeModal.mode === 'add') await timetableApi.createScheduleChange(payload);
      else await timetableApi.updateScheduleChange(changeModal.editingId, payload);
      setChangeModal(null);
      loadChanges();
    } catch (err) {
      setChangeError(err?.response?.data?.message || 'Could not save schedule change.');
    } finally {
      setSavingChange(false);
    }
  };

  const deleteChange = async (id) => {
    try { await timetableApi.deleteScheduleChange(id); loadChanges(); } catch { /* keep list as-is */ }
  };

  const periodLabel = (p) => `${p.day.slice(0, 3)} ${p.startTime}–${p.endTime} · ${p.moduleCode} · ${p.roomName}`;

  // -------- Room Requests --------
  const [requests, setRequests] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({}); // { [requestId]: note }

  const loadRequests = () => {
    setRequests(null);
    classroomRequestApi.getAllRequests().then(setRequests).catch(() => setRequests([]));
  };

  useEffect(() => { if (tab === 'requests') loadRequests(); }, [tab]);

  const reviewRequest = async (id, status) => {
    setReviewingId(id);
    try {
      await classroomRequestApi.reviewRequest(id, { status, reviewNote: reviewNotes[id] || '' });
      loadRequests();
    } catch {
      // list stays as-is; user can retry
    } finally {
      setReviewingId(null);
    }
  };

  const pendingRequests = (requests || []).filter((r) => r.status === 'pending');
  const reviewedRequests = (requests || []).filter((r) => r.status !== 'pending');

  // -------- Shared modal input style helper --------
  const inputStyle = { borderColor: t.border, backgroundColor: t.pageBg, color: t.textPrimary };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.chipBg }}>
          <Clock size={19} style={{ color: t.textPrimary }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Timetable</h2>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: t.textMuted }}>
            Periods, modules, groups, classrooms, changes &amp; room requests
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors"
            style={{
              backgroundColor: tab === id ? t.accentPrimary : 'transparent',
              color: tab === id ? t.pageBg : t.textPrimary,
            }}
          >
            <Icon size={14} /> {label}
            {id === 'requests' && pendingRequests.length > 0 && (
              <span
                className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ backgroundColor: tab === id ? t.pageBg : t.accentPrimary, color: tab === id ? t.accentPrimary : t.pageBg }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ===================== CLASS PERIODS ===================== */}
      {tab === 'periods' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {DAY_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPeriodDay(day)}
                  className="rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: periodDay === day ? t.accentPrimary : t.cardBg,
                    borderColor: periodDay === day ? t.accentPrimary : t.border,
                    color: periodDay === day ? t.pageBg : t.textPrimary,
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={openAddPeriod}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <Plus size={14} /> Add Period
            </button>
          </div>

          {periods === null && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading periods...
            </div>
          )}

          {periods !== null && periodsForDay.length === 0 && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
              No periods on {periodDay} yet.
            </div>
          )}

          {periods !== null && periodsForDay.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {periodsForDay.map((p) => (
                <div key={p._id} className="rounded-xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tabular-nums" style={{ color: t.textMuted }}>
                      {p.startTime} – {p.endTime}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditPeriod(p)}>
                        <Pencil size={14} style={{ color: t.textMuted }} />
                      </button>
                      <button type="button" onClick={() => deletePeriod(p._id)}>
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                    {p.moduleCode}{p.groupName ? ` · ${p.groupName}` : ''}
                  </p>
                  <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>{p.moduleName}</p>
                  <div className="mt-2 space-y-1 text-xs" style={{ color: t.textMuted }}>
                    <p>{p.classType} · {p.lecturer}</p>
                    <p>{p.roomName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit period modal */}
          {periodModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {periodModal.mode === 'add' ? 'Add Period' : 'Edit Period'}
                  </h4>
                  <button type="button" onClick={() => setPeriodModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>

                <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Day</label>
                    <select
                      value={periodModal.form.day}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, day: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>Start time</label>
                      <input
                        value={periodModal.form.startTime}
                        onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, startTime: e.target.value } })}
                        placeholder="8:00 AM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>End time</label>
                      <input
                        value={periodModal.form.endTime}
                        onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, endTime: e.target.value } })}
                        placeholder="10:00 AM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Class type</label>
                    <select
                      value={periodModal.form.classType}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, classType: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      {CLASS_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Module</label>
                    <select
                      value={periodModal.form.moduleId}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, moduleId: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">Select module...</option>
                      {modules.map((m) => <option key={m._id} value={m._id}>{m.code} — {m.name}</option>)}
                    </select>
                    {modules.length === 0 && (
                      <p className="mt-1 text-[11px]" style={{ color: t.textMuted }}>
                        No modules yet — add one in the "Modules & Groups" tab first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Lecturer</label>
                    <input
                      value={periodModal.form.lecturer}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, lecturer: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Group (optional)</label>
                    <select
                      value={periodModal.form.groupId}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, groupId: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">None</option>
                      {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Room</label>
                    <select
                      value={periodModal.form.roomId}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, roomId: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">Select room...</option>
                      {classrooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                    {classrooms.length === 0 && (
                      <p className="mt-1 text-[11px]" style={{ color: t.textMuted }}>
                        No classrooms yet — add one in the "Classrooms" tab first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Order (optional, for sorting same-time cards)</label>
                    <input
                      type="number"
                      value={periodModal.form.order}
                      onChange={(e) => setPeriodModal({ ...periodModal, form: { ...periodModal.form, order: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  {periodError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{periodError}</p>}

                  <button
                    type="button"
                    disabled={savingPeriod}
                    onClick={savePeriod}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingPeriod ? 'Saving...' : periodModal.mode === 'add' ? 'Add Period' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODULES & GROUPS ===================== */}
      {tab === 'modules' && (
        <div className="space-y-8">
          {/* Modules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>
                <BookOpen size={15} /> Modules
              </h3>
              <button
                type="button"
                onClick={openAddModule}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: t.accentPrimary }}
              >
                <Plus size={13} /> Add Module
              </button>
            </div>

            {modules.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                No modules yet.
              </div>
            )}

            {modules.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modules.map((m) => (
                  <div key={m._id} className="flex items-center justify-between rounded-xl border p-3.5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>{m.code}</p>
                      <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>{m.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditModule(m)}>
                        <Pencil size={14} style={{ color: t.textMuted }} />
                      </button>
                      <button type="button" onClick={() => deleteModule(m._id)}>
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>
                <Users size={15} /> Groups
              </h3>
              <button
                type="button"
                onClick={openAddGroup}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: t.accentPrimary }}
              >
                <Plus size={13} /> Add Group
              </button>
            </div>

            {groups.length === 0 && (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                No groups yet.
              </div>
            )}

            {groups.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groups.map((g) => (
                  <div key={g._id} className="flex items-center justify-between rounded-xl border p-3.5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                    <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{g.name}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditGroup(g)}>
                        <Pencil size={14} style={{ color: t.textMuted }} />
                      </button>
                      <button type="button" onClick={() => deleteGroup(g._id)}>
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module modal */}
          {moduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {moduleModal.mode === 'add' ? 'Add Module' : 'Edit Module'}
                  </h4>
                  <button type="button" onClick={() => setModuleModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Code</label>
                    <input
                      value={moduleModal.form.code}
                      onChange={(e) => setModuleModal({ ...moduleModal, form: { ...moduleModal.form, code: e.target.value } })}
                      placeholder="4CS001"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Name</label>
                    <input
                      value={moduleModal.form.name}
                      onChange={(e) => setModuleModal({ ...moduleModal, form: { ...moduleModal.form, name: e.target.value } })}
                      placeholder="Introductory Programming and Problem Solving"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  {moduleError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{moduleError}</p>}
                  <button
                    type="button"
                    disabled={savingModule}
                    onClick={saveModule}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingModule ? 'Saving...' : moduleModal.mode === 'add' ? 'Add Module' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Group modal */}
          {groupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {groupModal.mode === 'add' ? 'Add Group' : 'Edit Group'}
                  </h4>
                  <button type="button" onClick={() => setGroupModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Name</label>
                    <input
                      value={groupModal.form.name}
                      onChange={(e) => setGroupModal({ ...groupModal, form: { ...groupModal.form, name: e.target.value } })}
                      placeholder="Section A + Section B"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  {groupError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{groupError}</p>}
                  <button
                    type="button"
                    disabled={savingGroup}
                    onClick={saveGroup}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingGroup ? 'Saving...' : groupModal.mode === 'add' ? 'Add Group' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== CLASSROOMS ===================== */}
      {tab === 'classrooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={openAddClassroom}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <Plus size={14} /> Add Classroom
            </button>
          </div>

          {classrooms.length === 0 && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
              No classrooms yet.
            </div>
          )}

          {classrooms.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classrooms.map((c) => (
                <div key={c._id} className="rounded-xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>{c.name}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditClassroom(c)}>
                        <Pencil size={14} style={{ color: t.textMuted }} />
                      </button>
                      <button type="button" onClick={() => deleteClassroom(c._id)}>
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>Capacity: {c.capacity}</p>
                  {c.facilities && <p className="mt-1 text-xs" style={{ color: t.textMuted }}>{c.facilities}</p>}
                  {c.manualBlocks?.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold" style={{ color: '#b45309' }}>
                      <Lock size={11} /> {c.manualBlocks.length} manual block{c.manualBlocks.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => openBlockManager(c)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: t.border, color: t.textPrimary }}
                  >
                    <Lock size={13} /> Manage Blocks
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit classroom modal */}
          {classroomModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {classroomModal.mode === 'add' ? 'Add Classroom' : 'Edit Classroom'}
                  </h4>
                  <button type="button" onClick={() => setClassroomModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Name</label>
                    <input
                      value={classroomModal.form.name}
                      onChange={(e) => setClassroomModal({ ...classroomModal, form: { ...classroomModal.form, name: e.target.value } })}
                      placeholder="LT-01 Wulfurna"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Capacity</label>
                    <input
                      type="number"
                      value={classroomModal.form.capacity}
                      onChange={(e) => setClassroomModal({ ...classroomModal, form: { ...classroomModal.form, capacity: e.target.value } })}
                      placeholder="120"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Facilities (optional)</label>
                    <input
                      value={classroomModal.form.facilities}
                      onChange={(e) => setClassroomModal({ ...classroomModal, form: { ...classroomModal.form, facilities: e.target.value } })}
                      placeholder="Projector, AC, Whiteboard"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  {classroomError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{classroomError}</p>}
                  <button
                    type="button"
                    disabled={savingClassroom}
                    onClick={saveClassroom}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingClassroom ? 'Saving...' : classroomModal.mode === 'add' ? 'Add Classroom' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Blocks modal */}
          {blockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    Manage Blocks — {blockModal.classroomName}
                  </h4>
                  <button type="button" onClick={() => setBlockModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>

                <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                  Manually reserve this room for maintenance, events, or admin use — separate from real class periods.
                </p>

                <div className="mt-4 space-y-2">
                  {activeBlocks.length === 0 && (
                    <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                      No manual blocks for this room yet.
                    </div>
                  )}

                  {activeBlocks.length > 0 && (
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {activeBlocks.map((b) => (
                        <div key={b._id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                          <div className="min-w-0">
                            <p className="text-xs font-bold" style={{ color: t.textPrimary }}>
                              {b.day} · {b.startTime}–{b.endTime}
                            </p>
                            {b.reason && <p className="truncate text-[11px]" style={{ color: t.textMuted }}>{b.reason}</p>}
                          </div>
                          <button type="button" onClick={() => removeBlock(b._id)}>
                            <Trash2 size={13} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: t.border }}>
                  <p className="text-xs font-bold" style={{ color: t.textPrimary }}>Add new block</p>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Day</label>
                    <select
                      value={blockForm.day}
                      onChange={(e) => setBlockForm({ ...blockForm, day: e.target.value })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>Start time</label>
                      <input
                        value={blockForm.startTime}
                        onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                        placeholder="2:00 PM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>End time</label>
                      <input
                        value={blockForm.endTime}
                        onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                        placeholder="4:00 PM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Reason (optional)</label>
                    <input
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                      placeholder="Maintenance / Event booking"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  {blockError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{blockError}</p>}

                  <button
                    type="button"
                    disabled={savingBlock}
                    onClick={addBlock}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingBlock ? 'Adding...' : 'Add Block'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== SCHEDULE CHANGES ===================== */}
      {tab === 'changes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={openAddChange}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <Plus size={14} /> Add Change
            </button>
          </div>

          {changes === null && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading schedule changes...
            </div>
          )}

          {changes !== null && changes.length === 0 && (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
              No schedule changes published.
            </div>
          )}

          {changes !== null && changes.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {changes.map((c) => (
                <div key={c._id} className="rounded-xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                  <div className="flex items-start justify-between">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: t.chipBg, color: t.textPrimary }}
                    >
                      {c.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditChange(c)}>
                        <Pencil size={14} style={{ color: t.textMuted }} />
                      </button>
                      <button type="button" onClick={() => deleteChange(c._id)}>
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>
                    {c.moduleCode} — {c.moduleName}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                    {c.originalDay} {c.originalStartTime}–{c.originalEndTime} · {c.originalRoom}
                    {c.newRoom ? ` → ${c.newRoom}` : ''}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: t.textMuted }}>{c.reason}</p>
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: t.textMuted }}>
                    Effective {c.effectiveDate} · {c.publishedBy}
                  </p>
                </div>
              ))}
            </div>
          )}

          {changeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                    {changeModal.mode === 'add' ? 'Add Schedule Change' : 'Edit Schedule Change'}
                  </h4>
                  <button type="button" onClick={() => setChangeModal(null)}>
                    <X size={16} style={{ color: t.textMuted }} />
                  </button>
                </div>

                <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Period</label>
                    <select
                      value={changeModal.form.periodId}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, periodId: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">Select period...</option>
                      {(periods || []).map((p) => (
                        <option key={p._id} value={p._id}>{periodLabel(p)}</option>
                      ))}
                    </select>
                    {(periods || []).length === 0 && (
                      <p className="mt-1 text-[11px]" style={{ color: t.textMuted }}>
                        No periods yet — add one in the "Class Periods" tab first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Status</label>
                    <select
                      value={changeModal.form.status}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, status: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      {CHANGE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Badge color</label>
                    <select
                      value={changeModal.form.badgeColor}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, badgeColor: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      {BADGE_COLORS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>
                    New details (leave blank for whichever didn't change)
                  </p>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>New day</label>
                    <select
                      value={changeModal.form.newDay}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, newDay: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">No change</option>
                      {DAY_ORDER.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>New start time</label>
                      <input
                        value={changeModal.form.newStartTime}
                        onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, newStartTime: e.target.value } })}
                        placeholder="e.g. 2:00 PM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold" style={{ color: t.textMuted }}>New end time</label>
                      <input
                        value={changeModal.form.newEndTime}
                        onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, newEndTime: e.target.value } })}
                        placeholder="e.g. 4:00 PM"
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>New room</label>
                    <select
                      value={changeModal.form.newRoom}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, newRoom: e.target.value } })}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    >
                      <option value="">No change</option>
                      {classrooms.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Reason</label>
                    <input
                      value={changeModal.form.reason}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, reason: e.target.value } })}
                      placeholder="Water leakage in LT-01"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Effective date</label>
                    <input
                      value={changeModal.form.effectiveDate}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, effectiveDate: e.target.value } })}
                      placeholder="Aug 24, 2026"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold" style={{ color: t.textMuted }}>Published by</label>
                    <input
                      value={changeModal.form.publishedBy}
                      onChange={(e) => setChangeModal({ ...changeModal, form: { ...changeModal.form, publishedBy: e.target.value } })}
                      placeholder="RTE Department (Registry & Timetabling)"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style={inputStyle}
                    />
                  </div>

                  {changeError && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{changeError}</p>}

                  <button
                    type="button"
                    disabled={savingChange}
                    onClick={saveChange}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
                    style={{ backgroundColor: t.accentPrimary }}
                  >
                    {savingChange ? 'Saving...' : changeModal.mode === 'add' ? 'Publish Change' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== ROOM REQUESTS ===================== */}
      {tab === 'requests' && (
        <div className="space-y-6">
          {requests === null && (
            <div className="rounded-2xl border px-4 py-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading requests...
            </div>
          )}

          {requests !== null && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                  Pending ({pendingRequests.length})
                </h3>

                {pendingRequests.length === 0 && (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                    No pending requests.
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {pendingRequests.map((r) => (
                      <div key={r._id} className="rounded-xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                        <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>
                          {r.classroomName || r.classroom?.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
                          {r.day} · {r.startTime}–{r.endTime}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                          Requested by {r.studentName || r.student?.name || 'Student'}
                        </p>
                        {r.reason && <p className="mt-2 text-xs" style={{ color: t.textMuted }}>"{r.reason}"</p>}

                        <input
                          value={reviewNotes[r._id] || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [r._id]: e.target.value })}
                          placeholder="Review note (optional)"
                          className="mt-3 w-full rounded-lg border px-3 py-2 text-xs"
                          style={inputStyle}
                        />

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={reviewingId === r._id}
                            onClick={() => reviewRequest(r._id, 'approved')}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white disabled:opacity-70"
                            style={{ backgroundColor: '#16a34a' }}
                          >
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewingId === r._id}
                            onClick={() => reviewRequest(r._id, 'rejected')}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white disabled:opacity-70"
                            style={{ backgroundColor: '#dc2626' }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold" style={{ color: t.textPrimary }}>
                  Reviewed ({reviewedRequests.length})
                </h3>

                {reviewedRequests.length === 0 && (
                  <div className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
                    No reviewed requests yet.
                  </div>
                )}

                {reviewedRequests.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {reviewedRequests.map((r) => (
                      <div key={r._id} className="flex items-center justify-between rounded-xl border p-3.5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
                        <div>
                          <p className="text-sm font-bold leading-tight" style={{ color: t.textPrimary }}>
                            {r.classroomName || r.classroom?.name}
                          </p>
                          <p className="text-xs" style={{ color: t.textMuted }}>
                            {r.day} · {r.startTime}–{r.endTime}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: r.status === 'approved' ? '#dcfce7' : '#fee2e2',
                            color: r.status === 'approved' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {REQUEST_STATUSES[r.status] || r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageTimetableSection;