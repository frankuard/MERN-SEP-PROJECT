import { Component, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfJsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorkerUrl;

const ACCENT = '#9333ea';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const isPdf = (file) => {
  const mime = String(file?.mimetype || '').toLowerCase();
  const name = String(file?.fileName || '').toLowerCase();
  const url = String(file?.url || '').toLowerCase();
  return mime.includes('pdf') || name.endsWith('.pdf') || url.includes('.pdf');
};

const isWord = (file) => {
  const name = String(file?.fileName || '').toLowerCase();
  const mime = String(file?.mimetype || '').toLowerCase();
  return name.endsWith('.doc') || name.endsWith('.docx') || mime.includes('word') || mime.includes('officedocument');
};

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
    a.download = file.fileName || 'constitution.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(file.url, '_blank');
  }
};

/**
 * Isolated page renderer:
 * In pdf.js, reusing a <canvas> across concurrent or cancelled renders corrupts
 * the 2D context matrix and inverts the PDF Y-axis, causing upside-down flipping.
 * Following Mozilla's reference viewer architecture, PdfPageItem creates a fresh
 * canvas element for each render pass and mounts it only upon completion.
 */
const PdfPageItem = ({
  pdf,
  pageNumber,
  containerWidth,
  zoom,
  rotation,
  registerPageEl,
}) => {
  const containerRef = useRef(null);
  const mountRef = useRef(null);
  const currentTaskRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      if (!pdf || containerWidth <= 0) return;
      setIsRendering(true);

      // Cancel any ongoing render task on this page
      if (currentTaskRef.current) {
        try {
          currentTaskRef.current.cancel();
        } catch {
          /* noop */
        }
        currentTaskRef.current = null;
      }

      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) {
          page.cleanup?.();
          return;
        }

        // Native PDF rotation combined with user rotation (0, 90, 180, 270)
        const naturalRotation = page.rotate || 0;
        const totalRotation = (naturalRotation + rotation) % 360;

        // Obtain natural aspect ratio
        const baseViewport = page.getViewport({ scale: 1, rotation: totalRotation });
        const availableW = Math.max(280, containerWidth - 48);
        const fitScale = (availableW / baseViewport.width) * zoom;
        const viewport = page.getViewport({ scale: fitScale, rotation: totalRotation });

        const displayW = Math.floor(viewport.width);
        const displayH = Math.floor(viewport.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        setDimensions({ width: displayW, height: displayH });

        // Create a PRISTINE fresh canvas element with an uncorrupted context matrix
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
        canvas.className = 'block rounded-xl';

        const ctx = canvas.getContext('2d');
        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          transform: transform,
        });

        currentTaskRef.current = renderTask;
        await renderTask.promise;

        if (cancelled) return;

        // Atomically replace the rendered canvas inside the container
        const mount = mountRef.current;
        if (mount) {
          mount.innerHTML = '';
          mount.appendChild(canvas);
        }
        setIsRendering(false);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (currentTaskRef.current) {
        try {
          currentTaskRef.current.cancel();
        } catch {
          /* noop */
        }
        currentTaskRef.current = null;
      }
    };
  }, [pdf, pageNumber, containerWidth, zoom, rotation]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        registerPageEl?.(pageNumber, el);
      }}
      className="relative rounded-xl border bg-white shadow-md transition-shadow hover:shadow-lg"
      style={{
        borderColor: '#cbd5e1',
        minWidth: Math.min(dimensions.width, containerWidth - 48),
        minHeight: dimensions.height,
      }}
    >
      <div ref={mountRef} className="overflow-hidden rounded-xl" />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-[1px]">
          <Loader2 size={20} className="animate-spin text-purple-600" />
        </div>
      )}
      <span
        className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
      >
        {pageNumber}
      </span>
    </div>
  );
};

const PdfViewer = ({ file, t }) => {
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const pagesRef = useRef({});
  const lastKnownWidthRef = useRef(800);

  const [pdf, setPdf] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'fallback'
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [containerWidth, setContainerWidth] = useState(800);
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'embed'

  // Load PDF with pdfjsLib
  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    setStatus('loading');

    try {
      loadingTask = pdfjsLib.getDocument({
        url: file.url,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
        cMapPacked: true,
      });

      loadingTask.promise
        .then((doc) => {
          if (cancelled) return;
          setPdf(doc);
          setPageCount(doc.numPages);
          setCurrentPage(1);
          setStatus('ready');
        })
        .catch((err) => {
          console.warn('PDF.js reader error, falling back to embedded browser viewer:', err);
          if (!cancelled) setStatus('fallback');
        });
    } catch (err) {
      console.warn('PDF.js init error, falling back to embedded browser viewer:', err);
      if (!cancelled) setStatus('fallback');
    }

    return () => {
      cancelled = true;
      try {
        loadingTask?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [file.url]);

  // Callback ref guarantees width measurement and stable ResizeObserver
  const containerCallbackRef = useCallback((node) => {
    if (node) {
      containerRef.current = node;
      const initialW = node.clientWidth || lastKnownWidthRef.current || 800;
      if (initialW > 0) {
        lastKnownWidthRef.current = initialW;
        setContainerWidth(initialW);
      }

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newW = Math.floor(entry.contentRect.width);
          // Only trigger updates if width changed by >= 25px to prevent micro-reflows on view toggle
          if (newW > 0 && Math.abs(newW - lastKnownWidthRef.current) >= 25) {
            lastKnownWidthRef.current = newW;
            setContainerWidth(newW);
          }
        }
      });
      ro.observe(node);
      resizeObserverRef.current = ro;
    } else {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      containerRef.current = null;
    }
  }, []);

  // Smooth navigation to a specific page
  const goToPage = (pageNumber) => {
    const target = Math.min(Math.max(1, pageNumber), pageCount);
    setCurrentPage(target);
    const targetEl = pagesRef.current[target];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Track scroll position to update current page indicator dynamically
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || pageCount <= 0) return;

    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const centerY = containerTop + containerHeight / 3;

    let active = 1;
    for (let i = 1; i <= pageCount; i++) {
      const el = pagesRef.current[i];
      if (el) {
        const top = el.offsetTop - container.offsetTop;
        const bottom = top + el.offsetHeight;
        if (top <= centerY && bottom >= centerY) {
          active = i;
          break;
        }
        if (top > centerY) break;
        active = i;
      }
    }
    setCurrentPage(active);
  };

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: t.border }}>
      {/* Top Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
        style={{ backgroundColor: t.cardBg, borderBottom: `1px solid ${t.border}` }}
      >
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          {viewMode === 'reader' && status === 'ready' && (
            <>
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ color: t.textPrimary }}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-16 text-center text-xs font-bold" style={{ color: t.textPrimary }}>
                {currentPage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ color: t.textPrimary }}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>

              <span className="ml-2 hidden text-xs font-semibold text-slate-400 md:inline">
                Scroll down to read all pages
              </span>
            </>
          )}

          {(viewMode === 'embed' || status === 'fallback') && (
            <span className="text-xs font-bold" style={{ color: t.textPrimary }}>
              Browser PDF Viewer
            </span>
          )}
        </div>

        {/* Zoom controls, rotation, & view switch */}
        <div className="flex items-center gap-2">
          {viewMode === 'reader' && status === 'ready' && (
            <>
              <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: t.border }}>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                  style={{ color: t.textPrimary }}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="w-12 text-center text-xs font-bold" style={{ color: t.textMuted }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.2, Math.round((z + 0.2) * 10) / 10))}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                  style={{ color: t.textPrimary }}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              {/* Rotation control allows flipping back or fixing sideways documents */}
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex h-7 cursor-pointer items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition-colors hover:bg-black/5"
                style={{ borderColor: t.border, color: t.textPrimary }}
                aria-label="Rotate 90 degrees clockwise"
                title="Rotate 90°"
              >
                <RotateCw size={13} />
                <span className="hidden sm:inline">Rotate</span>
              </button>
            </>
          )}

          {/* Segmented View Switcher — preserves both views in DOM so switching never flips or flashes */}
          {status === 'ready' && (
            <div className="flex items-center rounded-xl border p-0.5" style={{ borderColor: t.border }}>
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: viewMode === 'reader' ? ACCENT : 'transparent',
                  color: viewMode === 'reader' ? '#ffffff' : t.textMuted,
                }}
              >
                Reader
              </button>
              <button
                type="button"
                onClick={() => setViewMode('embed')}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: viewMode === 'embed' ? ACCENT : 'transparent',
                  color: viewMode === 'embed' ? '#ffffff' : t.textMuted,
                }}
              >
                Native
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Scrollable Panel with Visible Side Scrollbar (Kept mounted to preserve rendered state) */}
      <div
        className="relative"
        style={{ display: viewMode === 'reader' && status !== 'fallback' ? 'block' : 'none' }}
      >
        <div
          ref={containerCallbackRef}
          onScroll={handleScroll}
          className="document-scrollbar relative overflow-y-auto overflow-x-auto p-4 sm:p-6"
          style={{
            maxHeight: '75vh',
            minHeight: 450,
            backgroundColor: '#f1f5f9',
            scrollBehavior: 'smooth',
          }}
        >
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 size={24} className="animate-spin" style={{ color: ACCENT }} />
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>
                Loading constitution pages…
              </p>
            </div>
          )}

          {status === 'ready' && (
            <div className="mx-auto flex flex-col items-center gap-6">
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <PdfPageItem
                    key={pageNumber}
                    pdf={pdf}
                    pageNumber={pageNumber}
                    containerWidth={containerWidth}
                    zoom={zoom}
                    rotation={rotation}
                    registerPageEl={(num, el) => {
                      pagesRef.current[num] = el;
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Side Page Quick-Jump Rail when multiple pages */}
        {status === 'ready' && pageCount > 1 && pageCount <= 15 && (
          <div
            className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-1 rounded-full border p-1.5 shadow-lg backdrop-blur-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', borderColor: '#cbd5e1' }}
            title="Jump to page"
          >
            {Array.from({ length: pageCount }, (_, i) => {
              const p = i + 1;
              const isActive = currentPage === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[10px] font-extrabold transition-all"
                  style={{
                    backgroundColor: isActive ? ACCENT : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                  }}
                  title={`Go to page ${p}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Browser View (Kept conditionally or on fallback) */}
      {(viewMode === 'embed' || status === 'fallback') && (
        <div className="w-full">
          <iframe
            src={`${file.url}#toolbar=1`}
            className="h-[680px] w-full border-0 rounded-b-2xl"
            title={file.fileName || 'Constitution'}
          />
        </div>
      )}
    </div>
  );
};

const WordDocViewer = ({ file, t }) => (
  <div className="overflow-hidden rounded-2xl border" style={{ borderColor: t.border }}>
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
      style={{ backgroundColor: t.cardBg, borderBottom: `1px solid ${t.border}` }}
    >
      <div className="flex items-center gap-2">
        <FileText size={18} style={{ color: ACCENT }} />
        <span className="text-xs font-bold" style={{ color: t.textPrimary }}>
          Word Document Viewer ({file.fileName})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => downloadFile(file)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          <Download size={13} />
          Download
        </button>
        <a
          href={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-black/5"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          <ExternalLink size={13} />
          Google Docs View
        </a>
      </div>
    </div>
    <iframe
      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
      className="h-[650px] w-full border-0"
      title={file.fileName}
    />
  </div>
);

const FallbackFileViewer = ({ file, t }) => (
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
        Open the document in a new tab or download a copy to read it.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: ACCENT }}
      >
        <ExternalLink size={14} />
        Open document
      </a>
      <button
        type="button"
        onClick={() => downloadFile(file)}
        className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80"
        style={{ borderColor: t.border, color: t.textSecondary }}
      >
        <Download size={14} />
        Download
      </button>
    </div>
  </div>
);

const DocumentViewer = ({ file, t, emptyNode }) => {
  if (!file) return emptyNode || null;

  return (
    <div className="space-y-3">
      {/* File metadata banner */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${ACCENT}1A`, color: ACCENT }}
        >
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-sm font-extrabold" style={{ color: t.textPrimary }}>
            {file.fileName}
          </p>
          <p className="mt-0.5 text-xs font-medium" style={{ color: t.textMuted }}>
            {String(file.mimetype || '').split('/').pop().toUpperCase() || 'DOCUMENT'} · {formatSize(file.size)} ·{' '}
            {file.updatedAt ? formatDate(file.updatedAt) : '—'}
            {file.version > 1 ? ` · v${file.version}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadFile(file)}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <Download size={13} />
            Download
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors hover:bg-black/5"
            style={{ borderColor: t.border, color: t.textPrimary }}
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Document Content View */}
      {isPdf(file) ? (
        <PdfViewer file={file} t={t} />
      ) : isWord(file) ? (
        <WordDocViewer file={file} t={t} />
      ) : (
        <FallbackFileViewer file={file} t={t} />
      )}
    </div>
  );
};

export default DocumentViewer;