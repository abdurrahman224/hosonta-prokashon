import { useMemo, useState } from 'react';
import { FiCalendar, FiEye, FiPlus, FiPrinter, FiShoppingBag, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DataTable from '../../../../components/dashboard/DataTable';
import { useData } from '../../../../context/useData';
import { formatCurrency } from '../../../../utils/format';
import CashMemoModal from './CashMemoModal';
import { initialCounterOrders } from './dummyData';
import OrderDetailsModal from './OrderDetailsModal';
import AddShopModal from '../../../../components/dashboard/AddShopModal';
import ShopManagement from '../../admin/ShopManagement';

const TODAY_DATE = new Date().toISOString().slice(0, 10);

const orderDay = order => (order.date || '').slice(0, 10);

const shiftDay = (day, delta) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

const formatDay = day =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export default function CounterOrders() {
  const { orders } = useData();

  const [activeMainTab, setActiveMainTab] = useState('orders'); // 'orders' | 'shops'
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'today', 'paid', 'due'
  const [dateFrom, setDateFrom] = useState(''); // '' = no start limit, else YYYY-MM-DD
  const [dateTo, setDateTo] = useState(''); // '' = no end limit, else YYYY-MM-DD
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const todayStr = TODAY_DATE;

  // Merge real counter orders from context with dummy counter orders
  const allCounterOrders = useMemo(() => {
    const fromContext = orders.filter(
      o => o.orderType === 'counter' || Boolean(o.shopName),
    );
    const existingIds = new Set(fromContext.map(o => o.id));
    const merged = [
      ...fromContext,
      ...initialCounterOrders.filter(d => !existingIds.has(d.id)),
    ];
    return merged.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  }, [orders]);

  const hasRange = Boolean(dateFrom || dateTo);
  const rangeLabel = !hasRange
    ? ''
    : dateFrom && dateTo
      ? dateFrom === dateTo
        ? formatDay(dateFrom)
        : `${formatDay(dateFrom)} – ${formatDay(dateTo)}`
      : dateFrom
        ? `From ${formatDay(dateFrom)}`
        : `Up to ${formatDay(dateTo)}`;

  // Orders inside the picked date range (everything when no range is picked)
  const dateOrders = useMemo(
    () =>
      allCounterOrders.filter(o => {
        const day = orderDay(o);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      }),
    [allCounterOrders, dateFrom, dateTo],
  );

  // Statistics calculation (always for today, independent of the date picker)
  const stats = useMemo(() => {
    const todayOrders = allCounterOrders.filter(o => orderDay(o) === todayStr);
    const todaySales = todayOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );
    const todayCommission = todayOrders.reduce((sum, o) => {
      const subtotal = Number(o.subtotal || o.total || 0);
      const total = Number(o.total || 0);
      const discount =
        o.commissionAmount !== undefined
          ? o.commissionAmount
          : Math.max(0, subtotal - total);
      return sum + discount;
    }, 0);

    return {
      todaySales,
      todayCount: todayOrders.length,
      todayCommission,
      totalCount: allCounterOrders.length,
    };
  }, [allCounterOrders, todayStr]);

  // Tab filtered orders (on top of the date filter)
  const tabFilteredOrders = useMemo(() => {
    return dateOrders.filter(order => {
      if (statusFilter === 'today') {
        return orderDay(order) === todayStr;
      }
      if (statusFilter === 'paid') {
        return order.paymentStatus === 'paid';
      }
      if (statusFilter === 'due') {
        return order.paymentStatus === 'due';
      }
      return true;
    });
  }, [dateOrders, statusFilter, todayStr]);

  // Tab definitions (counts follow the picked date)
  const tabs = useMemo(
    () => [
      { id: 'all', label: 'All Orders', count: dateOrders.length },
      {
        id: 'today',
        label: 'Today',
        count: dateOrders.filter(o => orderDay(o) === todayStr).length,
      },
      {
        id: 'paid',
        label: 'Paid',
        count: dateOrders.filter(o => o.paymentStatus === 'paid').length,
      },
      {
        id: 'due',
        label: 'Due',
        count: dateOrders.filter(o => o.paymentStatus === 'due').length,
      },
    ],
    [dateOrders, todayStr],
  );

  // Summary of the picked range
  const dateSummary = useMemo(() => {
    if (!hasRange) return null;
    return {
      count: dateOrders.length,
      sales: dateOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    };
  }, [dateOrders, hasRange]);

  const setRange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    // "Today" tab makes no sense for a past range, so go back to All
    if (statusFilter === 'today') setStatusFilter('all');
  };

  const changeFrom = value => {
    setRange(value, value && dateTo && value > dateTo ? value : dateTo);
  };

  const changeTo = value => {
    setRange(value && dateFrom && value < dateFrom ? value : dateFrom, value);
  };

  const presets = [
    { id: 'today', label: 'Today', from: todayStr, to: todayStr },
    {
      id: '7d',
      label: 'Last 7 days',
      from: shiftDay(todayStr, -6),
      to: todayStr,
    },
    {
      id: '30d',
      label: 'Last 30 days',
      from: shiftDay(todayStr, -29),
      to: todayStr,
    },
    {
      id: 'month',
      label: 'This month',
      from: `${todayStr.slice(0, 8)}01`,
      to: todayStr,
    },
  ];

  // Columns definition with English headers
  const columns = useMemo(
    () => [
      {
        key: 'shopName',
        header: 'Shop Name',
        sortable: true,
        sortValue: order => order.shopName || order.customerName,
        render: order => (
          <div>
            <span className="font-semibold text-slate-800 block">
              {order.shopName || order.customerName}
            </span>
            {order.representative && (
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Rep: {order.representative}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'id',
        header: 'Order ID',
        sortable: true,
        render: order => (
          <span className="font-medium text-slate-600">{order.id}</span>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: order => (
          <span className="text-slate-600 font-normal">{order.phone}</span>
        ),
      },
      {
        key: 'commission',
        header: 'Commission',
        align: 'center',
        sortable: true,
        sortValue: order => Number(order.commission || 0),
        render: order => {
          const subtotal = Number(order.subtotal || order.total || 0);
          const total = Number(order.total || 0);
          const commissionPct = Number(order.commission || 0);
          const commissionDeduction =
            order.commissionAmount !== undefined
              ? order.commissionAmount
              : Math.max(0, subtotal - total);

          return (
            <div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {commissionPct}%
              </span>
              {commissionDeduction > 0 && (
                <span className="block text-[11px] text-rose-500 mt-0.5">
                  - ৳{commissionDeduction}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'total',
        header: 'Total Amount',
        align: 'right',
        sortable: true,
        sortValue: order => Number(order.total || 0),
        render: order => (
          <span className="font-semibold text-slate-900 text-sm">
            {formatCurrency(Number(order.total || 0))}
          </span>
        ),
      },
      {
        key: 'paymentStatus',
        header: 'Payment Status',
        align: 'center',
        render: order => (
          <span
            className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
              order.paymentStatus === 'paid'
                ? 'bg-emerald-50 text-emerald-600'
                : order.paymentStatus === 'due'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
            }`}
          >
            {order.paymentStatus === 'paid'
              ? 'Paid'
              : order.paymentStatus === 'due'
                ? 'Due'
                : 'Partial'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'center',
        render: order => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedDetailsOrder(order);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
              title="View details"
            >
              <FiEye size={13} />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedInvoiceOrder(order);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Print memo"
            >
              <FiPrinter size={13} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Top Header with Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Counter Sales & POS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showroom orders, retail shop invoices and POS management
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* দোকান এড করো বাটন */}
          <button
            type="button"
            onClick={() => setIsAddShopOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dark/15 bg-white px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-cream hover:border-dark/30 shadow-xs"
          >
            <FiShoppingBag size={15} className="text-primary" />
            <span>দোকান এড করুন</span>
          </button>

          <Link
            to="/dashboard/counter-orders/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover shadow-xs"
          >
            <FiPlus size={16} />
            <span>New Counter Order</span>
          </Link>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex border-b border-dark/10 bg-white px-3 rounded-xl shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeMainTab === 'orders'
              ? 'border-primary text-dark'
              : 'border-transparent text-dark/60 hover:text-dark'
          }`}
        >
          <FiCalendar size={14} /> কাউন্টার সেলস চালান
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('shops')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeMainTab === 'shops'
              ? 'border-primary text-dark'
              : 'border-transparent text-dark/60 hover:text-dark'
          }`}
        >
          <FiShoppingBag size={14} /> দোকান ও গ্রাহক প্রোফাইল
        </button>
      </div>

      {activeMainTab === 'shops' ? (
        <div className="pt-2">
          <ShopManagement embedded={true} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">
            Today's Sales
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-heading text-xl font-bold text-slate-900">
              {formatCurrency(stats.todaySales)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              {stats.todayCount} memos
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">
            Today's Commission
          </span>
          <div className="mt-1">
            <span className="font-heading text-xl font-bold text-amber-600">
              {formatCurrency(stats.todayCommission)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">
            Total Counter Orders
          </span>
          <div className="mt-1">
            <span className="font-heading text-xl font-bold text-slate-900">
              {stats.totalCount}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">
            POS Desk
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">
              ● Active
            </span>
            <Link
              to="/dashboard/counter-orders/new"
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              + Create Entry
            </Link>
          </div>
        </div>
      </div>

      {/* Delivery Activities heading + date range */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Delivery Activities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your counter shipments and POS activities
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">
              From
            </span>
            <span className="relative block">
              <FiCalendar
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || todayStr}
                onChange={e => changeFrom(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </span>
          </label>

          <span className="pb-2 text-sm text-slate-400">to</span>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">
              To
            </span>
            <span className="relative block">
              <FiCalendar
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={todayStr}
                onChange={e => changeTo(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {presets.map(preset => {
              const active = dateFrom === preset.from && dateTo === preset.to;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRange(preset.from, preset.to)}
                  className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {hasRange && (
              <button
                type="button"
                onClick={() => setRange('', '')}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <FiX size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {dateSummary && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            {rangeLabel}
            {dateFrom === todayStr && dateTo === todayStr && ' (Today)'}
          </span>
          <span>{dateSummary.count} orders</span>
          <span>
            Sales:{' '}
            <span className="font-semibold">
              {formatCurrency(dateSummary.sales)}
            </span>
          </span>
        </div>
      )}

      {/* Reusable Clean Table Component */}
      <DataTable
        columns={columns}
        data={tabFilteredOrders}
        searchKeys={['id', 'shopName', 'customerName', 'phone']}
        searchPlaceholder="Search shop, order ID, or phone..."
        tabs={tabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        pageSize={10}
        emptyMessage={
          hasRange
            ? `No counter orders for ${rangeLabel}.`
            : 'No counter orders found.'
        }
        onRowClick={order => setSelectedDetailsOrder(order)}
      />
        </>
      )}

      {/* Modals */}
      {selectedDetailsOrder && (
        <OrderDetailsModal
          order={selectedDetailsOrder}
          onClose={() => setSelectedDetailsOrder(null)}
          onPrint={() => setSelectedInvoiceOrder(selectedDetailsOrder)}
        />
      )}

      {selectedInvoiceOrder && (
        <CashMemoModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Add Shop Modal */}
      <AddShopModal
        isOpen={isAddShopOpen}
        onClose={() => setIsAddShopOpen(false)}
        onCreated={() => {
          setActiveMainTab('shops');
        }}
      />
    </div>
  );
}
