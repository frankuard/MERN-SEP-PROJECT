import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Calendar, Loader2, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import canteenApi from '../../../api/canteenApi';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCurrency = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

const SalesAnalyticsTab = ({ t }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await canteenApi.getSalesAnalytics({ month: selectedMonth, year: selectedYear });
      setData(result);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { load(); }, [load]);

  const navigateMonth = (dir) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const graphData = data?.graphData || [];
  const maxSales = Math.max(...graphData.map((d) => d.sales), 1);
  const graphHeight = 220;

  const inputStyle = { backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary };

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border py-10" style={{ borderColor: t.border }}>
        <Loader2 size={16} className="animate-spin" style={{ color: t.textMuted }} />
        <span className="text-sm" style={{ color: t.textMuted }}>Loading sales analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: t.pastelCyan }}>
          <BarChart3 size={18} style={{ color: t.textPrimary }} />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>Sales & Analytics</h3>
          <p className="text-xs" style={{ color: t.textMuted }}>Real-time canteen sales data</p>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigateMonth(-1)} className="cursor-pointer rounded-xl border p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5" style={{ borderColor: t.border, backgroundColor: t.cardBg }}>
            <Calendar size={14} style={{ color: t.textMuted }} />
            <span className="text-sm font-bold" style={{ color: t.textPrimary }}>{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
          </div>
          <button type="button" onClick={() => navigateMonth(1)} className="cursor-pointer rounded-xl border p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: t.border, color: t.textPrimary }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-xl border px-3 py-2.5 text-sm font-bold outline-none"
            style={inputStyle}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl border px-3 py-2.5 text-sm font-bold outline-none"
            style={inputStyle}
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Today's Total Sales</p>
          <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: t.textPrimary }}>{formatCurrency(data?.todaySales)}</p>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>{data?.todayOrderCount || 0} order{data?.todayOrderCount !== 1 ? 's' : ''} today</p>
        </div>

        {/* Last Month Revenue */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Last Month's Total Revenue</p>
          <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: t.textPrimary }}>{formatCurrency(data?.lastMonthRevenue)}</p>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>{data?.lastMonthOrderCount || 0} paid order{data?.lastMonthOrderCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Selected Month Revenue */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>{MONTH_NAMES[selectedMonth]} Revenue</p>
          <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: t.textPrimary }}>{formatCurrency(data?.selectedMonthRevenue)}</p>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>{data?.totalOrders || 0} total order{(data?.totalOrders || 0) !== 1 ? 's' : ''}</p>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: t.textMuted }}>Pending Orders</p>
          <p className="mt-2 text-2xl font-black tabular-nums" style={{ color: t.textPrimary }}>{data?.pendingOrders || 0}</p>
          <p className="mt-1 text-xs" style={{ color: t.textMuted }}>awaiting payment/status</p>
        </div>
      </div>

      {/* Sales Graph */}
      <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>Daily Sales — {MONTH_NAMES[selectedMonth]} {selectedYear}</h4>
            <p className="text-xs" style={{ color: t.textMuted }}>Completed & paid orders only</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ backgroundColor: t.pageBg }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.accentPrimary }} />
            <span className="text-[11px] font-bold" style={{ color: t.textMuted }}>Sales (NPR)</span>
          </div>
        </div>

        {graphData.length > 0 ? (
          <div className="relative overflow-x-auto">
            <div className="flex items-end gap-[2px] min-w-[700px]" style={{ height: graphHeight + 40 }}>
              {graphData.map((d, i) => {
                const barH = d.sales > 0 ? Math.max((d.sales / maxSales) * graphHeight, 4) : 0;
                const isHovered = hoveredBar === i;
                return (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center justify-end"
                    style={{ height: graphHeight + 30 }}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {isHovered && d.sales > 0 && (
                      <div className="mb-1 rounded-lg px-2 py-1 text-[10px] font-bold whitespace-nowrap" style={{ backgroundColor: t.cardBg, color: t.textPrimary, border: `1px solid ${t.border}`, boxShadow: t.shadowSoft }}>
                        {formatCurrency(d.sales)} · {d.orders} order{d.orders !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-md transition-all duration-150 cursor-pointer"
                      style={{
                        height: barH || (d.sales === 0 ? 2 : barH),
                        backgroundColor: d.sales > 0 ? (isHovered ? t.accentPrimary : t.accentPrimary + '99') : t.progressTrack,
                        minHeight: 2,
                      }}
                    />
                    {(i % (graphData.length > 15 ? Math.ceil(graphData.length / 15) : 1) === 0 || i === graphData.length - 1) && (
                      <span className="mt-1 text-[9px] font-bold" style={{ color: t.textMuted }}>{d.day}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10" style={{ color: t.textMuted }}>
            <BarChart3 size={24} />
            <p className="mt-2 text-sm">No sales data for this month</p>
          </div>
        )}
      </div>

      {/* Most Sold Food Items */}
      <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: t.cardBg, borderColor: t.border, boxShadow: t.shadowSoft }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: t.pastelOrange }}>
            <Utensils size={14} style={{ color: t.textPrimary }} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>Most Sold Food Items</h4>
            <p className="text-xs" style={{ color: t.textMuted }}>Top items for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
          </div>
        </div>

        {data?.topItems?.length > 0 ? (
          <div className="space-y-2.5">
            {data.topItems.map((item, idx) => {
              const maxQty = data.topItems[0]?.totalQuantity || 1;
              const barWidth = (item.totalQuantity / maxQty) * 100;
              return (
                <div key={item._id} className="flex items-center gap-3 rounded-xl border p-3" style={{ backgroundColor: t.pageBg, borderColor: t.border }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black" style={{ backgroundColor: idx < 3 ? t.accentPrimary : t.chipBg, color: idx < 3 ? t.pageBg : t.textMuted }}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold" style={{ color: t.textPrimary }}>{item._id}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold" style={{ color: t.textMuted }}>{item.totalQuantity} sold</span>
                        <span className="text-xs font-extrabold tabular-nums" style={{ color: t.textPrimary }}>{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: t.progressTrack }}>
                      <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: t.accentPrimary }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8" style={{ color: t.textMuted }}>
            <Utensils size={22} />
            <p className="mt-2 text-sm">No sales data for this month</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalyticsTab;
