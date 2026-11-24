import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiPrinter,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useAuth } from '../../../context/useAuth';
import authorsSeed from '../../../data/authors';
import { getStoredBooks } from '../../../utils/authorStorage';
import {
  COST_TYPES,
  EXPENSE_TYPES,
  MARKETING_CHANNELS,
  PAYMENT_METHODS,
  addAuthorCommission,
  addBookCost,
  addEmployeeExpense,
  addMarketingCost,
  deleteAuthorCommission,
  deleteBookCost,
  deleteEmployeeExpense,
  deleteMarketingCost,
  exportMonthlyReportCsv,
  getAuthorCommissions,
  getBookCosts,
  getEmployeeExpenses,
  getMarketingCosts,
  getMonthlyCostSummary,
  getPreviousMonthStr,
  updateAuthorCommission,
  updateBookCost,
  updateEmployeeExpense,
  updateMarketingCost,
} from '../../../utils/costStorage';
import { formatCurrency } from '../../../utils/format';

export default function TotalCost() {
  const { users } = useAuth();

  // Current month default in YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  // Active tab: 'book' | 'author' | 'employee' | 'marketing'
  const [activeTab, setActiveTab] = useState('book');

  // Book tab: expanded books & search
  const [expandedBooks, setExpandedBooks] = useState({});
  const [bookSearch, setBookSearch] = useState('');
  const toggleBook = key =>
    setExpandedBooks(prev => ({ ...prev, [key]: !prev[key] }));

  // Trigger to re-fetch when changes occur
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Books, Authors, Employees options
  const allBooks = useMemo(() => getStoredBooks(), []);
  const allAuthors = useMemo(() => authorsSeed, []);
  const allEmployees = useMemo(
    () =>
      (users || []).filter(u => u.role === 'employee' || u.role === 'admin'),
    [users],
  );

  // Monthly Data fetching based on selectedMonth
  const bookCosts = useMemo(
    () => getBookCosts(selectedMonth),
    [selectedMonth, refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const authorCommissions = useMemo(
    () => getAuthorCommissions(selectedMonth),
    [selectedMonth, refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const employeeExpenses = useMemo(
    () => getEmployeeExpenses(selectedMonth),
    [selectedMonth, refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const marketingCosts = useMemo(
    () => getMarketingCosts(selectedMonth),
    [selectedMonth, refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Summary Metrics & Comparison
  const summary = useMemo(
    () => getMonthlyCostSummary(selectedMonth),
    [selectedMonth, refreshKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Modal states
  const [formModal, setFormModal] = useState(null); // { type: 'book' | 'author' | 'employee' | 'marketing', item: null | object }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: string, item: object }

  // Quick month navigation
  const handlePrevMonth = () => {
    setSelectedMonth(prev => getPreviousMonthStr(prev));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  // Month label in Bengali & English
  const monthDisplayLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    const bengaliMonth = d.toLocaleDateString('bn-BD', {
      month: 'long',
      year: 'numeric',
    });
    const englishMonth = d.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    return `${bengaliMonth} (${englishMonth})`;
  }, [selectedMonth]);

  // Group all costs by book: one entry per book with its total & breakdown.
  // Adding a cost for a book that already exists lands in the same group.
  const bookGroups = useMemo(() => {
    const map = new Map();
    bookCosts.forEach(item => {
      const key = String(item.bookId || item.bookName);
      if (!map.has(key)) {
        map.set(key, {
          key,
          bookId: item.bookId,
          bookName: item.bookName,
          total: 0,
          byType: {},
          entries: [],
        });
      }
      const group = map.get(key);
      const amt = Number(item.amount || 0);
      group.total += amt;
      group.byType[item.costType] = (group.byType[item.costType] || 0) + amt;
      group.entries.push(item);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [bookCosts]);

  const filteredBookGroups = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    if (!q) return bookGroups;
    return bookGroups.filter(g => g.bookName?.toLowerCase().includes(q));
  }, [bookGroups, bookSearch]);

  // Per-author total calculations for Author tab
  const perAuthorTotals = useMemo(() => {
    const map = {};
    authorCommissions.forEach(item => {
      map[item.authorName] =
        (map[item.authorName] || 0) + Number(item.amount || 0);
    });
    return Object.entries(map);
  }, [authorCommissions]);

  // Deletion execution
  const executeDelete = () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;
    if (type === 'book') deleteBookCost(item.id);
    else if (type === 'author') deleteAuthorCommission(item.id);
    else if (type === 'employee') deleteEmployeeExpense(item.id);
    else if (type === 'marketing') deleteMarketingCost(item.id);

    setDeleteConfirm(null);
    triggerRefresh();
    toast.success('রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।');
  };

  // Tabs definition
  const tabs = [
    {
      id: 'book',
      label: 'বই প্রকাশনা খরচ',
      icon: FiBookOpen,
      count: bookGroups.length,
    },
    {
      id: 'author',
      label: 'লেখক কমিশন',
      icon: FiUsers,
      count: authorCommissions.length,
    },
    {
      id: 'employee',
      label: 'কর্মচারী ব্যয়',
      icon: FiBriefcase,
      count: employeeExpenses.length,
    },
    {
      id: 'marketing',
      label: 'মার্কেটিং ব্যয়',
      icon: FiTrendingUp,
      count: marketingCosts.length,
    },
  ];

  // Shared "Add" button for the table headers
  const addButton = (type, label) => (
    <button
      type="button"
      onClick={() => setFormModal({ type, item: null })}
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-dark shadow-2xs transition hover:bg-primary-hover"
    >
      <FiPlus size={14} />
      <span>{label}</span>
    </button>
  );

  // Shared Edit / Delete column
  const actionsColumn = type => ({
    key: 'actions',
    header: 'অ্যাকশন (Actions)',
    align: 'right',
    render: item => (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setFormModal({ type, item })}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="সম্পাদনা করুন"
        >
          <FiEdit2 size={13} />
        </button>
        <button
          type="button"
          onClick={() => setDeleteConfirm({ type, item })}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          title="মুছে ফেলুন"
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    ),
  });

  // Inactive tabs are hidden on screen but still shown when printing,
  // so Print / PDF keeps the full report.
  const panelClass = id =>
    `space-y-3 ${activeTab === id ? '' : 'hidden print:block'}`;

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <PageHeader
            title="টোটাল কস্ট (Total Business Costs)"
            description="ব্যবসায়ের সকল প্রকাশনা, রয়্যালটি কমিশন, কর্মচারী বেতন ও মার্কেটিং খরচের সমন্বিত হিসাব ও ব্যবস্থাপনা।"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportMonthlyReportCsv(selectedMonth)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            title="এক্সেল CSV ডাউনলোড"
          >
            <FiDownload size={14} />
            <span>Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            title="রিপোর্ট প্রিন্ট বা PDF সংরক্ষণ"
          >
            <FiPrinter size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* A. Month Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FiCalendar size={16} />
          </span>
          <div>
            <span className="text-xs font-medium text-slate-400 block">
              হিসাবের মাস নির্বাচন করুন
            </span>
            <strong className="font-heading text-base font-bold text-slate-800">
              {monthDisplayLabel}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FiChevronLeft size={14} />
            <span>পূর্ববর্তী মাস</span>
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={e => e.target.value && setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500"
          />

          <button
            type="button"
            onClick={handleNextMonth}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span>পরবর্তী মাস</span>
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* B. Summary Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Book Production */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiBookOpen size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">
            মোট বই প্রকাশনা খরচ
          </p>
          <p className="mt-0.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.bookCostTotal)}
          </p>
          <span className="mt-2 block text-[11px] text-slate-400">
            {summary.bookCount}টি ভাউচার এন্ট্রি
          </span>
        </div>

        {/* Card 2: Author Commission */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FiUsers size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">
            মোট লেখক কমিশন
          </p>
          <p className="mt-0.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.authorCommissionTotal)}
          </p>
          <span className="mt-2 block text-[11px] text-slate-400">
            {summary.commissionCount}টি রয়্যালটি পরিশোধ
          </span>
        </div>

        {/* Card 3: Employee Expense */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FiBriefcase size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">
            মোট কর্মচারী খরচ
          </p>
          <p className="mt-0.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.employeeExpenseTotal)}
          </p>
          <span className="mt-2 block text-[11px] text-slate-400">
            {summary.employeeCount}টি বেতন ও খরচ
          </span>
        </div>

        {/* Card 4: Marketing Cost */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FiTrendingUp size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-500">
            মোট মার্কেটিং খরচ
          </p>
          <p className="mt-0.5 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.marketingCostTotal)}
          </p>
          <span className="mt-2 block text-[11px] text-slate-400">
            {summary.marketingCount}টি প্রচার খাত
          </span>
        </div>

        {/* Card 5: Grand Total (High Emphasis) */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900 p-5 text-white shadow-xs">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-slate-900">
            <FiDollarSign size={18} />
          </span>
          <p className="mt-3 text-xs font-medium text-slate-300">
            সর্বমোট খরচ (Grand Total)
          </p>
          <p className="mt-0.5 font-heading text-xl font-bold text-primary">
            {formatCurrency(summary.grandTotal)}
          </p>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
            <span className="text-slate-400">পূর্ববর্তী মাসের তুলনায়:</span>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                summary.percentageChange > 0
                  ? 'text-amber-400'
                  : summary.percentageChange < 0
                    ? 'text-emerald-400'
                    : 'text-slate-400'
              }`}
            >
              {summary.percentageChange > 0 ? (
                <FiTrendingUp size={12} />
              ) : (
                <FiTrendingDown size={12} />
              )}
              {summary.percentageChange > 0 ? '+' : ''}
              {summary.percentageChange}%
            </span>
          </div>
        </div>
      </div>

      {/* C. Tabs */}
      <div
        role="tablist"
        aria-label="খরচের ক্যাটেগরি"
        className="-mb-2 flex gap-1 overflow-x-auto border-b border-slate-200 print:hidden"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`cost-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`cost-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-primary text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  isActive
                    ? 'bg-primary/30 text-slate-900'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================== Tab 1: Book Cost (per-book) ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-book"
        aria-labelledby="cost-tab-book"
        className={panelClass('book')}
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
                বই প্রকাশনা খরচ (Book Production Costs)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                প্রতিটি বইয়ের প্রিন্টিং, পেপার, প্রচ্ছদ, এডিটিং ও বাইন্ডিং খরচ
                বইভিত্তিক দেখুন
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <input
                type="search"
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                placeholder="বইয়ের নাম খুঁজুন..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 sm:w-52"
              />
              {addButton('book', 'বইয়ের খরচ যোগ করুন')}
            </div>
          </div>

          {/* Book list */}
          {filteredBookGroups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              {bookGroups.length === 0
                ? 'এই মাসে বই প্রকাশনার কোনো খরচ লিপিবদ্ধ নেই।'
                : 'এই নামে কোনো বই পাওয়া যায়নি।'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredBookGroups.map(group => {
                const isOpen = Boolean(expandedBooks[group.key]);
                const presetBookId =
                  group.bookId ||
                  allBooks.find(b => b.title === group.bookName)?.id;

                return (
                  <li key={group.key}>
                    {/* Book summary row */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                      <button
                        type="button"
                        onClick={() => toggleBook(group.key)}
                        aria-expanded={isOpen}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <FiChevronDown
                          size={16}
                          className={`shrink-0 text-slate-400 transition-transform print:hidden ${
                            isOpen ? '' : '-rotate-90'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {group.bookName}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            {group.entries.length}টি খরচ এন্ট্রি
                          </span>
                        </span>
                      </button>

                      {/* Cost type breakdown */}
                      <div className="hidden flex-wrap gap-1.5 lg:flex">
                        {Object.entries(group.byType).map(([type, amt]) => (
                          <span
                            key={type}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {type}: {formatCurrency(amt)}
                          </span>
                        ))}
                      </div>

                      <div className="text-right">
                        <span className="block text-[11px] text-slate-400">
                          মোট খরচ
                        </span>
                        <strong className="text-sm font-bold text-slate-900">
                          {formatCurrency(group.total)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFormModal({
                            type: 'book',
                            item: null,
                            presetBookId,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 print:hidden"
                        title="এই বইয়ে খরচ যোগ করুন"
                      >
                        <FiPlus size={13} />
                        <span>খরচ</span>
                      </button>
                    </div>

                    {/* Entries of this book */}
                    <div
                      className={`overflow-x-auto bg-slate-50/60 px-4 pb-4 sm:px-5 ${
                        isOpen ? '' : 'hidden print:block'
                      }`}
                    >
                      <table className="w-full min-w-[520px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-3 font-medium">খরচের ধরন</th>
                            <th className="py-2 pr-3 text-right font-medium">
                              পরিমাণ
                            </th>
                            <th className="py-2 pr-3 font-medium">তারিখ</th>
                            <th className="py-2 pr-3 font-medium">নোট</th>
                            <th className="py-2 text-right font-medium print:hidden">
                              অ্যাকশন
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map(item => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="py-2 pr-3 font-medium text-slate-700">
                                {item.costType}
                              </td>
                              <td className="py-2 pr-3 text-right font-bold text-slate-900">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="py-2 pr-3 text-slate-600">
                                {item.date}
                              </td>
                              <td className="py-2 pr-3 text-slate-500">
                                {item.note || '—'}
                              </td>
                              <td className="py-2 text-right print:hidden">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormModal({ type: 'book', item })
                                    }
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    title="সম্পাদনা করুন"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirm({ type: 'book', item })
                                    }
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    title="মুছে ফেলুন"
                                  >
                                    <FiTrash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer total */}
          {bookGroups.length > 0 && (
            <div className="flex items-center justify-between rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-700 sm:px-5">
              <span>
                এই মাসে {bookGroups.length}টি বইয়ের মোট প্রকাশনা খরচ:
              </span>
              <strong className="text-sm font-bold text-slate-900">
                {formatCurrency(summary.bookCostTotal)}
              </strong>
            </div>
          )}
        </div>
      </section>

      {/* ==================== Tab 2: Author Commission ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-author"
        aria-labelledby="cost-tab-author"
        className={panelClass('author')}
      >
        <DataTable
          title="লেখক কমিশন (Author Commission)"
          subtitle="বই বিক্রয় বাবদ লেখকদের পরিশোধিত রয়্যালটি কমিশন হিসেব"
          data={authorCommissions}
          searchKeys={['authorName', 'bookName', 'method', 'note']}
          searchPlaceholder="লেখক, বই বা মেথড খুঁজুন..."
          pageSize={6}
          headerActions={addButton('author', 'লেখক কমিশন যোগ করুন')}
          columns={[
            {
              key: 'authorName',
              header: 'লেখক (Author)',
              sortable: true,
              render: item => (
                <span className="font-semibold text-slate-800">
                  {item.authorName}
                </span>
              ),
            },
            {
              key: 'bookName',
              header: 'বই (Book)',
              sortable: true,
              render: item => (
                <span className="text-slate-700">{item.bookName || '—'}</span>
              ),
            },
            {
              key: 'amount',
              header: 'কমিশন পরিমাণ (Amount)',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'পরিশোধের তারিখ (Date)',
              sortable: true,
              render: item => (
                <span className="text-slate-600">{item.date}</span>
              ),
            },
            {
              key: 'method',
              header: 'পেমেন্ট মাধ্যম (Method)',
              align: 'center',
              render: item => (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {item.method}
                </span>
              ),
            },
            actionsColumn('author'),
          ]}
          emptyMessage="এই মাসে লেখকদের কোনো কমিশন পরিশোধের রেকর্ড নেই।"
        />

        {/* Per-author total summary bar */}
        {perAuthorTotals.length > 0 && (
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              ✍️ লেখকভিত্তিক মোট কমিশন (Per-author total for this month):
            </span>
            <div className="flex flex-wrap gap-2">
              {perAuthorTotals.map(([authorName, total]) => (
                <span
                  key={authorName}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs"
                >
                  <span className="font-medium">{authorName}:</span>
                  <strong className="text-emerald-700 font-bold">
                    {formatCurrency(total)}
                  </strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ==================== Tab 3: Employee Expense ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-employee"
        aria-labelledby="cost-tab-employee"
        className={panelClass('employee')}
      >
        <DataTable
          title="কর্মচারী ও অফিস ব্যয় (Employee Expense)"
          subtitle="কর্মচারীদের মাসিক বেতন, বোনাস, ইনসেন্টিভ ও যাতায়াত খরচ"
          data={employeeExpenses}
          searchKeys={['employeeName', 'expenseType', 'note']}
          searchPlaceholder="কর্মচারী বা খরচের ধরন খুঁজুন..."
          pageSize={6}
          headerActions={addButton('employee', 'কর্মচারী খরচ যোগ করুন')}
          columns={[
            {
              key: 'employeeName',
              header: 'কর্মচারী (Employee)',
              sortable: true,
              render: item => (
                <span className="font-semibold text-slate-800">
                  {item.employeeName}
                </span>
              ),
            },
            {
              key: 'expenseType',
              header: 'খরচের ধরন (Expense Type)',
              align: 'center',
              sortable: true,
              render: item => (
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  {item.expenseType}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'পরিমাণ (Amount)',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'তারিখ (Date)',
              sortable: true,
              render: item => (
                <span className="text-slate-600">{item.date}</span>
              ),
            },
            {
              key: 'note',
              header: 'নোট (Note)',
              render: item => (
                <span className="text-xs text-slate-500 line-clamp-1">
                  {item.note || '—'}
                </span>
              ),
            },
            actionsColumn('employee'),
          ]}
          emptyMessage="এই মাসে কর্মচারীদের কোনো খরচের হিসাব লিপিবদ্ধ নেই।"
        />

        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-700 flex items-center justify-between">
          <span>চলতি মাসে মোট কর্মচারী ও অফিস ব্যয়:</span>
          <strong className="text-slate-900 font-bold text-sm">
            {formatCurrency(summary.employeeExpenseTotal)}
          </strong>
        </div>
      </section>

      {/* ==================== Tab 4: Marketing Cost ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-marketing"
        aria-labelledby="cost-tab-marketing"
        className={panelClass('marketing')}
      >
        <DataTable
          title="মার্কেটিং ও প্রচার ব্যয় (Marketing Cost)"
          subtitle="ডিজিটাল বিজ্ঞাপন, ইনফ্লুয়েন্সার রিভিউ ও অফলাইন পাবলিসিটি খরচ"
          data={marketingCosts}
          searchKeys={['channel', 'bookName', 'note']}
          searchPlaceholder="ক্যাম্পেইন চ্যানেল বা বই খুঁজুন..."
          pageSize={6}
          headerActions={addButton('marketing', 'মার্কেটিং খরচ যোগ করুন')}
          columns={[
            {
              key: 'channel',
              header: 'ক্যাম্পেইন চ্যানেল (Channel)',
              sortable: true,
              render: item => (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {item.channel}
                </span>
              ),
            },
            {
              key: 'bookName',
              header: 'সংশ্লিষ্ট বই (Related Book)',
              sortable: true,
              render: item => (
                <span className="text-slate-700">
                  {item.bookName || 'সাধারণ ব্র্যান্ডিং'}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'পরিমাণ (Amount)',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'তারিখ (Date)',
              sortable: true,
              render: item => (
                <span className="text-slate-600">{item.date}</span>
              ),
            },
            {
              key: 'note',
              header: 'নোট (Note)',
              render: item => (
                <span className="text-xs text-slate-500 line-clamp-1">
                  {item.note || '—'}
                </span>
              ),
            },
            actionsColumn('marketing'),
          ]}
          emptyMessage="এই মাসে কোনো মার্কেটিং ব্যয়ের রেকর্ড নেই।"
        />

        <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-700 flex items-center justify-between">
          <span>চলতি মাসে মোট প্রচার ও মার্কেটিং ব্যয়:</span>
          <strong className="text-slate-900 font-bold text-sm">
            {formatCurrency(summary.marketingCostTotal)}
          </strong>
        </div>
      </section>

      {/* Modal: Add / Edit for All 4 Tabs */}
      {formModal && (
        <CostFormModal
          type={formModal.type}
          initialItem={formModal.item}
          presetBookId={formModal.presetBookId}
          selectedMonth={selectedMonth}
          books={allBooks}
          authors={allAuthors}
          employees={allEmployees}
          onClose={() => setFormModal(null)}
          onSaved={() => {
            setFormModal(null);
            triggerRefresh();
          }}
        />
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirm)}
        title="খরচের রেকর্ড মুছে ফেলতে চান?"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm?.item?.bookName || deleteConfirm?.item?.authorName || deleteConfirm?.item?.employeeName || deleteConfirm?.item?.channel}" এর রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে সর্বমোট হিসাব থেকে বাদ যাবে।`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ---------------- Multi-purpose Add/Edit Cost Form Modal ----------------
function CostFormModal({
  type,
  initialItem,
  presetBookId,
  selectedMonth,
  books,
  authors,
  employees,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(initialItem);

  // Form Fields State
  const defaultDate = initialItem?.date || `${selectedMonth}-15`;

  const [bookId, setBookId] = useState(
    initialItem?.bookId
      ? String(initialItem.bookId)
      : presetBookId
        ? String(presetBookId)
        : books[0]?.id
          ? String(books[0].id)
          : '',
  );
  const [authorId, setAuthorId] = useState(
    initialItem?.authorId || (authors[0]?.id ? String(authors[0].id) : ''),
  );
  const [employeeId, setEmployeeId] = useState(
    initialItem?.employeeId || employees[0]?.id || 'custom',
  );
  const [employeeName, setEmployeeName] = useState(
    initialItem?.employeeName || employees[0]?.name || '',
  );
  const [costType, setCostType] = useState(
    initialItem?.costType || COST_TYPES[0],
  );
  const [expenseType, setExpenseType] = useState(
    initialItem?.expenseType || EXPENSE_TYPES[0],
  );
  const [channel, setChannel] = useState(
    initialItem?.channel || MARKETING_CHANNELS[0],
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialItem?.method || PAYMENT_METHODS[0],
  );
  const [amount, setAmount] = useState(initialItem?.amount || '');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState(initialItem?.note || '');

  // Modal Titles
  const modalTitles = {
    book: isEditing
      ? 'বইয়ের প্রকাশনা খরচ সম্পাদনা'
      : 'নতুন বইয়ের খরচ যোগ করুন',
    author: isEditing ? 'লেখক কমিশন তথ্য সম্পাদনা' : 'নতুন লেখক কমিশন এন্ট্রি',
    employee: isEditing ? 'কর্মচারী খরচ সম্পাদনা' : 'নতুন কর্মচারী খরচ এন্ট্রি',
    marketing: isEditing
      ? 'মার্কেটিং খরচ সম্পাদনা'
      : 'নতুন মার্কেটিং খরচ এন্ট্রি',
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Validations
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('সঠিক টাকার পরিমাণ দিন (অবশ্যই ০-এর বেশি হতে হবে)।');
      return;
    }
    if (!date) {
      toast.error('অনুগ্রহ করে সঠিক তারিখ নির্বাচন করুন।');
      return;
    }

    if (type === 'book') {
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        bookId,
        bookName: selectedBook?.title || 'বই',
        costType,
        amount: numAmount,
        date,
        note,
      };
      if (isEditing) updateBookCost(initialItem.id, payload);
      else addBookCost(payload);
    } else if (type === 'author') {
      const selectedAuthor = authors.find(
        a => String(a.id) === String(authorId),
      );
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        authorId,
        authorName: selectedAuthor?.name || 'লেখক',
        bookId: bookId || '',
        bookName: selectedBook?.title || '',
        amount: numAmount,
        date,
        method: paymentMethod,
        note,
      };
      if (isEditing) updateAuthorCommission(initialItem.id, payload);
      else addAuthorCommission(payload);
    } else if (type === 'employee') {
      const selectedEmp = employees.find(emp => emp.id === employeeId);
      const finalName =
        employeeId === 'custom'
          ? employeeName.trim() || 'কর্মচারী'
          : selectedEmp?.name || employeeName;

      const payload = {
        employeeId,
        employeeName: finalName,
        expenseType,
        amount: numAmount,
        date,
        note,
      };
      if (isEditing) updateEmployeeExpense(initialItem.id, payload);
      else addEmployeeExpense(payload);
    } else if (type === 'marketing') {
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        channel,
        bookId: bookId || '',
        bookName: selectedBook?.title || 'সার্বিক প্রচার',
        amount: numAmount,
        date,
        note,
      };
      if (isEditing) updateMarketingCost(initialItem.id, payload);
      else addMarketingCost(payload);
    }

    toast.success(
      isEditing
        ? 'তথ্য সফলভাবে আপডেট করা হয়েছে।'
        : 'নতুন খরচের রেকর্ড সফলভাবে যুক্ত হয়েছে।',
    );
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-dark/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">
              {modalTitles[type]}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEditing
                ? 'বিদ্যমান তথ্য পরিবর্তন করুন'
                : 'সঠিক তথ্য দিয়ে ফর্মটি পূরণ করুন'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Book Cost Inputs */}
          {type === 'book' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  বই নির্বাচন করুন *
                </label>
                <p className="mb-1.5 text-[11px] text-slate-400">
                  একই বই নির্বাচন করলে খরচটি ওই বইয়ের তালিকাতেই যোগ হবে।
                </p>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  required
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  খরচের ধরন (Cost Type) *
                </label>
                <select
                  value={costType}
                  onChange={e => setCostType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {COST_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Author Commission Inputs */}
          {type === 'author' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  লেখক নির্বাচন করুন *
                </label>
                <select
                  value={authorId}
                  onChange={e => setAuthorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  required
                >
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংশ্লিষ্ট বই (ঐচ্ছিক)
                </label>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">— কোনো নির্দিষ্ট বই নয় —</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পেমেন্ট মাধ্যম (Payment Method) *
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Employee Expense Inputs */}
          {type === 'employee' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  কর্মচারী নির্বাচন বা নাম *
                </label>
                <select
                  value={employeeId}
                  onChange={e => {
                    setEmployeeId(e.target.value);
                    const emp = employees.find(em => em.id === e.target.value);
                    if (emp) setEmployeeName(emp.name);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                  <option value="custom">+ অন্য কর্মচারী / কাস্টম নাম</option>
                </select>

                {employeeId === 'custom' && (
                  <input
                    type="text"
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    placeholder="কর্মচারীর নাম ও পদবি লিখুন..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  খরচের ধরন (Expense Type) *
                </label>
                <select
                  value={expenseType}
                  onChange={e => setExpenseType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {EXPENSE_TYPES.map(et => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Marketing Cost Inputs */}
          {type === 'marketing' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মার্কেটিং চ্যানেল (Channel) *
                </label>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  {MARKETING_CHANNELS.map(ch => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংশ্লিষ্ট বই (Related Book - ঐচ্ছিক)
                </label>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">— সার্বিক পাবলিকেশন প্রচার —</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Common Amount Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              টাকার পরিমাণ (Amount in ৳) *
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="যেমন: ১৫০০০"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Common Date Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              তারিখ (Date) *
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Common Note Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              নোট / বিবরণ (Note)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows="2"
              placeholder="খরচের অতিরিক্ত তথ্য বা ভাউচার নম্বর..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="mt-5 flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-dark hover:bg-primary-hover shadow-xs"
            >
              {isEditing ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
