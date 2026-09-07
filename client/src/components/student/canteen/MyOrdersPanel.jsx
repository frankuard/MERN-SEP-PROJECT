import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, ChevronDown, Loader2, ReceiptText, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import canteenApi from '../../../api/canteenApi';

const STATUS_BADGE = {
  Pending: { bg: '#fef3c7', color: '#b45309' },
  Preparing: { bg: '#dbeafe', color: '#1d4ed8' },
  Ready: { bg: '#dcfce7', color: '#15803d' },
  Completed: { bg: '#e2e8f0', color: '#334155' },
  Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

const PAYMENT_BADGE = {
  Pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  Approved: { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
  Rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
  Paid: { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
};

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const MyOrdersPanel = ({ t, onStartOrdering }) => {
  const [orders, setOrders] = useState([]);
  const [creditRequests, setCreditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRibbon, setShowRibbon] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ord, req] = await Promise.all([
        canteenApi.getMyOrders().catch(() => []),
        canteenApi.getMyCreditRequests().catch(() => []),
      ]);
      if (Array.isArray(ord)) setOrders(ord);
      if (Array.isArray(req)) setCreditRequests(req);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { textPrimary, textMuted, cardBg, border } = t;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelBlue }}>
            <ShoppingBag size={18} style={{ color: textPrimary }} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: textPrimary }}>My Orders</h3>
            <p className="text-xs" style={{ color: textMuted }}>Track your canteen orders & credit requests</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartOrdering}
          className="self-start rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:self-auto"
        >
          Order Food
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border py-12" style={{ borderColor: border }}>
          <Loader2 size={16} className="animate-spin" style={{ color: textMuted }} />
          <span className="text-sm" style={{ color: textMuted }}>Loading orders...</span>
        </div>
      ) : orders.length === 0 && creditRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
            <ReceiptText size={20} style={{ color: textMuted }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: textPrimary }}>No orders yet</p>
            <p className="text-sm" style={{ color: textMuted }}>Your canteen orders and credit requests will show up here.</p>
          </div>
        </div>
      ) : (
        <>
          {creditRequests.length > 0 && showRibbon && (
            <div className="rounded-2xl border p-4" style={{ backgroundColor: t.pastelYellow, borderColor: border }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 shrink-0" style={{ color: textPrimary }} />
                  <div>
                    <p className="text-sm font-extrabold" style={{ color: textPrimary }}>Pending Credit Due Requests</p>
                    <p className="mt-0.5 text-xs" style={{ color: textMuted }}>
                      {creditRequests.filter((r) => r.status === 'Pending').length} request(s) awaiting admin approval.
                      Your credit due balance updates only after approval.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowRibbon(false)} className="shrink-0 rounded-full p-1 hover:opacity-70">
                  <ChevronDown size={16} style={{ color: textMuted }} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {orders.map((order) => {
              const sb = STATUS_BADGE[order.orderStatus] || STATUS_BADGE.Pending;
              const pb = PAYMENT_BADGE[order.paymentStatus] || PAYMENT_BADGE.Pending;
              return (
                <div key={order._id} className="overflow-hidden rounded-2xl border" style={{ backgroundColor: cardBg, borderColor: border, boxShadow: t.shadowSoft }}>
                  <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: border }}>
                    <div>
                      <p className="text-sm font-extrabold" style={{ color: textPrimary }}>
                        Order #{order._id?.toString().slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs" style={{ color: textMuted }}>Placed {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ backgroundColor: sb.bg, color: sb.color }}>
                        {order.orderStatus}
                      </span>
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ backgroundColor: pb.bg, color: pb.color }}>
                        {pb.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      {order.items?.map((item) => (
                        <div key={item._id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black" style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}>
                              x{item.quantity}
                            </span>
                            <span className="truncate font-semibold" style={{ color: textPrimary }}>{item.name}</span>
                          </div>
                          <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: textMuted }}>NPR {item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 text-sm sm:border-l sm:pl-4" style={{ borderColor: border }}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: textMuted }}>Table</span>
                        <span className="font-extrabold" style={{ color: textPrimary }}>Table {order.tableNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: textMuted }}>Payment</span>
                        <span className="font-extrabold" style={{ color: textPrimary }}>{order.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: textMuted }}>Total</span>
                        <span className="font-black tabular-nums" style={{ color: textPrimary }}>NPR {order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {creditRequests.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: textMuted }}>Credit Due Requests</h4>
              {creditRequests.map((req) => {
                const status = req.status;
                const StatusIcon = status === 'Approved' ? CheckCircle2 : status === 'Rejected' ? XCircle : Clock3;
                const statusColor = status === 'Approved' ? '#15803d' : status === 'Rejected' ? '#b91c1c' : '#b45309';
                const statusBg = status === 'Approved' ? '#dcfce7' : status === 'Rejected' ? '#fee2e2' : '#fef3c7';
                return (
                  <div key={req._id} className="flex items-center gap-3 rounded-2xl border p-4" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: statusBg }}>
                      <StatusIcon size={18} style={{ color: statusColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold" style={{ color: textPrimary }}>
                        NPR {req.amount} — Order #{req.order?._id?.toString().slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs" style={{ color: textMuted }}>
                        {formatDate(req.createdAt)} · {status}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ backgroundColor: statusBg, color: statusColor }}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyOrdersPanel;