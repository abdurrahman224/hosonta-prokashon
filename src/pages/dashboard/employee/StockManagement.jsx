import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiBox,
  FiClock,
  FiDownload,
  FiMinus,
  FiMonitor,
  FiPlus,
  FiShoppingBag,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { getCategoryLabel } from '../../../utils/i18n';
import { PERMISSIONS } from '../../../utils/roles';

/* ---------- helpers ---------- */

const REASON_PRESETS = {
  add: ['New shipment received', 'Customer return', 'Stock count correction'],
  remove: ['Damaged copies', 'Lost / missing', 'Stock count correction'],
  set: ['Physical stock count', 'Stock count correction'],
};

const getStatus = book => {
  const stock = Number(book.stock || 0);
  const limit = Number(book.lowStockLimit || 0);
  if (stock <= 0) return 'out';
  if (stock <= limit) return 'low';
  return 'ok';
};

const STATUS_STYLE = {
  ok: {
    label: 'In Stock',
    badge: 'bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
  },
  low: {
    label: 'Low Stock',
    badge: 'bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
  },
  out: {
    label: 'Out of Stock',
    badge: 'bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
  },
};

const CHANNEL_STYLE = {
  counter: { label: 'Counter Sale', badge: 'bg-violet-50 text-violet-700' },
  online: { label: 'Online Sale', badge: 'bg-sky-50 text-sky-700' },
  manual: { label: 'Manual Adjustment', badge: 'bg-slate-100 text-slate-600' },
};

// Works with entry.channel = 'counter' | 'online' (also tolerates saleType / source)
const getChannel = entry => {
  const raw = String(
    entry.channel || entry.saleType || entry.source || '',
  ).toLowerCase();
  if (/counter|pos|offline|shop/.test(raw)) return 'counter';
  if (/online|web|order/.test(raw)) return 'online';
  return 'manual';
};

// Set to false to hide the dummy rows and show only real history
const USE_DUMMY_HISTORY = true;

const DUMMY_STOCK_HISTORY = [
  {
    id: 'dummy-1',
    bookTitle: 'পথের পাঁচালী',
    unitPrice: 350,
    delta: -2,
    reason: 'Counter sale',
    channel: 'counter',
    userName: 'Rahim',
    userRole: 'Employee',
    previousStock: 24,
    newStock: 22,
    createdAt: '2026-11-20T11:45:00',
  },
  {
    id: 'dummy-2',
    bookTitle: 'হাজার বছর ধরে',
    unitPrice: 420,
    delta: -1,
    reason: 'Online order #1042',
    channel: 'online',
    userName: 'Website',
    userRole: 'Online Store',
    previousStock: 15,
    newStock: 14,
    createdAt: '2026-11-20T10:20:00',
  },
  {
    id: 'dummy-3',
    bookTitle: 'লালসালু',
    unitPrice: 280,
    delta: 30,
    reason: 'New shipment received',
    channel: 'manual',
    userName: 'Admin',
    userRole: 'Admin',
    previousStock: 5,
    newStock: 35,
    createdAt: '2026-11-19T16:10:00',
  },
  {
    id: 'dummy-4',
    bookTitle: 'দেবদাস',
    unitPrice: 200,
    delta: -3,
    reason: 'Online order #1039',
    channel: 'online',
    userName: 'Website',
    userRole: 'Online Store',
    previousStock: 12,
    newStock: 9,
    createdAt: '2026-11-19T14:35:00',
  },
  {
    id: 'dummy-5',
    bookTitle: 'পথের পাঁচালী',
    unitPrice: 350,
    delta: -1,
    reason: 'Counter sale',
    channel: 'counter',
    userName: 'Karim',
    userRole: 'Moderator',
    previousStock: 25,
    newStock: 24,
    createdAt: '2026-11-19T12:05:00',
  },
  {
    id: 'dummy-6',
    bookTitle: 'শেষের কবিতা',
    unitPrice: 300,
    delta: -4,
    reason: 'Counter sale',
    channel: 'counter',
    userName: 'Rahim',
    userRole: 'Employee',
    previousStock: 18,
    newStock: 14,
    createdAt: '2026-11-18T17:40:00',
  },
  {
    id: 'dummy-7',
    bookTitle: 'নীল দংশন',
    unitPrice: 380,
    delta: -2,
    reason: 'Online order #1031',
    channel: 'online',
    userName: 'Website',
    userRole: 'Online Store',
    previousStock: 8,
    newStock: 6,
    createdAt: '2026-11-18T13:15:00',
  },
  {
    id: 'dummy-8',
    bookTitle: 'দেবদাস',
    unitPrice: 200,
    delta: -2,
    reason: 'Damaged copies',
    channel: 'manual',
    userName: 'Admin',
    userRole: 'Admin',
    previousStock: 14,
    newStock: 12,
    createdAt: '2026-11-17T15:00:00',
  },
  {
    id: 'dummy-9',
    bookTitle: 'হাজার বছর ধরে',
    unitPrice: 420,
    delta: 1,
    reason: 'Customer return',
    channel: 'manual',
    userName: 'Karim',
    userRole: 'Moderator',
    previousStock: 14,
    newStock: 15,
    createdAt: '2026-11-17T11:30:00',
  },
  {
    id: 'dummy-10',
    bookTitle: 'লালসালু',
    unitPrice: 280,
    delta: -5,
    reason: 'Counter sale',
    channel: 'counter',
    userName: 'Rahim',
    userRole: 'Employee',
    previousStock: 10,
    newStock: 5,
    createdAt: '2026-11-16T18:20:00',
  },
  {
    id: 'dummy-11',
    bookTitle: 'শেষের কবিতা',
    unitPrice: 300,
    delta: -1,
    reason: 'Online order #1024',
    channel: 'online',
    userName: 'Website',
    userRole: 'Online Store',
    previousStock: 19,
    newStock: 18,
    createdAt: '2026-11-16T09:50:00',
  },
  {
    id: 'dummy-12',
    bookTitle: 'নীল দংশন',
    unitPrice: 380,
    delta: 20,
    reason: 'New shipment received',
    channel: 'manual',
    userName: 'Admin',
    userRole: 'Admin',
    previousStock: 0,
    newStock: 20,
    createdAt: '2026-11-15T12:00:00',
  },
];

const money = value =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const entryDate = entry =>
  entry.createdAt || entry.date || entry.timestamp || null;

const formatDate = value => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const entryMatchesBook = (entry, book) =>
  entry.bookId !== undefined
    ? entry.bookId === book.id
    : entry.bookTitle === book.title;

const downloadCsv = rows => {
  const header = [
    'Title',
    'Author',
    'Category',
    'SKU/ISBN',
    'Price',
    'Current Stock',
    'Alert Limit',
    'Status',
    'Stock Value',
  ];
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(book =>
    [
      book.title,
      book.author,
      book.category,
      book.isbn || book.sku || '',
      book.price ?? '',
      book.stock,
      book.lowStockLimit,
      STATUS_STYLE[getStatus(book)].label,
      Number(book.price || 0) * Number(book.stock || 0),
    ]
      .map(escape)
      .join(','),
  );
  const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stock-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/* ---------- page ---------- */

function StockManagement() {
  const { books, stockHistory, updateBookStock } = useData();
  const { currentUser, can } = useAuth();
  const [view, setView] = useState('inventory'); // 'inventory' | 'history'
  const [selectedBook, setSelectedBook] = useState(null);
  const [historyBook, setHistoryBook] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [category, setCategory] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historyLimit, setHistoryLimit] = useState(10);

  const canManage = can(PERMISSIONS.STOCK_MANAGE);

  const adjustStock = (delta, reason) => {
    if (!canManage) return false;
    const result = updateBookStock(
      selectedBook.id,
      delta,
      reason,
      currentUser.id,
      {
        channel: 'manual',
        userName: currentUser?.name,
        userRole: currentUser?.role,
      },
    );
    if (!result.success) {
      toast.error(result.message);
      return false;
    }
    toast.success('Stock updated successfully.');
    setSelectedBook(null);
    return true;
  };

  const quickAdjustStock = (book, delta) => {
    if (!canManage) return;
    const reason =
      delta > 0
        ? `Quick stock increment (+${delta})`
        : `Quick stock decrement (${delta})`;
    const result = updateBookStock(book.id, delta, reason, currentUser?.id, {
      channel: 'manual',
      userName: currentUser?.name,
      userRole: currentUser?.role,
    });
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(
      `${book.title}: stock ${delta > 0 ? 'increased' : 'decreased'} to ${Number(book.stock || 0) + delta}.`,
    );
  };

  const categories = useMemo(
    () => [...new Set(books.map(book => book.category).filter(Boolean))].sort(),
    [books],
  );

  const summary = useMemo(() => {
    let units = 0;
    let value = 0;
    let low = 0;
    let out = 0;
    books.forEach(book => {
      const stock = Number(book.stock || 0);
      units += stock;
      value += stock * Number(book.price || 0);
      const status = getStatus(book);
      if (status === 'low') low += 1;
      if (status === 'out') out += 1;
    });
    return {
      titles: books.length,
      units,
      value,
      low,
      out,
      ok: books.length - low - out,
    };
  }, [books]);

  const lastUpdatedByBook = useMemo(() => {
    const map = new Map();
    stockHistory.forEach(entry => {
      const key = entry.bookId !== undefined ? entry.bookId : entry.bookTitle;
      const time = new Date(entryDate(entry) || 0).getTime();
      if (!map.has(key) || time > map.get(key)) map.set(key, time);
    });
    return map;
  }, [stockHistory]);

  const tabs = [
    { id: 'all', label: 'All Books', count: summary.titles },
    { id: 'ok', label: 'In Stock', count: summary.ok },
    { id: 'low', label: 'Low Stock', count: summary.low },
    { id: 'out', label: 'Out of Stock', count: summary.out },
  ];

  const displayedBooks = useMemo(
    () =>
      books.filter(book => {
        if (activeTab !== 'all' && getStatus(book) !== activeTab) return false;
        if (category !== 'all' && book.category !== category) return false;
        return true;
      }),
    [books, activeTab, category],
  );

  const history = useMemo(() => {
    if (!USE_DUMMY_HISTORY) return stockHistory;
    return [...stockHistory, ...DUMMY_STOCK_HISTORY].sort(
      (a, b) =>
        new Date(entryDate(b) || 0).getTime() -
        new Date(entryDate(a) || 0).getTime(),
    );
  }, [stockHistory]);

  const filteredHistory = useMemo(
    () =>
      history.filter(entry => {
        const channel = getChannel(entry);
        if (historyFilter === 'in') return entry.delta > 0;
        if (historyFilter === 'out') return entry.delta < 0;
        if (historyFilter === 'counter')
          return channel === 'counter' && entry.delta < 0;
        if (historyFilter === 'online')
          return channel === 'online' && entry.delta < 0;
        return true;
      }),
    [history, historyFilter],
  );

  const salesSummary = useMemo(() => {
    const result = {
      counter: { units: 0, count: 0 },
      online: { units: 0, count: 0 },
    };
    history.forEach(entry => {
      const channel = getChannel(entry);
      if (entry.delta < 0 && result[channel]) {
        result[channel].units += Math.abs(entry.delta);
        result[channel].count += 1;
      }
    });
    return result;
  }, [history]);

  return (
    <>
      <PageHeader
        title="Stock Management"
        description="Monitor inventory levels, stock value and every stock movement in one place."
      />

      {view === 'inventory' && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <SummaryCard
              icon={FiBox}
              label="Total Titles"
              value={summary.titles}
              tone="text-blue-600 bg-blue-50"
            />
            <SummaryCard
              icon={FiBox}
              label="Total Units"
              value={summary.units}
              tone="text-slate-700 bg-slate-100"
            />
            <SummaryCard
              icon={FiBox}
              label="Inventory Value"
              value={money(summary.value)}
              tone="text-emerald-600 bg-emerald-50"
            />
            <SummaryCard
              icon={FiAlertTriangle}
              label="Low Stock"
              value={summary.low}
              tone="text-amber-600 bg-amber-50"
              onClick={() => setActiveTab('low')}
            />
            <SummaryCard
              icon={FiXCircle}
              label="Out of Stock"
              value={summary.out}
              tone="text-rose-600 bg-rose-50"
              onClick={() => setActiveTab('out')}
            />
          </div>

          {/* View switch */}
          <div className="mt-5 flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            {[
              { id: 'inventory', label: 'Stock Inventory' },
              { id: 'history', label: 'History' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`rounded-lg px-4 py-2 ${
                  view === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              Category
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="all">All categories</option>
                {categories.map(item => (
                  <option key={item} value={item}>
                    {getCategoryLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => downloadCsv(displayedBooks)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FiDownload /> Export CSV
            </button>
          </div>

          <div className="mt-3">
            <DataTable
              title="Stock Inventory"
              subtitle="Stock level, value and status for every book in your catalog"
              pageSize={10}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              data={displayedBooks}
              onRowClick={book =>
                canManage ? setSelectedBook(book) : setHistoryBook(book)
              }
              searchKeys={['title', 'author', 'category', 'isbn', 'sku']}
              searchPlaceholder="Search by title, author, category or ISBN..."
              columns={[
                {
                  key: 'title',
                  header: 'Book Details',
                  cellClassName: 'whitespace-nowrap',
                  render: book => (
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <img
                        src={book.cover}
                        alt=""
                        className="h-11 w-8 shrink-0 rounded-lg object-cover shadow-2xs"
                      />
                      <div className="min-w-0">
                        <p className="whitespace-nowrap font-semibold leading-5 text-slate-800">
                          {book.title}
                        </p>
                        <p className="whitespace-nowrap text-xs leading-5 text-slate-400">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'isbn',
                  header: 'SKU / ISBN',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  render: book => (
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {book.isbn || book.sku || 'N/A'}
                    </span>
                  ),
                },
                {
                  key: 'category',
                  header: 'Category',
                  cellClassName: 'whitespace-nowrap',
                  render: book => (
                    <span className="whitespace-nowrap text-xs text-slate-600">
                      {getCategoryLabel(book.category)}
                    </span>
                  ),
                },
                {
                  key: 'price',
                  header: 'Unit Price',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  sortValue: book => Number(book.price || 0),
                  render: book =>
                    book.price !== undefined ? money(book.price) : 'N/A',
                },
                {
                  key: 'stock',
                  header: 'Current Stock',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  sortValue: book => Number(book.stock || 0),
                  render: book => {
                    const currentStock = Number(book.stock || 0);
                    const status = getStatus(book);
                    const limit = Number(book.lowStockLimit || 0);
                    // bar is full at 2x the alert limit
                    const percent = Math.min(
                      100,
                      limit > 0
                        ? (currentStock / (limit * 2)) * 100
                        : currentStock > 0
                          ? 100
                          : 0,
                    );
                    return (
                      <div
                        className="mx-auto w-28 whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {canManage ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={currentStock <= 0}
                                onClick={() => quickAdjustStock(book, -1)}
                                aria-label={`Decrease stock for ${book.title}`}
                                title="Decrease stock by 1"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <FiMinus size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedBook(book)}
                                title="Click for custom stock adjustment"
                                className="min-w-[2ch] text-center font-semibold text-slate-800 hover:text-primary-hover"
                              >
                                {currentStock}
                              </button>
                              <button
                                type="button"
                                onClick={() => quickAdjustStock(book, 1)}
                                aria-label={`Increase stock for ${book.title}`}
                                title="Increase stock by 1"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>
                          ) : (
                            <p className="font-semibold text-slate-800">
                              {currentStock}
                            </p>
                          )}
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-1.5 rounded-full ${STATUS_STYLE[status].bar}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'lowStockLimit',
                  header: 'Alert Limit',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  sortValue: book => Number(book.lowStockLimit || 0),
                },
                {
                  key: 'status',
                  header: 'Status',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  sortValue: book => Number(book.stock || 0),
                  render: book => {
                    const style = STATUS_STYLE[getStatus(book)];
                    return (
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {style.label}
                      </span>
                    );
                  },
                },
                {
                  key: 'stockValue',
                  header: 'Stock Value',
                  align: 'center',
                  cellClassName: 'whitespace-nowrap',
                  sortValue: book =>
                    Number(book.price || 0) * Number(book.stock || 0),
                  render: book =>
                    money(Number(book.price || 0) * Number(book.stock || 0)),
                },
                {
                  key: 'updatedAt',
                  header: 'Last Updated',
                  cellClassName: 'whitespace-nowrap',
                  render: book => {
                    const time =
                      lastUpdatedByBook.get(book.id) ??
                      lastUpdatedByBook.get(book.title);
                    return (
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {time ? formatDate(time) : 'N/A'}
                      </span>
                    );
                  },
                },
              ]}
              rowActions={book => [
                ...(canManage
                  ? [
                      {
                        label: 'Adjust Stock',
                        onClick: () => setSelectedBook(book),
                      },
                    ]
                  : []),
                { label: 'View History', onClick: () => setHistoryBook(book) },
              ]}
              emptyMessage="No books match the current filters."
            />
          </div>
        </>
      )}

      {view === 'history' && (
        <>
          {/* Sales by channel */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={FiShoppingBag}
              label={`Counter Sale · ${salesSummary.counter.count} times`}
              value={`${salesSummary.counter.units} copies`}
              tone="text-violet-600"
              onClick={() => {
                setHistoryFilter('counter');
                setHistoryLimit(10);
              }}
            />
            <SummaryCard
              icon={FiMonitor}
              label={`Online Sale · ${salesSummary.online.count} times`}
              value={`${salesSummary.online.units} copies`}
              tone="text-sky-600"
              onClick={() => {
                setHistoryFilter('online');
                setHistoryLimit(10);
              }}
            />
          </div>

          {/* Stock movement history */}
          <div className="mt-6">
            <HistoryTable
              entries={filteredHistory}
              books={books}
              activeFilter={historyFilter}
              onFilterChange={setHistoryFilter}
              activeView={view}
              onViewChange={setView}
            />
          </div>
        </>
      )}

      {selectedBook && (
        <StockAdjustModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSubmit={adjustStock}
        />
      )}

      {historyBook && (
        <BookHistoryModal
          book={historyBook}
          entries={stockHistory.filter(entry =>
            entryMatchesBook(entry, historyBook),
          )}
          onClose={() => setHistoryBook(null)}
        />
      )}
    </>
  );
}

/* ---------- small components ---------- */

function SummaryCard({ icon: Icon, label, value, tone, onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-xs"
    >
      <span className={tone}>
        <Icon size={20} />
      </span>
      <span>
        <span className="block text-xs text-slate-400">{label}</span>
        <span className="block font-heading text-lg font-bold text-slate-900">
          {value}
        </span>
      </span>
    </Wrapper>
  );
}

function HistoryTable({
  entries,
  books,
  activeFilter,
  onFilterChange,
  activeView,
  onViewChange,
}) {
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'in', label: 'Stock In' },
    { id: 'out', label: 'Stock Out' },
    { id: 'counter', label: 'Counter Sale' },
    { id: 'online', label: 'Online Sale' },
  ];

  const columns = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      cellClassName: 'whitespace-nowrap',
      sortable: true,
      render: entry => (
        <span className="whitespace-nowrap text-slate-600">
          {formatDate(entryDate(entry))}
        </span>
      ),
    },
    {
      key: 'bookTitle',
      header: 'Book',
      cellClassName: 'whitespace-nowrap',
      sortable: true,
      render: entry => (
        <span className="whitespace-nowrap font-semibold text-slate-800">{entry.bookTitle}</span>
      ),
    },
    {
      key: 'channel',
      header: 'Type',
      cellClassName: 'whitespace-nowrap',
      render: entry => {
        const channel = getChannel(entry);
        const style = CHANNEL_STYLE[channel];
        return (
          <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.badge}`}>
            {style.label}
          </span>
        );
      },
    },
    {
      key: 'userName',
      header: 'Sold / Updated By',
      cellClassName: 'whitespace-nowrap',
      render: entry => {
        const person = entry.userName || entry.performedBy || 'N/A';
        return (
          <div className="whitespace-nowrap">
            <p className="font-medium text-slate-700">{person}</p>
            {entry.userRole && (
              <p className="text-[11px] text-slate-400">{entry.userRole}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Reference / Reason',
      cellClassName: 'whitespace-nowrap',
      render: entry => (
        <span className="whitespace-nowrap text-slate-600">{entry.reason}</span>
      ),
    },
    {
      key: 'delta',
      header: 'Qty',
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      sortable: true,
      render: entry => (
        <span className={`whitespace-nowrap font-bold ${entry.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {entry.delta > 0 ? '+' : ''}{entry.delta}
        </span>
      ),
    },
    {
      key: 'stockChange',
      header: 'Stock Change',
      width: '130px',
      align: 'center',
      render: entry => (
        <span className="whitespace-nowrap text-slate-600">
          {entry.previousStock !== undefined && entry.newStock !== undefined
            ? `${entry.previousStock} → ${entry.newStock}`
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      align: 'right',
      render: entry => {
        const channel = getChannel(entry);
        const book = books.find(item =>
          entry.bookId !== undefined
            ? item.id === entry.bookId
            : item.title === entry.bookTitle,
        );
        const unitPrice = entry.unitPrice ?? book?.price;
        const amount =
          entry.delta < 0 && channel !== 'manual' && unitPrice !== undefined
            ? Math.abs(entry.delta) * Number(unitPrice)
            : null;
        return (
          <span className="whitespace-nowrap font-semibold text-slate-800">
            {amount !== null ? money(amount) : 'N/A'}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-3 flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {[
          { id: 'inventory', label: 'Stock Inventory' },
          { id: 'history', label: 'History' },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={`rounded-lg px-4 py-2 ${
              activeView === item.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <DataTable
        title="Stock Movement History"
        subtitle="Review stock adjustments, sales and updates"
        tabs={filterOptions}
        activeTab={activeFilter}
        onTabChange={onFilterChange}
        data={entries}
        searchKeys={['bookTitle', 'reason', 'userName', 'performedBy']}
        searchPlaceholder="Search movement..."
        selectable={false}
        pageSize={10}
        columns={columns}
        emptyMessage="No stock movements found for this filter."
      />
    </div>
  );
}

function HistoryList({ entries }) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-xs text-slate-400">
        No stock adjustments recorded yet.
      </p>
    );
  }
  return (
    <div className="mt-4 divide-y divide-slate-100">
      {entries.map(entry => {
        const channel = CHANNEL_STYLE[getChannel(entry)];
        return (
          <div
            key={entry.id}
            className="flex flex-wrap justify-between gap-2 py-3 text-xs md:text-sm"
          >
            <div>
              <p className="flex flex-wrap items-center gap-2 text-slate-700">
                <span>
                  {entry.bookTitle} — {entry.reason}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${channel.badge}`}
                >
                  {channel.label}
                </span>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <FiClock size={11} />
                {formatDate(entryDate(entry))}
                {(entry.userName || entry.performedBy) &&
                  ` · by ${entry.userName || entry.performedBy}`}
                {entry.previousStock !== undefined &&
                  entry.newStock !== undefined &&
                  ` · ${entry.previousStock} → ${entry.newStock}`}
              </p>
            </div>
            <strong
              className={
                entry.delta > 0
                  ? 'font-semibold text-emerald-600'
                  : 'font-semibold text-rose-600'
              }
            >
              {entry.delta > 0 ? '+' : ''}
              {entry.delta}
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function BookHistoryModal({ book, entries, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Stock history</p>
            <h2 className="mt-0.5 font-heading text-xl font-bold text-slate-900">
              {book.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
        <HistoryList entries={entries} />
      </div>
    </div>
  );
}

const MODES = [
  { id: 'add', label: 'Add stock', icon: FiPlus },
  { id: 'remove', label: 'Remove stock', icon: FiMinus },
  { id: 'set', label: 'Set exact count', icon: FiBox },
];

function StockAdjustModal({ book, onClose, onSubmit }) {
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const current = Number(book.stock || 0);
  const quantity = Number(amount);
  const validQuantity =
    Number.isInteger(quantity) && quantity >= (mode === 'set' ? 0 : 1);

  let delta = 0;
  if (validQuantity) {
    if (mode === 'add') delta = quantity;
    if (mode === 'remove') delta = -quantity;
    if (mode === 'set') delta = quantity - current;
  }
  const newStock = current + delta;

  const changeMode = next => {
    setMode(next);
    setError('');
    setReason('');
    setAmount(next === 'set' ? String(current) : '1');
  };

  const submit = () => {
    if (!validQuantity) {
      setError(
        'Enter a whole number' +
          (mode === 'set' ? ' (0 or more).' : ' greater than 0.'),
      );
      return;
    }
    if (newStock < 0) {
      setError(`You can't remove more than the ${current} copies in stock.`);
      return;
    }
    if (delta === 0) {
      setError('The new stock is the same as the current stock.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    onSubmit(delta, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Adjust Stock Quantity
            </p>
            <h2 className="mt-0.5 font-heading text-xl font-bold text-slate-900">
              {book.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
          <div>
            <p>Current</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">
              {current}
            </p>
          </div>
          <div>
            <p>Alert limit</p>
            <p className="mt-0.5 text-base font-bold text-slate-900">
              {book.lowStockLimit ?? 'N/A'}
            </p>
          </div>
          <div>
            <p>After update</p>
            <p
              className={`mt-0.5 text-base font-bold ${
                newStock < 0
                  ? 'text-rose-600'
                  : delta === 0
                    ? 'text-slate-900'
                    : 'text-blue-600'
              }`}
            >
              {validQuantity ? newStock : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {MODES.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeMode(item.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 ${
                mode === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <item.icon size={12} /> {item.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-semibold text-slate-700">
          {mode === 'set' ? 'New stock count' : 'Quantity'}
          <input
            type="number"
            min={mode === 'set' ? '0' : '1'}
            value={amount}
            onChange={event => {
              setAmount(event.target.value);
              setError('');
            }}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#E5A316]"
          />
        </label>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700"> Note </p>
          {/* <div className="mt-1.5 flex flex-wrap gap-1.5">
            {REASON_PRESETS[mode].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setReason(preset);
                  setError('');
                }}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  reason === preset
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div> */}
          <textarea
            value={reason}
            onChange={event => {
              setReason(event.target.value);
              setError('');
            }}
            rows="2"
            aria-label="Reason"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#E5A316]"
            placeholder="Pick a reason above or write your own..."
          />
        </div>

        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-dark shadow-xs hover:bg-primary-hover"
          >
            Save stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockManagement;
