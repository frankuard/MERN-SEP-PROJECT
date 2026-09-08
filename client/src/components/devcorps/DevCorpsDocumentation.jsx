import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import devcorpsApi from '../../api/devcorpsApi';

const ACCENT = '#2f4336';

const NewsletterCard = ({ item, index, t }) => {
  const colors = ['#2563eb', '#9333ea', '#e11d48', '#ea580c'];

  return (
    <article
      className="flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"
      style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: colors[index % colors.length] }}
        >
          <FileText size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
            Section {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="truncate text-base font-extrabold" style={{ color: t.textPrimary }}>
            {item.title}
          </h3>
        </div>
      </div>

      {item.description && (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: t.textMuted }}>
          {item.description}
        </p>
      )}

      {item.points?.length > 0 && (
        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {item.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: t.textSecondary }}>
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

// Documentation is gated by the backend: GET /api/devcorps/portal only
// resolves for accounts whose `portal` identifier is devcorpsCommunity
// (authMiddleware + devcorpsMiddleware). A non-member always gets 403 here.
const DevCorpsDocumentation = ({ t }) => {
  const [documentation, setDocumentation] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'denied'
  const mountedRef = useRef(false);

  const load = useCallback(() => {
    devcorpsApi
      .getPortal()
      .then((data) => {
        if (!mountedRef.current) return;
        setDocumentation(Array.isArray(data?.documentation) ? data.documentation : []);
        setStatus('success');
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setStatus(err?.response?.status === 403 ? 'denied' : 'error');
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return (
    <div className="animate-in fade-in space-y-6 duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-[26px]" style={{ color: t.textPrimary }}>
          Documentation
        </h2>
        <p className="mt-1.5 text-base leading-relaxed" style={{ color: t.textMuted }}>
          DevCorps guidelines, project lifecycles, and community resources.
        </p>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
          <Loader2 size={22} className="animate-spin" style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading documentation…</p>
        </div>
      )}

      {status === 'denied' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <ShieldCheck size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Access denied</p>
          <p className="text-sm" style={{ color: t.textMuted }}>You do not have access to the DevCorps documentation.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <AlertCircle size={20} style={{ color: t.textMuted }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>Unable to load documentation</p>
          <p className="text-sm" style={{ color: t.textMuted }}>Please try again.</p>
          <button
            type="button"
            onClick={() => { setStatus('loading'); load(); }}
            className="mt-1 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {status === 'success' && (
        documentation.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documentation.map((item, index) => (
              <NewsletterCard key={item.id || index} item={item} index={index} t={t} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: t.border }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
              <BookOpen size={20} style={{ color: t.textMuted }} />
            </div>
            <p className="text-sm font-medium" style={{ color: t.textMuted }}>No documentation published yet.</p>
          </div>
        )
      )}
    </div>
  );
};

export default DevCorpsDocumentation;