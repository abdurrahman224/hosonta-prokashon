import { useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiDollarSign,
  FiGlobe,
  FiPackage,
  FiPlus,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi';
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

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const { orders, books } = useData();

  const [activeChannelTab, setActiveChannelTab] = useState('all'); // 'all', 'counter', 'online'

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

  // Today's orders
  const todayOrders = useMemo(() => {
    return orders.filter(o => o.date === todayStr);
  }, [orders, todayStr]);

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
  const totalCounterOrdersCount = counterOrders.length;
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
    <div className="space-y-6">
      {/* Employee Greeting & Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark via-[#1e293b] to-dark p-6 text-white shadow-md sm:p-7">
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Employee & Sales Management Portal
              </span>
              <span className="text-xs text-white/60">
                Date:{' '}
                {new Date().toLocaleDateString('bn-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
              Welcome, {currentUser?.name || 'Employee'}! 👋
            </h1>
            <p className="max-w-2xl text-xs text-white/75 sm:text-sm">
              View today's counter sales, shop invoices and online e-commerce
              orders in real time below.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link
              to="/dashboard/counter-orders"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-dark shadow-sm transition hover:bg-primary-hover hover:scale-105"
            >
              <FiPlus className="text-base" />
              <span>New Counter Sale (POS)</span>
            </Link>
            <Link
              to="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <FiGlobe className="text-base" />
              <span>Online Orders ({pendingOnlineOrdersCount})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS (Requested by User) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Total Sales */}
        <div className="relative overflow-hidden rounded-2xl border border-dark/10 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Today's Total Sales
              </p>
              <h3 className="mt-1 font-heading text-2xl font-black text-dark lg:text-3xl">
                {formatCurrency(todayTotalSales)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-xl font-bold text-dark">
              <FiDollarSign />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dark/5 pt-2 text-xs">
            <span className="font-semibold text-emerald-700">
              {todayOrders.length} total orders completed
            </span>
            <span className="text-dark-muted">Counter + Online</span>
          </div>
        </div>

        {/* Card 2: Counter Sales */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Counter Sales (Shop)
                </p>
              </div>
              <h3 className="mt-1 font-heading text-2xl font-black text-amber-950 lg:text-3xl">
                {formatCurrency(todayCounterSales)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-xl font-bold text-amber-800">
              <FiShoppingBag />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dark/5 pt-2 text-xs">
            <span className="font-bold text-amber-800">
              {todayCounterOrders.length} counter memos
            </span>
            <span className="text-dark-muted">
              Discount: {formatCurrency(todayCommissionGiven)}
            </span>
          </div>
        </div>

        {/* Card 3: Online Sales */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Online Sales (E-Commerce)
                </p>
              </div>
              <h3 className="mt-1 font-heading text-2xl font-black text-blue-950 lg:text-3xl">
                {formatCurrency(todayOnlineSales)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-xl font-bold text-blue-800">
              <FiGlobe />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dark/5 pt-2 text-xs">
            <span className="font-bold text-blue-800">
              {todayOnlineOrders.length} online orders
            </span>
            <span className="text-dark-muted">
              {pendingOnlineOrdersCount} processing
            </span>
          </div>
        </div>

        {/* Card 4: Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-dark/10 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-dark-muted">
                Total Orders
              </p>
              <h3 className="mt-1 font-heading text-2xl font-black text-dark lg:text-3xl">
                {totalOrdersCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark/10 text-xl font-bold text-dark">
              <FiPackage />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dark/5 pt-2 text-xs">
            <span className="font-semibold text-dark">
              Counter: {totalCounterOrdersCount} | Online:{' '}
              {totalOnlineOrdersCount}
            </span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
              96% Success
            </span>
          </div>
        </div>
      </div>

      {/* SALES SEPARATION: COUNTER SALES VS ONLINE SALES (DUAL COMMAND BLOCKS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-dark">
              Sales Analysis (Counter vs Online)
            </h2>
            <p className="text-xs text-dark-muted">
              Manage counter sales and online e-commerce channels separately
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-dark/10 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveChannelTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeChannelTab === 'all'
                  ? 'bg-primary text-dark shadow-2xs'
                  : 'text-dark-muted hover:text-dark'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setActiveChannelTab('counter')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeChannelTab === 'counter'
                  ? 'bg-primary text-dark shadow-2xs'
                  : 'text-dark-muted hover:text-dark'
              }`}
            >
              Counter Only
            </button>
            <button
              type="button"
              onClick={() => setActiveChannelTab('online')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeChannelTab === 'online'
                  ? 'bg-primary text-dark shadow-2xs'
                  : 'text-dark-muted hover:text-dark'
              }`}
            >
              Online Only
            </button>
          </div>
        </div>

        {/* Dual Split Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* SECTION 1: COUNTER SALES */}
          {(activeChannelTab === 'all' || activeChannelTab === 'counter') && (
            <div className="flex flex-col justify-between rounded-2xl border-2 border-amber-500/25 bg-white p-5 shadow-xs transition hover:border-amber-500/40 sm:p-6">
              <div>
                <div className="flex items-center justify-between border-b border-dark/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-lg font-bold text-amber-800">
                      <FiShoppingBag />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-dark">
                          Counter Sales (Shop & Wholesale)
                        </h3>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          Showroom
                        </span>
                      </div>
                      <p className="text-xs text-dark-muted">
                        Create bookshop, library invoices and direct cash memos
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/dashboard/counter-orders"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700"
                  >
                    <span>Create Invoice</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>

                {/* Counter Quick Metrics Bar */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-amber-50/50 p-3 text-center">
                  <div>
                    <p className="text-[11px] font-semibold text-amber-900/70">
                      Today's Memos
                    </p>
                    <p className="font-heading text-lg font-bold text-amber-950">
                      {todayCounterOrders.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-900/70">
                      Today's Total Sales
                    </p>
                    <p className="font-heading text-lg font-bold text-amber-950">
                      {formatCurrency(todayCounterSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-900/70">
                      Average Commission
                    </p>
                    <p className="font-heading text-lg font-bold text-amber-950">
                      35%
                    </p>
                  </div>
                </div>

                {/* Recent Counter Orders Table */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-dark-muted">
                    Recent Counter Invoices:
                  </p>
                  <div className="divide-y divide-dark/5 overflow-hidden rounded-xl border border-dark/10 bg-white">
                    {counterOrders.slice(0, 4).map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 text-xs transition hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-bold text-dark">
                            {order.shopName || order.customerName}
                          </p>
                          <p className="text-[11px] text-dark-muted">
                            {order.phone} • Memo: {order.id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark">
                            {formatCurrency(order.total)}
                          </p>
                          <div className="mt-0.5 flex items-center justify-end gap-1.5">
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                              {order.commission || 0}% Commission
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {order.paymentStatus === 'paid'
                                ? 'Paid'
                                : 'Due'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Counter Action Footer */}
              <div className="mt-5 pt-3">
                <Link
                  to="/dashboard/counter-orders"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-dark shadow-xs transition hover:bg-amber-400"
                >
                  <FiPlus />
                  <span>Create New Counter Order</span>
                </Link>
              </div>
            </div>
          )}

          {/* SECTION 2: ONLINE SALES */}
          {(activeChannelTab === 'all' || activeChannelTab === 'online') && (
            <div className="flex flex-col justify-between rounded-2xl border-2 border-blue-500/25 bg-white p-5 shadow-xs transition hover:border-blue-500/40 sm:p-6">
              <div>
                <div className="flex items-center justify-between border-b border-dark/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg font-bold text-blue-800">
                      <FiGlobe />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-dark">
                          Online Sales (Website & Courier)
                        </h3>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                          E-Commerce
                        </span>
                      </div>
                      <p className="text-xs text-dark-muted">
                        Manage website orders and courier home delivery
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/dashboard/orders"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700"
                  >
                    <span>Order List</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>

                {/* Online Quick Metrics Bar */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-blue-50/50 p-3 text-center">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-900/70">
                      Today's Orders
                    </p>
                    <p className="font-heading text-lg font-bold text-blue-950">
                      {todayOnlineOrders.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-900/70">
                      Today's Total Sales
                    </p>
                    <p className="font-heading text-lg font-bold text-blue-950">
                      {formatCurrency(todayOnlineSales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-blue-900/70">
                      Pending Deliveries
                    </p>
                    <p className="font-heading text-lg font-bold text-blue-950">
                      {pendingOnlineOrdersCount}
                    </p>
                  </div>
                </div>

                {/* Recent Online Orders Table */}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-dark-muted">
                    Recent Online Orders:
                  </p>
                  <div className="divide-y divide-dark/5 overflow-hidden rounded-xl border border-dark/10 bg-white">
                    {onlineOrders.slice(0, 4).map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 text-xs transition hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-bold text-dark">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-dark-muted">
                            {order.phone} • {order.address || 'Dhaka'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-dark">
                            {formatCurrency(order.total)}
                          </p>
                          <div className="mt-0.5 flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-dark-muted uppercase">
                              {order.paymentMethod === 'cod'
                                ? 'Cash on Delivery'
                                : order.paymentMethod}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Online Action Footer */}
              <div className="mt-5 pt-3">
                <Link
                  to="/dashboard/orders"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <FiTruck />
                  <span>Process and Ship Online Orders</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SALES COMPARISON CHART: COUNTER VS ONLINE */}
      <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-dark/10 pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-dark">
              7-Day Sales Comparison (Counter vs Online)
            </h2>
            <p className="text-xs text-dark-muted">
              Daily revenue analysis for both sales channels
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="h-3 w-3 rounded-sm bg-amber-500" /> Counter Sales
            </span>
            <span className="flex items-center gap-1.5 text-blue-800">
              <span className="h-3 w-3 rounded-sm bg-blue-500" /> Online Sales
            </span>
          </div>
        </div>

        <div className="mt-6 h-72 w-full">
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
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Bar
                dataKey="Counter Sales"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
              />
              <Bar dataKey="Online Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QUICK ACTIONS & LOW STOCK ALERTS (NO CUSTOMER MESSAGES!) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Operations (2 cols) */}
        <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6 lg:col-span-2">
          <div className="border-b border-dark/10 pb-3">
            <h2 className="font-heading text-lg font-bold text-dark">
              Quick Operations
            </h2>
            <p className="text-xs text-dark-muted">
              Frequently used shortcuts for regular tasks
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to="/dashboard/counter-orders"
              className="group flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-50/30 p-3.5 transition hover:border-amber-500 hover:bg-amber-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 transition group-hover:scale-105">
                  <FiPlus />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-dark">
                    New Counter Sale
                  </h4>
                  <p className="text-xs text-dark-muted">
                    Create showroom or wholesale invoice
                  </p>
                </div>
              </div>
              <FiArrowRight className="text-dark-muted transition group-hover:translate-x-1 group-hover:text-dark" />
            </Link>

            <Link
              to="/dashboard/orders"
              className="group flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-50/30 p-3.5 transition hover:border-blue-500 hover:bg-blue-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-800 transition group-hover:scale-105">
                  <FiTruck />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-dark">
                    Online Order Management
                  </h4>
                  <p className="text-xs text-dark-muted">
                    Approve orders and arrange courier delivery
                  </p>
                </div>
              </div>
              <FiArrowRight className="text-dark-muted transition group-hover:translate-x-1 group-hover:text-dark" />
            </Link>

            <Link
              to="/dashboard/stock"
              className="group flex items-center justify-between rounded-xl border border-dark/10 bg-gray-50/60 p-3.5 transition hover:border-primary hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition group-hover:scale-105">
                  <FiPackage />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-dark">
                    Stock Management
                  </h4>
                  <p className="text-xs text-dark-muted">
                    Monitor inventory and update stock
                  </p>
                </div>
              </div>
              <FiArrowRight className="text-dark-muted transition group-hover:translate-x-1 group-hover:text-dark" />
            </Link>

            <Link
              to="/dashboard/books"
              className="group flex items-center justify-between rounded-xl border border-dark/10 bg-gray-50/60 p-3.5 transition hover:border-primary hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 transition group-hover:scale-105">
                  <FiBookOpen />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-dark">
                    Book Catalog
                  </h4>
                  <p className="text-xs text-dark-muted">
                    Review all book prices and information
                  </p>
                </div>
              </div>
              <FiArrowRight className="text-dark-muted transition group-hover:translate-x-1 group-hover:text-dark" />
            </Link>
          </div>
        </div>

        {/* Low Stock Watch (1 col) */}
        <div className="rounded-2xl border border-dark/10 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between border-b border-dark/10 pb-3">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" />
              <h2 className="font-heading text-lg font-bold text-dark">
                Low Stock Alert
              </h2>
            </div>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
              {lowStockBooks.length} books
            </span>
          </div>

          <p className="mt-1 text-xs text-dark-muted">
            Confirm stock before counter or online sales
          </p>

          <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {lowStockBooks.length === 0 ? (
              <div className="py-6 text-center text-xs text-dark-muted">
                All books have sufficient stock.
              </div>
            ) : (
              lowStockBooks.slice(0, 5).map(book => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-xl border border-dark/5 bg-gray-50 p-2.5 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold text-dark">{book.title}</p>
                    <p className="text-[11px] text-dark-muted">{book.author}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                    Stock: {book.stock} copies
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-dark/5 pt-3">
            <Link
              to="/dashboard/stock"
              className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-bold text-primary-hover hover:underline"
            >
              <span>Go to Stock Inventory</span>
              <FiArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
