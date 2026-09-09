import { Component, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfJsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// pdf.js v5+ ships an ESM worker. Vite exposes its URL via `?url` — pointing
// workerSrc at it lets pdf.js spawn its own worker per loading task. A global
// `workerPort` is deliberately NOT used: a single shared worker instance can
// be marked "being destroyed" by one component's cleanup and then throw
// synchronously inside the next `getDocument(...)` call, which crashes React.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorkerUrl;

const ACCENT = '#9333ea';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const isPdf = (file) => String(file?.mimetype || '').toLowerCase().includes('pdf');

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const downloadFile = async (file) => {
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = file.fileName || 'constitution';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(file.url, '_blank');
  }
};

const PdfErrorPanel = ({ file, t }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: t.border }}>
    <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
    <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
      Unable to preview this PDF
    </p>
    <button
      type="button"
      onClick={() => window.open(file.url, '_blank')}
      className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
    >
      <ExternalLink size={14} />
      Open PDF instead
    </button>
  </div>
);

const PdfViewer = ({ file, t }) => {
  const containerRef = useRef(null);
  const pinRef = useRef(null);
  const canvasesRef = useRef({});
  const pagesRef = useRef({});
  const dragState = useRef(null);
  const renderVersion = useRef(0);

  const [pdf, setPdf] = useState(null);
  const [loadedUrl, setLoadedUrl] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('loading');
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task;

    Promise.resolve()
      .then(() => {
        task = pdfjsLib.getDocument({ url: file.url });
        return task.promise;
      })
      .then((doc) => {
        if (cancelled) return;
        pinRef.current?.destroy?.();
        pinRef.current = doc;
        setPdf(doc);
        setLoadedUrl(file.url);
        setPageCount(doc.numPages);
        setCurrentPage(1);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      try {
        task?.destroy?.();
      } catch {
        /* noop */
      }
      if (pinRef.current) {
        try {
          pinRef.current.destroy();
        } catch {
          /* noop */
        }
      }
      pinRef.current = null;
    };
  }, [file.url]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isReady = status === 'ready' && loadedUrl === file.url && Boolean(pdf);
  const isLoading = !isReady && status !== 'error';
  const isError = !isReady && status === 'error';

  const goToPage = useCallback(
    (next) => {
      const target = Math.min(Math.max(1, next), pageCount);
      setCurrentPage(target);
      const el = pagesRef.current[target];
      el?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    },
    [pageCount]
  );

  useEffect(() => {
    if (!isReady || !pdf || containerWidth <= 0) return;
    const version = ++renderVersion.current;

    Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const pageNumber = index + 1;
        const page = await pdf.getPage(pageNumber);
        if (version !== renderVersion.current) {
          page.cleanup?.();
          return;
        }
        const base = page.getViewport({ scale: 1 });
        const scale = Math.max(0.4, (containerWidth / base.width) * zoom);
        const viewport = page.getViewport({ scale });
        const canvas = canvasesRef.current[pageNumber];
        if (!canvas) {
          page.cleanup?.();
          return;
        }
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const ctx = canvas.getContext('2d', { alpha: false });
        return page
          .render({ canvasContext: ctx, viewport })
          .promise.catch((err) => {
            if (err?.name !== 'RenderingCancelledException') throw err;
          });
      })
    ).catch((err) => {
      if (version === renderVersion.current && err?.name !== 'RenderingCancelledException') {
        setStatus('error');
      }
    });
  }, [isReady, pdf, containerWidth, zoom]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const el = containerRef.current;
    dragState.current = {
      x: e.clientX,
      y: e.clientY,
      sl: el.scrollLeft,
      st: el.scrollTop,
      triggered: false,
    };
    setDragging(true);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const onPointerMove = (e) => {
    const d = dragState.current;
    if (!d) return;
    const el = containerRef.current;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const hasOverflow = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;

    if (hasOverflow) {
      if (!d.triggered && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) d.triggered = true;
      if (d.triggered && !d.swiped) {
        el.scrollLeft = d.sl - dx;
        el.scrollTop = d.st - dy;
      }
      return;
    }

    if (!d.triggered && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      d.triggered = true;
      d.swiped = true;
      if (dx > 0) goToPage(currentPage - 1);
      else goToPage(currentPage + 1);
    }
  };

  const onPointerUp = (e) => {
    dragState.current = null;
    setDragging(false);
    try {
      containerRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16" style={{ borderColor: t.border }}>
        <Loader2 size={20} className="animate-spin" style={{ color: t.textMuted }} />
        <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Loading constitution...</p>
      </div>
    );
  }

  if (isError) {
    return <PdfErrorPanel file={file} t={t} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: t.border }}>
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
        style={{ backgroundColor: t.pageBg, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ color: t.textPrimary }}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold" style={{ color: t.textMuted }}>
            {currentPage} / {pageCount || 1}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ color: t.textPrimary }}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-1 hidden text-[11px] font-semibold sm:inline" style={{ color: t.textMuted }}>
            Drag to slide · scroll to browse
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: t.textPrimary }}
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-bold" style={{ color: t.textMuted }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.25) * 100) / 100))}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
            style={{ color: t.textPrimary }}
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative touch-none select-none overflow-auto transition-colors ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ maxHeight: '68vh', minHeight: 240, backgroundColor: '#52525b0f' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-4 py-4">
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <div
                key={pageNumber}
                ref={(el) => {
                  pagesRef.current[pageNumber] = el;
                }}
                className="relative rounded-lg shadow-md"
                style={{ backgroundColor: '#ffffff' }}
              >
                <canvas
                  ref={(el) => {
                    canvasesRef.current[pageNumber] = el;
                  }}
                  className="rounded-lg"
                />
                {pageNumber === currentPage && (
                  <span
                    className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                  >
                    {pageNumber}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NonPdfView = ({ file, t }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center"
    style={{ borderColor: t.border }}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${ACCENT}1A` }}>
      <FileText size={22} style={{ color: ACCENT }} />
    </div>
    <div>
      <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>
        {file.fileName}
      </p>
      <p className="mt-1 text-xs font-medium" style={{ color: t.textMuted }}>
        {String(file.mimetype || '').split('/').pop().toUpperCase()} documents can&apos;t be previewed inline.
        Open the file to read it, or download a copy.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: ACCENT }}
      >
        <ExternalLink size={14} />
        Open document
      </a>
      <button
        type="button"
        onClick={() => downloadFile(file)}
        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80"
        style={{ borderColor: t.border, color: t.textSecondary }}
      >
        <Download size={14} />
        Download
      </button>
    </div>
  </div>
);

class PdfErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <PdfErrorPanel file={this.props.file} t={this.props.t} />;
    }
    return this.props.children;
  }
}

const DocumentViewer = ({ file, t, emptyNode }) => {
  if (!file) return emptyNode || null;

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}>
          <FileText size={19} />
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
            {file.fileName}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: t.textMuted }}>
            {String(file.mimetype || '').split('/').pop().toUpperCase()} · {formatSize(file.size)} ·{' '}
            {file.updatedAt ? `${formatDate(file.updatedAt)}` : '—'}
            {file.version > 1 ? ` · v${file.version}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFile(file)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <Download size={13} />
            Download
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-black/5"
            style={{ borderColor: t.border, color: t.textPrimary }}
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {isPdf(file) ? (
        <PdfErrorBoundary key={file.url} file={file} t={t}>
          <PdfViewer file={file} t={t} />
        </PdfErrorBoundary>
      ) : (
        <NonPdfView file={file} t={t} />
      )}
    </div>
  );
};

export default DocumentViewer;