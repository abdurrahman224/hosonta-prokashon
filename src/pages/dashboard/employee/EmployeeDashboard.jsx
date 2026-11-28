import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiGlobe,
  FiLogIn,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { formatCurrency } from '../../../utils/format';
import { initialCounterOrders } from './counterOrders/dummyData';
import {
  calculateShiftDuration,
  checkInEmployee,
  checkOutEmployee,
  formatDateTimeReadable,
  formatTime12h,
  getEmployeeActivities,
  getEmployeeAttendance,
  getEmployeeProfile,
  getTodayAttendanceForEmployee,
  recordEmployeeWebsiteVisit,
} from '../../../utils/employeeStorage';

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const { orders, books } = useData();

  const [activeChannelTab, setActiveChannelTab] = useState('all'); // 'all', 'counter', 'online'
  const [attendanceTick, setAttendanceTick] = useState(0);

  useEffect(() => {
    if (currentUser?.id && currentUser?.role === 'employee') {
      recordEmployeeWebsiteVisit(currentUser.id, 'Employee Dashboard');
    }
  }, [currentUser?.id, currentUser?.role]);

  const { todayAttendance, hrProfile, recentAttendance, recentActivities } = useMemo(() => {
    void attendanceTick;
    if (!currentUser?.id) {
      return {
        todayAttendance: null,
        hrProfile: null,
        recentAttendance: [],
        recentActivities: [],
      };
    }
    return {
      todayAttendance: getTodayAttendanceForEmployee(currentUser.id),
      hrProfile: getEmployeeProfile(currentUser.id),
      recentAttendance: getEmployeeAttendance(currentUser.id).slice(0, 6),
      recentActivities: getEmployeeActivities(currentUser.id).slice(0, 8),
    };
  }, [currentUser?.id, attendanceTick]);

  const handleQuickCheckIn = () => {
    if (!currentUser?.id) return;
    checkInEmployee(currentUser.id);
    setAttendanceTick((t) => t + 1);
    toast.success(`Checked in at ${formatTime12h(new Date())}`);
  };

  const handleQuickCheckOut = () => {
    if (!currentUser?.id) return;
    checkOutEmployee(currentUser.id);
    setAttendanceTick((t) => t + 1);
    toast.success(`Checked out at ${formatTime12h(new Date())}`);
  };

  // Current date
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter orders by channel (merged with dummy data for counter orders)
  const counterOrders = useMemo(() => {
    const fromData = orders.filter(o => o.orderType === 'counter' || Boolean(o.shopName));
    const existingIds = new Set(fromData.map(o => o.id));
    return [...fromData, ...initialCounterOrders.filter(d => !existingIds.has(d.id))];
  }, [orders]);

  const onlineOrders = useMemo(() => {
    return orders.filter(o => o.orderType !== 'counter' && !o.shopName);
  }, [orders]);

  const todayCounterOrders = useMemo(() => {
    return counterOrders.filter(o => o.date === todayStr);
  }, [counterOrders, todayStr]);

  const todayOnlineOrders = useMemo(() => {
    return onlineOrders.filter(o => o.date === todayStr);
  }, [onlineOrders, todayStr]);

  // Financial sums for today
  const todayCounterSales = useMemo(() => {
    return todayCounterOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [todayCounterOrders]);

  const todayOnlineSales = useMemo(() => {
    return todayOnlineOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [todayOnlineOrders]);

  const todayTotalSales = useMemo(() => {
    return todayCounterSales + todayOnlineSales;
  }, [todayCounterSales, todayOnlineSales]);

  // Gross and commission sums for today
  const todayCounterGross = useMemo(() => {
    return todayCounterOrders.reduce(
      (sum, o) => sum + Number(o.subtotal || o.total || 0),
      0,
    );
  }, [todayCounterOrders]);

  const todayCommissionGiven = useMemo(() => {
    return Math.max(0, todayCounterGross - todayCounterSales);
  }, [todayCounterGross, todayCounterSales]);

  // Overall totals
  const totalOrdersCount = orders.length;
  const totalOnlineOrdersCount = onlineOrders.length;

  const pendingOnlineOrdersCount = useMemo(() => {
    return onlineOrders.filter(o => ['new', 'processing'].includes(o.status))
      .length;
  }, [onlineOrders]);

  const lowStockBooks = useMemo(() => {
    return books.filter(
      b => Number(b.stock || 0) <= Number(b.lowStockLimit || 5),
    );
  }, [books]);

  // 7-day Sales Comparison Data for Chart
  const salesChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('bn-BD', { weekday: 'short' });

      const dayCounterTotal = counterOrders
        .filter(o => o.date === dateStr)
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      const dayOnlineTotal = onlineOrders
        .filter(o => o.date === dateStr)
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      days.push({
        date: dateStr,
        day: dayLabel,
        'Counter Sales': dayCounterTotal,
        'Online Sales': dayOnlineTotal,
      });
    }
    return days;
  }, [counterOrders, onlineOrders]);

  return (
    <div className="space-y-5">
      {/* Clean Header & Shift Attendance Strip */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
              {currentUser?.name || 'Employee'}
            </h1>
            <span
              className={`text-xs font-semibold ${
                todayAttendance?.inAt && !todayAttendance?.outAt
                  ? 'text-emerald-700'
                  : todayAttendance?.outAt
                    ? 'text-slate-600'
                    : 'text-amber-700'
              }`}
            >
              •{' '}
              {todayAttendance?.inAt && !todayAttendance?.outAt
                ? 'On Duty'
                : todayAttendance?.outAt
                  ? 'Checked Out'
                  : 'Not Checked In'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            In:{' '}
            <strong className="text-emerald-700">
              {formatTime12h(todayAttendance?.inAt)}
            </strong>{' '}
            · Out:{' '}
            <strong className="text-slate-800">
              {formatTime12h(todayAttendance?.outAt)}
            </strong>
            {todayAttendance?.inAt && (
              <>
                {' '}
                · Duration:{' '}
                <strong className="text-slate-800">
                  {calculateShiftDuration(todayAttendance.inAt, todayAttendance.outAt)}
                </strong>
              </>
            )}
            {hrProfile?.joinedDate && (
              <>
                {' '}
                · Joined: <strong className="text-slate-700">{hrProfile.joinedDate}</strong>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!todayAttendance?.inAt && (
            <button
              type="button"
              onClick={handleQuickCheckIn}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <FiLogIn className="text-sm" />
              <span>Check In</span>
            </button>
          )}
          {todayAttendance?.inAt && !todayAttendance?.outAt && (
            <button
              type="button"
              onClick={handleQuickCheckOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
            >
              <FiLogOut className="text-sm" />
              <span>Check Out</span>
            </button>
          )}
          <Link
            to="/dashboard/counter-orders"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
          >
            <FiPlus className="text-sm" />
            <span>Counter Sale</span>
          </Link>
          <Link
            to="/dashboard/employee-profile"
            title="My Profile & Full Log"
            aria-label="My Profile & Full Log"
            className="p-2 text-slate-600 hover:text-dark transition"
          >
            <FiUser size={17} />
          </Link>
        </div>
      </div>

      {/* 4 Clean KPI Cards (Plain White, Icon Color Only) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Today&apos;s Sales</span>
            <FiDollarSign className="text-base text-slate-700" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(todayTotalSales)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Wholesale / Counter</span>
            <FiShoppingBag className="text-base text-amber-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(todayCounterSales)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Online Sales</span>
            <FiGlobe className="text-base text-blue-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(todayOnlineSales)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Orders</span>
            <FiPackage className="text-base text-emerald-600" />
          </div>
          <p className="mt-1.5 font-heading text-xl font-bold text-slate-900">
            {totalOrdersCount}
          </p>
        </div>
      </div>

      {/* Attendance & Work Summary (Arrival, Departure & Full Activity Summary) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Check-In & Check-Out Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FiClock className="text-emerald-600" />
              <h2 className="font-heading text-sm font-bold text-slate-900">
                Attendance Summary (In / Out)
              </h2>
            </div>
            <Link
              to="/dashboard/employee-profile"
              className="text-xs font-semibold text-primary-hover hover:underline"
            >
              Full History
            </Link>
          </div>

          {recentAttendance.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No attendance logs yet.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr className="whitespace-nowrap">
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Check In</th>
                    <th className="py-2 pr-3 font-semibold">Check Out</th>
                    <th className="py-2 text-right font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-slate-800">
                        {row.date}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-emerald-700">
                        {formatTime12h(row.inAt)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 font-semibold text-slate-700">
                        {row.outAt ? formatTime12h(row.outAt) : 'Active'}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right text-slate-500">
                        {calculateShiftDuration(row.inAt, row.outAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Work & Activity Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FiActivity className="text-blue-600" />
              <h2 className="font-heading text-sm font-bold text-slate-900">
                Work & Activity Summary
              </h2>
            </div>
            <Link
              to="/dashboard/employee-profile"
              className="text-xs font-semibold text-primary-hover hover:underline"
            >
              View All
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No recent activities recorded.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-3 py-2.5 text-xs">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        act.type === 'attendance'
                          ? 'text-emerald-600'
                          : act.type === 'website'
                            ? 'text-blue-600'
                            : act.type === 'expense'
                              ? 'text-amber-600'
                              : 'text-slate-600'
                      }`}
                    >
                      {act.type === 'attendance' ? (
                        <FiClock size={14} />
                      ) : act.type === 'website' ? (
                        <FiGlobe size={14} />
                      ) : act.type === 'expense' ? (
                        <FiDollarSign size={14} />
                      ) : (
                        <FiActivity size={14} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {act.title}
                      </p>
                      {act.description && (
                        <p className="truncate text-[11px] text-slate-500">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {formatDateTimeReadable(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SALES CHANNELS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-bold text-slate-900">
            Sales Overview
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveChannelTab('all')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeChannelTab === 'all'
                  ? 'bg-primary text-dark'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveChannelTab('counter')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeChannelTab === 'counter'
                  ? 'bg-primary text-dark'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Wholesale / Counter
            </button>
            <button
              type="button"
              onClick={() => setActiveChannelTab('online')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeChannelTab === 'online'
                  ? 'bg-primary text-dark'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Online
            </button>
          </div>
        </div>

        {/* Dual Split Panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* SECTION 1: COUNTER / WHOLESALE SALES */}
          {(activeChannelTab === 'all' || activeChannelTab === 'counter') && (
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FiShoppingBag className="text-amber-600" />
                    <h3 className="font-heading text-sm font-bold text-slate-900">
                      Wholesale & Counter Sales
                    </h3>
                  </div>
                  <Link
                    to="/dashboard/counter-orders"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-hover hover:underline"
                  >
                    <span>New Invoice</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Today&apos;s Memos</p>
                    <p className="font-bold text-slate-900">{todayCounterOrders.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sales</p>
                    <p className="font-bold text-slate-900">{formatCurrency(todayCounterSales)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Discount</p>
                    <p className="font-bold text-slate-900">{formatCurrency(todayCommissionGiven)}</p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-slate-100">
                  {counterOrders.slice(0, 4).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {order.shopName || order.customerName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {order.id} · {order.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                        <span
                          className={`text-[10px] font-semibold ${
                            order.paymentStatus === 'paid'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Due'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ONLINE SALES */}
          {(activeChannelTab === 'all' || activeChannelTab === 'online') && (
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FiGlobe className="text-blue-600" />
                    <h3 className="font-heading text-sm font-bold text-slate-900">
                      Online Sales ({pendingOnlineOrdersCount} pending)
                    </h3>
                  </div>
                  <Link
                    to="/dashboard/orders"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-hover hover:underline"
                  >
                    <span>Orders</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 text-center text-xs">
                  <div>
                    <p className="text-slate-500">Today&apos;s Orders</p>
                    <p className="font-bold text-slate-900">{todayOnlineOrders.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sales</p>
                    <p className="font-bold text-slate-900">{formatCurrency(todayOnlineSales)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Online</p>
                    <p className="font-bold text-slate-900">{totalOnlineOrdersCount}</p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-slate-100">
                  {onlineOrders.slice(0, 4).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {order.phone} · {order.address || 'Dhaka'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7-DAY SALES COMPARISON CHART */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <h2 className="font-heading text-sm font-bold text-slate-900">
            7-Day Sales (Counter vs Online)
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Counter
            </span>
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Online
            </span>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => `৳${v}`}
                width={55}
              />
              <Tooltip
                formatter={(val, name) => [formatCurrency(val), name]}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Bar dataKey="Counter Sales" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Online Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QUICK OPERATIONS & LOW STOCK */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <h2 className="border-b border-slate-100 pb-3 font-heading text-sm font-bold text-slate-900">
            Quick Access
          </h2>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <Link
              to="/dashboard/counter-orders"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary"
            >
              <div className="flex items-center gap-2.5">
                <FiPlus className="text-amber-600" />
                <span className="text-xs font-bold text-slate-900">New Counter Sale</span>
              </div>
              <FiArrowRight className="text-slate-400" size={14} />
            </Link>

            <Link
              to="/dashboard/orders"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary"
            >
              <div className="flex items-center gap-2.5">
                <FiTruck className="text-blue-600" />
                <span className="text-xs font-bold text-slate-900">Online Orders</span>
              </div>
              <FiArrowRight className="text-slate-400" size={14} />
            </Link>

            <Link
              to="/dashboard/stock"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary"
            >
              <div className="flex items-center gap-2.5">
                <FiPackage className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Stock Management</span>
              </div>
              <FiArrowRight className="text-slate-400" size={14} />
            </Link>

            <Link
              to="/dashboard/books"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary"
            >
              <div className="flex items-center gap-2.5">
                <FiBookOpen className="text-purple-600" />
                <span className="text-xs font-bold text-slate-900">Book Catalog</span>
              </div>
              <FiArrowRight className="text-slate-400" size={14} />
            </Link>

            <Link
              to="/dashboard/expense-profiles"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-primary sm:col-span-2"
            >
              <div className="flex items-center gap-2.5">
                <FiDollarSign className="text-emerald-700" />
                <span className="text-xs font-bold text-slate-900">Expense Profiles</span>
              </div>
              <FiArrowRight className="text-slate-400" size={14} />
            </Link>
          </div>
        </div>

        {/* Low Stock Watch */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" />
              <h2 className="font-heading text-sm font-bold text-slate-900">
                Low Stock
              </h2>
            </div>
            <span className="text-xs font-bold text-rose-600">
              {lowStockBooks.length}
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {lowStockBooks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Sufficient stock across catalog.
              </p>
            ) : (
              lowStockBooks.slice(0, 5).map(book => (
                <div
                  key={book.id}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <span className="truncate pr-2 font-medium text-slate-800">
                    {book.title}
                  </span>
                  <span className="shrink-0 font-bold text-rose-600">
                    {book.stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
