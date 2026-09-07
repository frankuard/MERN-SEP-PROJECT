import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';

const InvoiceModal = ({ order, onClose, t }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const loadPdf = async () => {
      setLoading(true);
      try {
        const blob = await canteenApi.getOrderInvoice(order._id);
        if (!mounted) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setIframeKey((k) => k + 1);
      } catch (err) {
        if (mounted) toast.error(err?.response?.data?.message || 'Failed to load invoice');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [order._id]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `invoice-${order._id?.toString().slice(-6).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const frame = iframeRef.current;
    if (frame && frame.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } else {
      toast.error('Invoice not ready to print yet');
    }
  };

  const orderId = order._id?.toString().slice(-6).toUpperCase();
  const date = order.createdAt ? new Date(order.createdAt) : new Date();
  const buyerName = order.user?.username || order.userName || 'Student';
  const buyerEmail = order.user?.email;
  const buyerRole = order.userRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-2xl border shadow-2xl" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}>
        <div className="flex items-center justify-between border-b p-4 sm:p-5" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelCyan }}>
              <FileText size={18} style={{ color: t.textPrimary }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: t.textPrimary }}>Invoice #{orderId}</h3>
              <p className="text-xs" style={{ color: t.textMuted }}>
                {buyerName} ({buyerRole}) · {date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-5" style={{ borderColor: t.border }}>
          <button type="button" onClick={handlePrint} disabled={loading || !pdfUrl} className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
            style={{ borderColor: t.border, color: t.textPrimary }}>
            <Printer size={14} /> Print
          </button>
          <button type="button" onClick={handleDownload} disabled={loading || !pdfUrl} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            <Download size={14} /> Download PDF
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase" style={{ color: t.textMuted }}>Payment Status</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              {order.paymentStatus || 'Paid'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 size={22} className="animate-spin" style={{ color: t.textMuted }} />
              <p className="text-sm" style={{ color: t.textMuted }}>Generating invoice PDF...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={pdfUrl}
              title="Invoice PDF"
              className="h-[60vh] w-full rounded-xl border"
              style={{ borderColor: t.border, backgroundColor: '#fff' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center" style={{ color: t.textMuted }}>
              <FileText size={24} />
              <p className="text-sm">Unable to generate this invoice.</p>
              {buyerEmail && <p className="text-xs">{buyerEmail}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;