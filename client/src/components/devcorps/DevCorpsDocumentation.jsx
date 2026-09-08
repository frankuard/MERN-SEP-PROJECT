import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import devcorpsApi from '../../api/devcorpsApi';
import { DEV_CORPS_COMMUNITIES } from '../../data/devcorpsConfig';

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

const TaskRow = ({ task, canEdit, onToggle, onPoints }) => {
  return (
    <div
      className="rounded-xl border p-2.5 transition-colors"
      style={{
        borderColor: task.completed ? `${ACCENT}55` : '#e5e7eb',
        backgroundColor: task.completed ? `${ACCENT}0F` : '#fafafa',
      }}
    >
      <div className="flex items-center gap-2">
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
        <span className="flex-1 text-[12px] font-semibold leading-snug" style={{ color: '#1f2937' }}>
          {task.label}
        </span>
      </div>

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
    </div>
  );
};

const EventColumn = ({ event, canEdit, editing, onStartRename, onCancelRename, onRename, onToggle, onPoints }) => {
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
      </div>

      <div className="mt-1 flex items-center justify-between pl-8 text-[11px] font-semibold" style={{ color: '#64748b' }}>
        <span>{done} / {event.tasks.length} tasks done</span>
        <span><span className="font-extrabold" style={{ color: ACCENT }}>{earned}</span> / {max} pts</span>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {(event.tasks || []).map((task) => (
          <TaskRow
            key={task.key}
            task={task}
            canEdit={canEdit}
            onToggle={onToggle}
            onPoints={onPoints}
          />
        ))}
      </div>
    </div>
  );
};

const DevCorpsDocumentation = ({ t }) => {
  const { user } = useAuth();
  const canEdit = user?.portalRole === 'admin';

  const [activeId, setActiveId] = useState(DEV_CORPS_COMMUNITIES[0].id);
  const [board, setBoard] = useState(null);
  const [boardStatus, setBoardStatus] = useState('loading');
  const [files, setFiles] = useState([]);
  const [filesStatus, setFilesStatus] = useState('loading');
  const [editingEvent, setEditingEvent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const activeCommunity = DEV_CORPS_COMMUNITIES.find((c) => c.id === activeId) || DEV_CORPS_COMMUNITIES[0];

  const loadBoard = useCallback(async () => {
    setBoardStatus('loading');
    try {
      const data = await devcorpsApi.getDocumentation(activeId);
      setBoard(data);
      setBoardStatus('success');
    } catch {
      setBoardStatus('error');
    }
  }, [activeId]);

  const loadFiles = useCallback(async () => {
    setFilesStatus('loading');
    try {
      const data = await devcorpsApi.getCommunityFiles(activeId);
      setFiles(Array.isArray(data) ? data : []);
      setFilesStatus('success');
    } catch {
      setFilesStatus('error');
    }
  }, [activeId]);

  useEffect(() => {
    loadBoard();
    loadFiles();
  }, [loadBoard, loadFiles]);

  const handleSwitch = (communityId) => {
    setActiveId(communityId);
    setEditingEvent(null);
    setUploadError('');
  };

  const handleToggle = async (eventOrder, task) => {
    try {
      const updated = await devcorpsApi.updateTask(activeId, eventOrder, task.key, { completed: !task.completed });
      setBoard(updated);
    } catch {
      loadBoard();
    }
  };

  const handlePoints = async (eventOrder, task, points) => {
    try {
      const updated = await devcorpsApi.updateTask(activeId, eventOrder, task.key, { points });
      setBoard(updated);
    } catch {
      loadBoard();
    }
  };

  const handleStartRename = (event) => setEditingEvent({ order: event.order, title: event.title });

  const handleRenameInput = (order, title) => setEditingEvent({ order, title });

  const handleRename = async (draft) => {
    const title = (draft.title || '').trim();
    setEditingEvent(null);
    if (!title) return;
    try {
      const updated = await devcorpsApi.renameEvent(activeId, draft.order, title);
      setBoard(updated);
    } catch {
      loadBoard();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const created = await devcorpsApi.uploadCommunityFile(activeId, file);
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
    return { completed, total, earned, max };
  }, [board]);

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Documentation
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          Community progress boards, event checklists, and per-community file storage.
          {!canEdit && ' You are viewing this documentation in read-only mode.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEV_CORPS_COMMUNITIES.map((community) => {
          const active = community.id === activeId;
          return (
            <button
              key={community.id}
              type="button"
              onClick={() => handleSwitch(community.id)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={{
                backgroundColor: active ? ACCENT : t.cardBg,
                color: active ? '#ffffff' : t.textPrimary,
                border: `1px solid ${active ? ACCENT : t.border}`,
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-lg text-[11px] font-extrabold"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.22)' : `${ACCENT}1A`,
                  color: active ? '#ffffff' : ACCENT,
                }}
              >
                {community.name.charAt(0)}
              </span>
              {community.name}
            </button>
          );
        })}
      </div>

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
            onClick={loadBoard}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {boardStatus === 'success' && board && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Tasks completed', value: `${totals.completed} / ${totals.total}` },
              { label: 'Points earned', value: `${totals.earned} pts` },
              { label: 'Total possible points', value: `${totals.max} pts` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>{item.label}</p>
                <p className="mt-1.5 text-2xl font-extrabold tracking-tight" style={{ color: ACCENT }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {board.events.map((event) => (
              <EventColumn
                key={event.order}
                event={event}
                canEdit={canEdit}
                editing={editingEvent?.order === event.order ? editingEvent : null}
                onStartRename={handleStartRename}
                onCancelRename={handleRenameInput}
                onRename={handleRename}
                onToggle={(task) => handleToggle(event.order, task)}
                onPoints={(task, points) => handlePoints(event.order, task, points)}
              />
            ))}
          </div>
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

          {canEdit && (
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
                onClick={loadFiles}
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

                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textMuted }}>
                    {canEdit ? (
                      <>
                        <PointsInput value={file.points} max={100} onCommit={(points) => handleFilePoints(file, points)} />
                        <span>pts</span>
                      </>
                    ) : (
                      <span className="font-extrabold" style={{ color: ACCENT }}>{file.points} pts</span>
                    )}
                  </div>

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
                    {canEdit && (
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