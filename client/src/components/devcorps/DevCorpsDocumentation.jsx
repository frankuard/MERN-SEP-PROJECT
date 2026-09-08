import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import devcorpsApi from '../../api/devcorpsApi';
import { communityByAccount, DEV_CORPS_COMMUNITIES } from '../../data/devcorpsConfig';

const ACCENT = '#9333ea';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PointsInput = ({ value, max, onCommit }) => {
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = Number(draft);
    const clamped = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 0), max)
      : value;
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      type="number"
      min={0}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className="h-7 w-14 rounded-lg border text-center text-xs font-bold outline-none"
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
      aria-label="Points"
    />
  );
};

const WorkshopsControl = ({ count, onCommit }) => {
  const [draft, setDraft] = useState(String(count));

  const commit = () => {
    const parsed = Number(draft);
    const clamped = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : count;
    setDraft(String(clamped));
    if (clamped !== count) onCommit(clamped);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onCommit(Math.max(0, count - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-lg border text-lg font-extrabold transition-colors hover:bg-black/5"
        style={{ borderColor: '#e5e7eb', color: '#111827', backgroundColor: '#ffffff' }}
        aria-label="Decrease workshops count"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="h-9 w-16 rounded-lg border bg-white text-center text-lg font-extrabold outline-none"
        style={{ borderColor: '#e5e7eb', color: '#111827' }}
        aria-label="Workshops completed count"
      />
      <button
        type="button"
        onClick={() => onCommit(count + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border text-lg font-extrabold transition-colors hover:bg-black/5"
        style={{ borderColor: '#e5e7eb', color: '#111827', backgroundColor: '#ffffff' }}
        aria-label="Increase workshops count"
      >
        +
      </button>
    </div>
  );
};

const TaskRow = ({
  index,
  task,
  scoring,
  canEdit,
  editing,
  onToggle,
  onPoints,
  onLabelStart,
  onLabelDraft,
  onLabelSave,
  onLabelCancel,
}) => {
  return (
    <div
      className="rounded-xl border p-2.5 transition-colors"
      style={{
        borderColor: scoring && task.completed ? `${ACCENT}55` : '#e5e7eb',
        backgroundColor: scoring && task.completed ? `${ACCENT}0F` : '#fafafa',
      }}
    >
      <div className="flex items-center gap-2">
        {scoring ? (
          <button
            type="button"
            onClick={() => canEdit && onToggle(task)}
            disabled={!canEdit}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-60"
            style={{
              backgroundColor: task.completed ? ACCENT : 'transparent',
              borderColor: task.completed ? ACCENT : '#cbd5e1',
              color: '#ffffff',
            }}
          >
            {task.completed && <Check size={12} strokeWidth={3} />}
          </button>
        ) : (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold"
            style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        )}

        {editing ? (
          <input
            type="text"
            value={editing.label}
            onChange={(e) => onLabelDraft(editing.order, editing.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onLabelSave(editing);
              if (e.key === 'Escape') onLabelCancel();
            }}
            className="h-7 min-w-0 flex-1 rounded-lg border px-2 text-[12px] font-semibold outline-none"
            style={{ borderColor: ACCENT, color: '#111827', backgroundColor: '#ffffff' }}
            autoFocus
            aria-label="Section label"
          />
        ) : (
          <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug" style={{ color: '#1f2937' }}>
            {task.label}
          </span>
        )}

        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => onLabelStart(task)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: '#64748b' }}
            aria-label="Edit section"
            title="Edit section"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>

      {scoring && (
        <div className="mt-2 flex items-center justify-between gap-2 pl-7">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: task.completed ? '#dcfce7' : '#f1f5f9',
              color: task.completed ? '#15803d' : '#64748b',
            }}
          >
            {task.completed ? 'Completed' : 'Pending'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#64748b' }}>
            {canEdit ? (
              <PointsInput value={task.points} max={task.maxPoints} onCommit={(points) => onPoints(task, points)} />
            ) : (
              <span className="font-extrabold" style={{ color: ACCENT }}>{task.points}</span>
            )}
            <span>/ {task.maxPoints} pts</span>
          </div>
        </div>
      )}
    </div>
  );
};

const EventColumn = ({
  event,
  scoring,
  canEdit,
  editing,
  editingTask,
  onStartRename,
  onCancelRename,
  onRename,
  onRemoveCard,
  onToggle,
  onPoints,
  onLabelStart,
  onLabelDraft,
  onLabelSave,
  onLabelCancel,
}) => {
  const done = (event.tasks || []).filter((task) => task.completed).length;
  const earned = (event.tasks || []).reduce((sum, task) => sum + (Number(task.points) || 0), 0);
  const max = (event.tasks || []).reduce((sum, task) => sum + (Number(task.maxPoints) || 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border p-4" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold"
          style={{ backgroundColor: ACCENT, color: '#ffffff' }}
        >
          {String(event.order).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editing.title}
                onChange={(e) => onCancelRename(editing.order, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onRename(editing); if (e.key === 'Escape') onCancelRename(null); }}
                className="h-7 w-full rounded-lg border px-2 text-[13px] font-bold outline-none"
                style={{ borderColor: ACCENT, color: '#111827', backgroundColor: '#ffffff' }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => onRename(editing)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                style={{ color: '#15803d' }}
                aria-label="Save event name"
              >
                <Check size={14} strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => onCancelRename(null)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                style={{ color: '#64748b' }}
                aria-label="Cancel rename"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <h4 className="truncate text-[13px] font-extrabold" style={{ color: '#111827' }}>{event.title}</h4>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onStartRename(event)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center transition-colors hover:bg-black/5"
                  style={{ color: '#64748b' }}
                  aria-label="Rename event"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => onRemoveCard(event)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-50"
            style={{ color: '#ef4444' }}
            aria-label="Remove card"
            title="Remove card"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between pl-8 text-[11px] font-semibold" style={{ color: '#64748b' }}>
        {scoring ? (
          <>
            <span>{done} / {event.tasks.length} tasks done</span>
            <span><span className="font-extrabold" style={{ color: ACCENT }}>{earned}</span> / {max} pts</span>
          </>
        ) : (
          <span>{event.tasks.length} sections</span>
        )}
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {(event.tasks || []).map((task, index) => (
          <TaskRow
            key={task.key}
            order={event.order}
            index={index}
            task={task}
            scoring={scoring}
            canEdit={canEdit}
            editing={editingTask?.order === event.order && editingTask?.key === task.key ? editingTask : null}
            onToggle={(task) => onToggle(event.order, task)}
            onPoints={(task, points) => onPoints(event.order, task, points)}
            onLabelStart={(task) => onLabelStart(event.order, task)}
            onLabelDraft={onLabelDraft}
            onLabelSave={onLabelSave}
            onLabelCancel={onLabelCancel}
          />
        ))}
      </div>
    </div>
  );
};

const DevCorpsDocumentation = ({ t }) => {
  const { user } = useAuth();
  const isAdmin = user?.portalRole === 'admin';
  const myCommunity = communityByAccount(user);

  // Every DevCorps portal account manages its own community's boards; the
  // checkboxes and points (the DevCorps marking/point system) are admin-only.
  const canManage = true;
  const canManageFiles = isAdmin;
  const scoring = isAdmin;

  // DevCorps admin sees every community; each member community is scoped to
  // its own board/files only — matched by the account's specific community name.
  const visibleCommunities = isAdmin
    ? DEV_CORPS_COMMUNITIES
    : (myCommunity ? [myCommunity] : []);

  const [activeIdState, setActiveIdState] = useState(DEV_CORPS_COMMUNITIES[0].id);
  const activeId = visibleCommunities.some((c) => c.id === activeIdState)
    ? activeIdState
    : (visibleCommunities[0]?.id || DEV_CORPS_COMMUNITIES[0].id);

  const [board, setBoard] = useState(null);
  const [boardStatus, setBoardStatus] = useState('loading');
  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState('loading');
  const [summary, setSummary] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('New Event');
  const [uploadError, setUploadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const activeCommunity = visibleCommunities.find((c) => c.id === activeId) || visibleCommunities[0];
  const communityId = activeCommunity?.id;

  useEffect(() => {
    let cancelled = false;
    if (!communityId) {
      setBoard(null);
      setFiles([]);
      setBoardStatus('success');
      setFilesStatus('success');
      return undefined;
    }

    setBoardStatus('loading');
    setFilesStatus('loading');

    devcorpsApi.getDocumentation(communityId)
      .then((data) => {
        if (!cancelled) {
          setBoard(data);
          setBoardStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setBoardStatus('error');
      });

    devcorpsApi.getCommunityFiles(communityId)
      .then((data) => {
        if (!cancelled) {
          setFiles(Array.isArray(data) ? data : []);
          setFilesStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setFilesStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [communityId, reloadToken]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    devcorpsApi.getDocumentationSummary()
      .then((data) => {
        if (!cancelled) setSummary(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSummary([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reloadToken]);

  const reload = () => setReloadToken((n) => n + 1);

  const handleSwitch = (communityId) => {
    setActiveIdState(communityId);
    setEditingEvent(null);
    setEditingTask(null);
    setUploadError('');
  };

  const handleToggle = async (eventOrder, task) => {
    try {
      const updated = await devcorpsApi.updateTask(communityId, eventOrder, task.key, { completed: !task.completed });
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handlePoints = async (eventOrder, task, points) => {
    try {
      const updated = await devcorpsApi.updateTask(communityId, eventOrder, task.key, { points });
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handleStartRename = (event) => setEditingEvent({ order: event.order, title: event.title });

  const handleRenameInput = (order, title) => setEditingEvent({ order, title });

  const handleRename = async (draft) => {
    const title = (draft.title || '').trim();
    setEditingEvent(null);
    if (!title) return;
    try {
      const updated = await devcorpsApi.renameEvent(communityId, draft.order, title);
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handleAddEvent = async () => {
    const title = (newEventTitle || '').trim() || 'New Event';
    setAddingEvent(false);
    setNewEventTitle('New Event');
    try {
      const updated = await devcorpsApi.addEvent(communityId, title);
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handleRemoveEvent = async (event) => {
    const count = (event.tasks || []).length;
    if (!window.confirm(`Remove the card "${event.title}" and its ${count} sections?`)) return;
    try {
      const updated = await devcorpsApi.removeEvent(communityId, event.order);
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handleLabelStart = (eventOrder, task) => setEditingTask({ order: eventOrder, key: task.key, label: task.label });

  const handleLabelDraft = (eventOrder, key, label) => setEditingTask({ order: eventOrder, key, label });

  const handleLabelCancel = () => setEditingTask(null);

  const handleLabelSave = async (draft) => {
    setEditingTask(null);
    const label = (draft.label || '').trim();
    if (!label) return;
    try {
      const updated = await devcorpsApi.updateTask(communityId, draft.order, draft.key, { label });
      setBoard(updated);
    } catch {
      reload();
    }
  };

  const handleUpdateWorkshops = async (count) => {
    try {
      const updated = await devcorpsApi.updateWorkshops(communityId, count);
      setBoard(updated);
      setSummary((prev) => prev.map((s) =>
        s.communityId === communityId ? { ...s, workshopsDone: count } : s
      ));
    } catch {
      reload();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const created = await devcorpsApi.uploadCommunityFile(communityId, file);
      setFiles((prev) => [created, ...prev]);
    } catch (err) {
      setUploadError(
        err?.response?.data?.message ||
        'Upload failed. Only images, PDF, Word, Excel, TXT, MD files up to 10MB are allowed.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFilePoints = async (file, points) => {
    try {
      const updated = await devcorpsApi.updateFilePoints(file._id, points);
      setFiles((prev) => prev.map((f) => (f._id === file._id ? updated : f)));
    } catch {
      /* ignore */
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.fileName}" from ${activeCommunity.name}?`)) return;
    try {
      await devcorpsApi.deleteCommunityFile(file._id);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
    } catch {
      /* ignore */
    }
  };

  const totals = useMemo(() => {
    const events = Array.isArray(board?.events) ? board.events : [];
    let completed = 0;
    let total = 0;
    let earned = 0;
    let max = 0;
    events.forEach((event) => {
      (event.tasks || []).forEach((task) => {
        total += 1;
        earned += Number(task.points) || 0;
        max += Number(task.maxPoints) || 0;
        if (task.completed) completed += 1;
      });
    });
    return { completed, total, earned, max, pct: max > 0 ? Math.min(100, Math.round((earned / max) * 100)) : 0 };
  }, [board]);

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      {isAdmin && summary.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summary.map((s) => {
            const community = DEV_CORPS_COMMUNITIES.find((c) => c.id === s.communityId);
            const active = s.communityId === activeId;
            return (
              <button
                key={s.communityId}
                type="button"
                onClick={() => handleSwitch(s.communityId)}
                className="rounded-2xl border p-4 text-left transition-all duration-200"
                style={{
                  backgroundColor: active ? `${ACCENT}0F` : t.cardBg,
                  borderColor: active ? ACCENT : t.border,
                }}
              >
                <p className="truncate text-[11px] font-bold uppercase tracking-widest" style={{ color: active ? ACCENT : t.textMuted }}>
                  {community?.name || s.communityId}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="flex items-center gap-1.5 text-lg font-extrabold" style={{ color: t.textPrimary }}>
                    <Award size={15} style={{ color: ACCENT }} />
                    {s.workshopsDone}
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>workshops</span>
                  </p>
                  <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                    {s.completedTasks}/{s.totalTasks} tasks
                  </p>
                  <p className="text-xs font-semibold" style={{ color: t.textMuted }}>
                    {s.maxPoints > 0 ? Math.min(100, Math.round((s.earnedPoints / s.maxPoints) * 100)) : 0}/100 pts
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isAdmin && !myCommunity && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <AlertCircle size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-medium" style={{ color: t.textMuted }}>
            Your account is not linked to a specific member community.
          </p>
        </div>
      )}

      {boardStatus === 'loading' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border p-4" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
              <div className="h-5 w-2/3 rounded" style={{ backgroundColor: t.pageBg }} />
              <div className="mt-4 space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-14 rounded-xl" style={{ backgroundColor: t.pageBg }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {boardStatus === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <AlertCircle size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load the community board</p>
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {boardStatus === 'success' && board && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {scoring && (
              <>
                <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Points earned</p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight" style={{ color: ACCENT }}>{totals.pct} pts</p>
                </div>
                <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Total possible points</p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight" style={{ color: ACCENT }}>100 pts</p>
                </div>
              </>
            )}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Workshops completed</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: ACCENT }}>{board.workshopsDone || 0}</p>
                <WorkshopsControl key={communityId} count={board.workshopsDone || 0} onCommit={handleUpdateWorkshops} />
              </div>
            </div>
          </div>

          <div key={communityId} className="flex gap-4 overflow-x-auto pb-2">
            {board.events.map((event) => (
              <EventColumn
                key={event.order}
                event={event}
                scoring={scoring}
                canEdit={canManage}
                editing={editingEvent?.order === event.order ? editingEvent : null}
                editingTask={editingTask}
                onStartRename={handleStartRename}
                onCancelRename={handleRenameInput}
                onRename={handleRename}
                onRemoveCard={handleRemoveEvent}
                onToggle={handleToggle}
                onPoints={handlePoints}
                onLabelStart={handleLabelStart}
                onLabelDraft={handleLabelDraft}
                onLabelSave={handleLabelSave}
                onLabelCancel={handleLabelCancel}
              />
            ))}
            {canManage && (
              <button
                type="button"
                onClick={() => setAddingEvent(true)}
                className="flex w-56 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 transition-colors hover:border-solid"
                style={{ borderColor: `${ACCENT}55`, backgroundColor: `${ACCENT}08`, color: ACCENT }}
              >
                <Plus size={18} />
                <span className="text-sm font-extrabold">Add card</span>
              </button>
            )}
          </div>

          {addingEvent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setAddingEvent(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl border p-5 shadow-2xl"
                style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>Add a card</h3>
                <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
                  New card for {activeCommunity.name}.
                </p>
                <input
                  type="text"
                  autoFocus
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddEvent();
                    if (e.key === 'Escape') setAddingEvent(false);
                  }}
                  className="mt-4 w-full rounded-xl border px-3 py-2.5 text-sm font-bold outline-none"
                  style={{ borderColor: ACCENT, color: '#111827', backgroundColor: '#ffffff' }}
                  placeholder="Event name"
                  aria-label="New card name"
                />
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingEvent(false)}
                    className="rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ color: t.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddEvent}
                    className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Add card
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight" style={{ color: t.textPrimary }}>
              Files & Documents
            </h3>
            <p className="mt-0.5 text-sm" style={{ color: t.textMuted }}>
              {activeCommunity.name}&apos;s document storage.
            </p>
          </div>

          {canManageFiles && (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload file'}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {uploadError && (
          <p className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            {uploadError}
          </p>
        )}

        <div className="mt-4">
          {filesStatus === 'loading' && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl" style={{ backgroundColor: t.pageBg }} />
              ))}
            </div>
          )}

          {filesStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-10 text-center" style={{ borderColor: t.border }}>
              <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load files</p>
              <button
                type="button"
                onClick={reload}
                className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {filesStatus === 'success' && files.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: t.border }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
                <FolderOpen size={20} style={{ color: t.textMuted }} />
              </div>
              <p className="text-sm font-medium" style={{ color: t.textMuted }}>
                No files uploaded for {activeCommunity.name} yet.
              </p>
            </div>
          )}

          {filesStatus === 'success' && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                  style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
                  >
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{file.fileName}</p>
                    <p className="mt-0.5 text-xs font-medium" style={{ color: t.textMuted }}>
                      {formatSize(file.size)} · {formatDate(file.createdAt)}
                    </p>
                  </div>

                  {scoring && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
                      {canManageFiles ? (
                        <>
                          <PointsInput value={file.points} max={100} onCommit={(points) => handleFilePoints(file, points)} />
                          <span>pts</span>
                        </>
                      ) : (
                        <span className="font-extrabold" style={{ color: ACCENT }}>{file.points} pts</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5"
                      style={{ color: t.textPrimary }}
                      aria-label={`Open ${file.fileName}`}
                      title="Open file"
                    >
                      <ExternalLink size={16} />
                    </a>
                    {canManageFiles && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                        aria-label={`Delete ${file.fileName}`}
                        title="Delete file"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevCorpsDocumentation;