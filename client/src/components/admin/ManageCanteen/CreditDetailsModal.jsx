import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CreditDetailsModal = ({ creditId, onClose, t }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    canteenApi.getCreditById(creditId)
      .then((data) => { if (mounted) setRecord(data); })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [creditId]);

  const timeline = record
    ? [
        ...record.dueHistory.map((d) => ({ ...d, kind: 'due' })),
        ...record.paymentHistory.map((p) => ({ ...p, kind: 'payment' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div
        className="flex w-full max-w-lg max-h-[85vh] flex-col rounded-[28px] border shadow-2xl"
        style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: t.border }}>
          <div>
            <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>
              {record?.user?.username || record?.studentName || 'Credit History'}
            </h3>
            <p className="text-xs" style={{ color: t.textMuted }}>{record?.user?.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} style={{ color: t.textMuted }} />
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>Loading...</p>
        ) : !record ? (
          <p className="p-6 text-center text-sm" style={{ color: t.textMuted }}>Unable to load this record.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 border-b p-5" style={{ borderColor: t.border }}>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: t.textMuted }}>Total Charged</p>
                <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>NPR {record.amountDue}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: t.textMuted }}>Total Paid</p>
                <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>NPR {record.amountPaid}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase" style={{ color: t.textMuted }}>Balance</p>
                <p
                  className="text-sm font-extrabold"
                  style={{ color: record.remainingBalance > 0 ? t.textPrimary : record.remainingBalance < 0 ? t.accentEmerald : t.textMuted }}
                >
                  {record.remainingBalance > 0 ? `NPR ${record.remainingBalance} due` : record.remainingBalance < 0 ? `+NPR ${Math.abs(record.remainingBalance)}` : 'Cleared'}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
              {timeline.length === 0 ? (
                <p className="text-center text-sm" style={{ color: t.textMuted }}>No transactions recorded yet.</p>
              ) : (
                timeline.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-start gap-3 rounded-xl border p-3"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: entry.kind === 'due' ? '#fee2e2' : t.accentEmerald + '22' }}
                    >
                      {entry.kind === 'due'
                        ? <TrendingUp size={14} style={{ color: '#dc2626' }} />
                        : <TrendingDown size={14} style={{ color: t.accentEmerald }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold" style={{ color: t.textPrimary }}>
                          {entry.kind === 'due' ? `+ NPR ${entry.amount} charged` : `− NPR ${entry.amount} paid`}
                        </p>
                        <span className="shrink-0 text-xs font-semibold" style={{ color: t.textMuted }}>{formatDate(entry.date)}</span>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: t.textMuted }}>
                        {entry.note} {(entry.addedBy?.username || entry.receivedBy?.username) && `· by ${entry.addedBy?.username || entry.receivedBy?.username}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="flex justify-end border-t p-4" style={{ borderColor: t.border }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2 text-xs font-bold text-white"
            style={{ backgroundColor: t.accentPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditDetailsModal;