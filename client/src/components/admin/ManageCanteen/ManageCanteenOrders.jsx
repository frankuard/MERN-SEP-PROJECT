import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, X, ChevronDown, Loader2, BadgeCheck, XCircle, CheckCircle2,
  Banknote, GraduationCap, UserCircle, Clock3, Search as SearchIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';

const ORDER_STATUS_COLORS = {
  Pending: { bg: '#fef3c7', color: '#b45309' },
  Preparing: { bg: '#dbeafe', color: '#1d4ed8' },
  Ready: { bg: '#dcfce7', color: '#15803d' },
  Completed: { bg: '#e2e8f0', color: '#334155' },
  Cancelled: { bg: '#fee2e2', color: '#b91c1c' },
};

const PAYMENT_STATUS_COLORS = {
  Pending: { bg: '#fef3c7', color: '#b45309' },
  Approved: { bg: '#dcfce7', color: '#15803d' },
  Rejected: { bg: '#fee2e2', color: '#b91c1c' },
  Paid: { bg: '#dcfce7', color: '#15803d' },
};

const ORDER_STATUS_OPTIONS = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
const ORDER_STATUS_FILTERS = ['All', ...ORDER_STATUS_OPTIONS];

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const OrderDetailsModal = ({ t, order, onUpdate }) => {
  const [status, setStatus] = useState(order?.orderStatus || 'Pending');
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (next) => {
    setSaving(true);
    try {
      await canteenApi.updateOrderStatus(order._id, { orderStatus: next });
      toast.success(`Order status → ${next}`);
      setStatus(next);
      onUpdate();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPayment = async () => {
    setSaving(true);
    try {
      await canteenApi.confirmCounterPayment(order._id);
      toast.success('Counter payment confirmed');
      onUpdate();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setSaving(false);
    }
  };

  const RoleIcon = order?.userRole === 'teacher' ? GraduationCap : UserCircle;
  const os = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.Pending;
  const ps = PAYMENT_STATUS_COLORS[order?.paymentStatus] || PAYMENT_STATUS_COLORS.Pending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowCard }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: t.pastelBlue }}>
              <ShoppingBag size={16} style={{ color: t.textPrimary }} />
            </div>
            <div>
              <h4 className="text-base font-bold" style={{ color: t.textPrimary }}>
                Order #{order._id?.toString().slice(-6).toUpperCase()}
              </h4>
              <p className="text-xs" style={{ color: t.textMuted }}>{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ backgroundColor: os.bg, color: os.color }}>
            {status}
          </span>
          <button type="button" onClick={onUpdate} disabled={saving} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50">
            <X size={16} style={{ color: t.textMuted }} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
            <RoleIcon size={15} style={{ color: t.textMuted }} />
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>User</p>
              <p className="text-sm font-extrabold capitalize" style={{ color: t.textPrimary }}>{order.user?.username || order.userName} ({order.userRole})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
            <Clock3 size={15} style={{ color: t.textMuted }} />
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>Table</p>
              <p className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Table {order.tableNumber}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-xl border p-4" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
          {order.items?.map((item) => (
            <div key={item._id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black" style={{ backgroundColor: t.accentPrimary, color: t.pageBg }}>x{item.quantity}</span>
                <span className="truncate font-bold" style={{ color: t.textPrimary }}>{item.name}</span>
              </div>
              <span className="shrink-0 text-xs font-extrabold tabular-nums" style={{ color: t.textMuted }}>NPR {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: t.border }}>
            <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>Total</span>
            <span className="text-base font-black tabular-nums" style={{ color: t.textPrimary }}>NPR {order.totalAmount}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>Payment Method</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Banknote size={13} style={{ color: t.textMuted }} />
              <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>{order.paymentMethod}</span>
            </div>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: t.border, backgroundColor: t.pageBg }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>Payment Status</p>
            <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase" style={{ backgroundColor: ps.bg, color: ps.color }}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Update Order Status</p>
          <div className="flex flex-wrap gap-1.5">
            {ORDER_STATUS_OPTIONS.map((opt) => {
              const c = ORDER_STATUS_COLORS[opt];
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleStatusChange(opt)}
                  disabled={saving || order.orderStatus === 'Cancelled'}
                  className="cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: status === opt ? c.bg : t.pageBg, color: status === opt ? c.color : t.textMuted, border: `1px solid ${status === opt ? c.bg : t.border}` }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {order.paymentMethod === 'Pay at Counter' && order.paymentStatus !== 'Paid' && (
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Banknote size={15} /> Confirm Counter Payment
          </button>
        )}
      </div>
    </div>
  );
};

export const OrdersTab = ({ t }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [detailsOrder, setDetailsOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const data = await canteenApi.getAllOrders(params);
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const countByStatus = (s) => orders.filter((o) => o.orderStatus === s).length;

  const filterBtnStyle = (active) => ({
    backgroundColor: active ? t.accentPrimary : t.cardBg,
    color: active ? t.pageBg : t.textPrimary,
    borderColor: active ? t.accentPrimary : t.border,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelBlue }}>
            <ShoppingBag size={18} style={{ color: t.textPrimary }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Orders</h3>
            <p className="text-xs" style={{ color: t.textMuted }}>All student & teacher orders</p>
          </div>
        </div>
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full rounded-xl border bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-black sm:w-56"
            style={{ borderColor: t.border, color: t.textPrimary }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
          {ORDER_STATUS_FILTERS.map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)} className="cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold" style={filterBtnStyle(statusFilter === s)}>
              {s}
              {s !== 'All' && <span className="ml-1 opacity-70">({countByStatus(s)})</span>}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
          {['All', 'student', 'teacher'].map((r) => (
            <button key={r} type="button" onClick={() => setRoleFilter(r)} className="cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold capitalize" style={filterBtnStyle(roleFilter === r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border py-10" style={{ borderColor: t.border }}>
          <Loader2 size={16} className="animate-spin" style={{ color: t.textMuted }} />
          <span className="text-sm" style={{ color: t.textMuted }}>Loading orders...</span>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: t.border }}>
          <ShoppingBag size={22} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>No orders</p>
          <p className="text-xs" style={{ color: t.textMuted }}>Orders placed by students and teachers will appear here.</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const os = ORDER_STATUS_COLORS[order.orderStatus] || ORDER_STATUS_COLORS.Pending;
            const ps = PAYMENT_STATUS_COLORS[order.paymentStatus] || PAYMENT_STATUS_COLORS.Pending;
            const RoleIcon = order.userRole === 'teacher' ? GraduationCap : UserCircle;
            const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
            return (
              <div key={order._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: t.pageBg }}>
                      <RoleIcon size={17} style={{ color: t.textMuted }} />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-extrabold" style={{ color: t.textPrimary }}>
                        <span className="capitalize">{order.user?.username || order.userName}</span>
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase" style={{ backgroundColor: order.userRole === 'teacher' ? t.pastelPurple : t.pastelBlue, color: t.textPrimary }}>
                          {order.userRole}
                        </span>
                      </p>
                      <p className="truncate text-xs" style={{ color: t.textMuted }}>
                        #{order._id?.toString().slice(-6).toUpperCase()} · {formatDate(order.createdAt)} · Table {order.tableNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ backgroundColor: os.bg, color: os.color }}>{order.orderStatus}</span>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ backgroundColor: ps.bg, color: ps.color }}>{order.paymentStatus}</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: t.textPrimary }}>NPR {order.totalAmount}</span>
                    <span className="text-xs font-bold" style={{ color: t.textMuted }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      onClick={() => setDetailsOrder(order)}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold"
                      style={{ borderColor: t.border, color: t.textPrimary }}
                    >
                      <ChevronDown size={13} /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailsOrder && (
        <OrderDetailsModal
          t={t}
          order={detailsOrder}
          onUpdate={() => { setDetailsOrder(null); load(); }}
        />
      )}
    </div>
  );
};

export const CreditRequestsTab = ({ t }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      const data = await canteenApi.getAllCreditRequests(params);
      if (Array.isArray(data)) setRequests(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load credit requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (req, status) => {
    try {
      const adminNote = status === 'Rejected' ? 'Rejected by canteen admin' : '';
      await canteenApi.reviewCreditRequest(req._id, { status, adminNote });
      toast.success(`Credit request ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update request');
    }
  };

  const filterBtnStyle = (active) => ({
    backgroundColor: active ? t.accentPrimary : t.cardBg,
    color: active ? t.pageBg : t.textPrimary,
    borderColor: active ? t.accentPrimary : t.border,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelYellow }}>
            <BadgeCheck size={18} style={{ color: t.textPrimary }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Credit Due Requests</h3>
            <p className="text-xs" style={{ color: t.textMuted }}>Approve to add the amount to a user's credit due balance</p>
          </div>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold" style={filterBtnStyle(filter === s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border py-10" style={{ borderColor: t.border }}>
          <Loader2 size={16} className="animate-spin" style={{ color: t.textMuted }} />
          <span className="text-sm" style={{ color: t.textMuted }}>Loading requests...</span>
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-14 text-center" style={{ borderColor: t.border }}>
          <BadgeCheck size={22} style={{ color: t.textMuted }} />
          <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>No credit due requests</p>
          <p className="text-xs" style={{ color: t.textMuted }}>Requests from credit-due orders will appear here.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const s = req.status;
            const sColor = s === 'Approved' ? '#15803d' : s === 'Rejected' ? '#b91c1c' : '#b45309';
            const sBg = s === 'Approved' ? '#dcfce7' : s === 'Rejected' ? '#fee2e2' : '#fef3c7';
            const RoleIcon = req.userRole === 'teacher' ? GraduationCap : UserCircle;
            return (
              <div key={req._id} className="rounded-2xl border p-4" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: sBg }}>
                      <RoleIcon size={17} style={{ color: sColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-extrabold" style={{ color: t.textPrimary }}>
                        <span className="capitalize">{req.user?.username || req.userName}</span>
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase" style={{ backgroundColor: req.userRole === 'teacher' ? t.pastelPurple : t.pastelBlue, color: t.textPrimary }}>
                          {req.userRole}
                        </span>
                      </p>
                      <p className="truncate text-xs" style={{ color: t.textMuted }}>
                        NPR {req.amount} · Order #{req.order?._id?.toString().slice(-6).toUpperCase()} · {formatDate(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ backgroundColor: sBg, color: sColor }}>{s}</span>
                    {req.adminNote && <span className="max-w-40 truncate text-xs italic" style={{ color: t.textMuted }}>“{req.adminNote}”</span>}
                    {s === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(req, 'Approved')}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white"
                          style={{ backgroundColor: '#16a34a' }}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(req, 'Rejected')}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white"
                          style={{ backgroundColor: '#dc2626' }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};