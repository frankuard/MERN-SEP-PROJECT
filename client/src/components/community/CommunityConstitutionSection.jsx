import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import devcorpsApi from '../../api/devcorpsApi';
import communityPortalApi from '../../api/communityPortalApi';
import DocumentViewer from '../common/DocumentViewer';
import { getSocket } from '../../socket/socket';

const ACCENT = '#9333ea';

const formatUpdated = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Shared loading / error / empty visual language — matches the rest of the
// Manage User + Community sections.
const StatusBox = ({ children }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
    style={{ borderColor: '#e5e7eb' }}
  >
    {children}
  </div>
);

// Loads a community's constitution (404 = not uploaded yet) and keeps it in
// sync in real time when another account uploads/replaces/deletes it. State is
// only ever touched inside the promise callbacks — never synchronously inside
// the effect — so the load stays free of cascading renders.
const useConstitutionLoader = (communityId, fetchApi) => {
  const [constitution, setConstitution] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  const run = useCallback(() => {
    fetchApi(communityId)
      .then((data) => {
        setConstitution(data?.constitution ?? null);
        setStatus('success');
      })
      .catch((err) => {
        setConstitution(null);
        if (err?.response?.status === 404) setStatus('success');
        else setStatus('error');
      });
  }, [communityId, fetchApi]);

  const retry = () => {
    setStatus('loading');
    run();
  };

  useEffect(() => {
    let active = true;
    fetchApi(communityId)
      .then((data) => {
        if (!active) return;
        setConstitution(data?.constitution ?? null);
        setStatus('success');
      })
      .catch((err) => {
        if (!active) return;
        setConstitution(null);
        if (err?.response?.status === 404) setStatus('success');
        else setStatus('error');
      });

    const socket = getSocket();
    const onChange = (payload) => {
      if (payload && payload.communityId === communityId) {
        setConstitution(payload.constitution ?? null);
      }
    };
    socket.on('community:constitution', onChange);
    return () => {
      active = false;
      socket.off('community:constitution', onChange);
    };
  }, [communityId, fetchApi]);

  return { constitution, status, retry };
};

// ── Manage (community account / DevCorps portal admin) ─────────────────────
// Upload, replace, and delete the community's own constitution. Each of the
// five member communities manages ONLY its own constitution from its sidebar
// entry; the DevCorps portal admin manages any community from the Communities
// menu. Member/reader views never render management controls.
export const ManageConstitution = ({ community, t, editable = true }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { constitution, status, retry } = useConstitutionLoader(
    community.id,
    devcorpsApi.getConstitution
  );

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      toast.error('Only PDF, DOC, or DOCX files are supported.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const data = await devcorpsApi.uploadConstitution(community.id, file);
      toast.success(data?.message || 'Constitution saved');
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Upload failed. Only PDF, DOC, DOCX files up to 10MB are allowed.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${community.name}'s constitution? This cannot be undone.`)) return;
    try {
      await devcorpsApi.deleteConstitution(community.id);
      toast.success('Constitution deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete constitution');
    }
  };

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <StatusBox>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading constitution...</p>
        </StatusBox>
      )}

      {status === 'error' && (
        <StatusBox>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load constitution</p>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </StatusBox>
      )}

      {status === 'success' && !constitution && (
        <StatusBox>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <FileText size={20} style={{ color: t.textMuted }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
              No constitution uploaded yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed" style={{ color: t.textMuted }}>
              {editable
                ? `Upload ${community.name}'s constitution (PDF, DOC or DOCX) so members can read it from their Community section.`
                : 'The DevCorps portal admin publishes the constitution here. When it is uploaded, you can read and download it.'}
            </p>
          </div>
          {editable && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? 'Uploading…' : 'Upload Constitution'}
              </button>
            </>
          )}
        </StatusBox>
      )}

      {status === 'success' && constitution && !uploading && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {constitution.updatedAt && (
              <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}>
                Updated {formatUpdated(constitution.updatedAt)}
              </span>
            )}
            {editable ? (
              <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                Members can read — only this community&apos;s account can edit
              </span>
            ) : (
              <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                Community constitution — read & download
              </span>
            )}
          </div>

          <DocumentViewer file={constitution} t={t} />

          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? 'Uploading…' : 'Replace Constitution'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-red-50"
                style={{ borderColor: t.border, color: '#ef4444' }}
              >
                <Trash2 size={15} />
                Delete Constitution
              </button>
              <p className="w-full text-xs font-medium sm:w-auto sm:flex-1" style={{ color: t.textMuted }}>
                Uploading a new file replaces the current constitution (new version).
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Reader (approved community members) ─────────────────────────────────────
// Strictly read-only: members can open, slide, and download the constitution,
// but never see upload/replace/delete controls. Access itself is enforced on
// the backend (accepted membership required).
export const ReadConstitution = ({ community, t }) => {
  const { constitution, status, retry } = useConstitutionLoader(
    community.id,
    communityPortalApi.getCommunityConstitution
  );

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <StatusBox>
          <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading constitution...</p>
        </StatusBox>
      )}

      {status === 'error' && (
        <StatusBox>
          <RefreshCw size={20} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load the constitution</p>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </StatusBox>
      )}

      {status === 'success' && !constitution && (
        <StatusBox>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <FileText size={20} style={{ color: t.textMuted }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
              {community.name} hasn&apos;t uploaded its constitution yet
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
              Once it is published here, you&apos;ll be able to read and download it.
            </p>
          </div>
        </StatusBox>
      )}

      {status === 'success' && constitution && (
        <DocumentViewer file={constitution} t={t} />
      )}
    </div>
  );
};