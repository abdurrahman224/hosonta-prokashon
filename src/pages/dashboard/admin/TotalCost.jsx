import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiPrinter,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
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
import {
  getExpenseProfiles,
  removeSyncedCostFromProfile,
  resolveProfileIdFromCategory,
  syncCostToExpenseProfile,
} from '../../../utils/costProfilesStorage';
import { formatCurrency } from '../../../utils/format';

export default function TotalCost() {
  const { currentUser, users } = useAuth();

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

  // Month label
  const monthDisplayLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
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

    removeSyncedCostFromProfile(item.id);
    setDeleteConfirm(null);
    triggerRefresh();
    toast.success('Record deleted.');
  };

  // Tabs definition
  const tabs = [
    {
      id: 'book',
      label: 'Book Production',
      icon: FiBookOpen,
      count: bookGroups.length,
    },
    {
      id: 'author',
      label: 'Author Royalty',
      icon: FiUsers,
      count: authorCommissions.length,
    },
    {
      id: 'employee',
      label: 'Staff & Office',
      icon: FiBriefcase,
      count: employeeExpenses.length,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: FiTrendingUp,
      count: marketingCosts.length,
    },
  ];

  // Shared "Add" button for the table headers
  const addButton = (type, label) => (
    <button
      type="button"
      onClick={() => setFormModal({ type, item: null })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
    >
      <FiPlus size={14} />
      <span>{label}</span>
    </button>
  );

  // Shared Edit / Delete column
  const actionsColumn = type => ({
    key: 'actions',
    header: 'Actions',
    align: 'right',
    render: item => (
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setFormModal({ type, item })}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          title="Edit"
          aria-label="Edit entry"
        >
          <FiEdit2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => setDeleteConfirm({ type, item })}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          title="Delete"
          aria-label="Delete entry"
        >
          <FiTrash2 size={14} />
        </button>
      </div>
    ),
  });

  // Inactive tabs are hidden on screen but still shown when printing,
  // so Print / PDF keeps the full report.
  const panelClass = id =>
    `space-y-3 ${activeTab === id ? '' : 'hidden print:block'}`;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <PageHeader
          title="Total Cost"
          description="Monthly expenses for book production, royalties, staff, and marketing."
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportMonthlyReportCsv(selectedMonth)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiDownload size={14} />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiPrinter size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between print:border-none print:p-0">
        <div className="flex items-center gap-2.5 text-sm text-slate-700">
          <FiCalendar size={16} className="text-slate-400" />
          <span className="font-semibold text-slate-900">
            {monthDisplayLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <FiChevronLeft size={14} />
            <span>Prev</span>
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={e => e.target.value && setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-500"
          />

          <button
            type="button"
            onClick={handleNextMonth}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <span>Next</span>
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Summary Cards Grid (Clean white, no clutter) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Book Production</p>
          <p className="mt-1 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.bookCostTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.bookCount} entries
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Author Royalty</p>
          <p className="mt-1 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.authorCommissionTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.commissionCount} entries
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Staff &amp; Office</p>
          <p className="mt-1 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.employeeExpenseTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.employeeCount} entries
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Marketing</p>
          <p className="mt-1 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.marketingCostTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.marketingCount} entries
          </p>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4">
          <p className="text-xs font-semibold text-slate-700">Grand Total</p>
          <p className="mt-1 font-heading text-xl font-bold text-slate-900">
            {formatCurrency(summary.grandTotal)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
            {summary.percentageChange > 0 ? (
              <FiTrendingUp size={12} />
            ) : (
              <FiTrendingDown size={12} />
            )}
            <span>
              {summary.percentageChange > 0 ? '+' : ''}
              {summary.percentageChange}% vs prev month
            </span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Cost Categories"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 print:hidden"
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
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>
                {tab.label} ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================== Tab 1: Book Production ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-book"
        aria-labelledby="cost-tab-book"
        className={panelClass('book')}
      >
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-base font-bold text-slate-900">
              Book Production Costs
            </h2>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <input
                type="search"
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                placeholder="Search book..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 sm:w-52"
              />
              {addButton('book', 'Add Cost')}
            </div>
          </div>

          {filteredBookGroups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              {bookGroups.length === 0
                ? 'No book production costs recorded for this month.'
                : 'No matching books found.'}
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
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleBook(group.key)}
                        aria-expanded={isOpen}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <FiChevronDown
                          size={15}
                          className={`shrink-0 text-slate-400 transition-transform print:hidden ${
                            isOpen ? '' : '-rotate-90'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {group.bookName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {group.entries.length} entries
                          </span>
                        </span>
                      </button>

                      <div className="text-right">
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
                        title="Add cost to this book"
                      >
                        <FiPlus size={13} />
                        <span>Add</span>
                      </button>
                    </div>

                    <div
                      className={`overflow-x-auto bg-slate-50/50 px-4 pb-3 ${
                        isOpen ? '' : 'hidden print:block'
                      }`}
                    >
                      <table className="w-full min-w-[540px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="whitespace-nowrap py-2 pr-3 font-medium">
                              Category
                            </th>
                            <th className="whitespace-nowrap py-2 pr-3 text-right font-medium">
                              Paid
                            </th>
                            <th className="whitespace-nowrap py-2 pr-3 text-right font-medium">
                              Due
                            </th>
                            <th className="whitespace-nowrap py-2 pr-3 font-medium">
                              Date
                            </th>
                            <th className="whitespace-nowrap py-2 pr-3 font-medium">
                              Note
                            </th>
                            <th className="whitespace-nowrap py-2 text-right font-medium print:hidden">
                              Actions
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
                              <td className="whitespace-nowrap py-2 pr-3 text-right font-semibold text-slate-900">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="whitespace-nowrap py-2 pr-3 text-right text-slate-600">
                                {Number(item.dueAmount) > 0
                                  ? formatCurrency(item.dueAmount)
                                  : '—'}
                              </td>
                              <td className="whitespace-nowrap py-2 pr-3 text-slate-600">
                                {item.date}
                              </td>
                              <td className="py-2 pr-3 text-slate-500">
                                {item.note || '—'}
                              </td>
                              <td className="py-2 text-right print:hidden">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormModal({ type: 'book', item })
                                    }
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                    title="Edit"
                                    aria-label="Edit entry"
                                  >
                                    <FiEdit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirm({ type: 'book', item })
                                    }
                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                    title="Delete"
                                    aria-label="Delete entry"
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

          {bookGroups.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
              <span>{bookGroups.length} book(s) total</span>
              <strong className="text-sm font-bold text-slate-900">
                {formatCurrency(summary.bookCostTotal)}
              </strong>
            </div>
          )}
        </div>
      </section>

      {/* ==================== Tab 2: Author Royalty ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-author"
        aria-labelledby="cost-tab-author"
        className={panelClass('author')}
      >
        <DataTable
          title="Author Royalty"
          data={authorCommissions}
          selectable={false}
          searchKeys={['authorName', 'bookName', 'method', 'note']}
          searchPlaceholder="Search author, book, or method..."
          pageSize={6}
          headerActions={addButton('author', 'Add Royalty')}
          columns={[
            {
              key: 'authorName',
              header: 'Author',
              sortable: true,
              render: item => (
                <span className="font-semibold text-slate-800">
                  {item.authorName}
                </span>
              ),
            },
            {
              key: 'bookName',
              header: 'Book',
              sortable: true,
              render: item => (
                <span className="text-slate-600">{item.bookName || '—'}</span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="whitespace-nowrap font-semibold text-slate-900">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              sortable: true,
              render: item => (
                <span className="whitespace-nowrap text-slate-600">
                  {item.date}
                </span>
              ),
            },
            {
              key: 'method',
              header: 'Method',
              align: 'center',
              render: item => (
                <span className="text-xs text-slate-600">{item.method}</span>
              ),
            },
            actionsColumn('author'),
          ]}
          emptyMessage="No author royalty entries for this month."
        />

        {perAuthorTotals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">By Author:</span>
            {perAuthorTotals.map(([authorName, total]) => (
              <span
                key={authorName}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-slate-700"
              >
                {authorName}:{' '}
                <strong className="text-slate-900">
                  {formatCurrency(total)}
                </strong>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ==================== Tab 3: Staff & Office ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-employee"
        aria-labelledby="cost-tab-employee"
        className={panelClass('employee')}
      >
        <DataTable
          title="Staff & Office Expense"
          data={employeeExpenses}
          selectable={false}
          searchKeys={['employeeName', 'expenseType', 'note']}
          searchPlaceholder="Search employee or expense type..."
          pageSize={6}
          headerActions={addButton('employee', 'Add Expense')}
          columns={[
            {
              key: 'employeeName',
              header: 'Employee',
              sortable: true,
              render: item => (
                <span className="font-semibold text-slate-800">
                  {item.employeeName}
                </span>
              ),
            },
            {
              key: 'expenseType',
              header: 'Type',
              sortable: true,
              render: item => (
                <span className="text-xs text-slate-600">
                  {item.expenseType}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="whitespace-nowrap font-semibold text-slate-900">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              sortable: true,
              render: item => (
                <span className="whitespace-nowrap text-slate-600">
                  {item.date}
                </span>
              ),
            },
            {
              key: 'note',
              header: 'Note',
              render: item => (
                <span className="line-clamp-1 text-xs text-slate-500">
                  {item.note || '—'}
                </span>
              ),
            },
            actionsColumn('employee'),
          ]}
          emptyMessage="No staff or office expenses for this month."
        />
      </section>

      {/* ==================== Tab 4: Marketing ==================== */}
      <section
        role="tabpanel"
        id="cost-panel-marketing"
        aria-labelledby="cost-tab-marketing"
        className={panelClass('marketing')}
      >
        <DataTable
          title="Marketing Expense"
          data={marketingCosts}
          selectable={false}
          searchKeys={['channel', 'bookName', 'note']}
          searchPlaceholder="Search channel or book..."
          pageSize={6}
          headerActions={addButton('marketing', 'Add Marketing')}
          columns={[
            {
              key: 'channel',
              header: 'Channel',
              sortable: true,
              render: item => (
                <span className="font-medium text-slate-800">
                  {item.channel}
                </span>
              ),
            },
            {
              key: 'bookName',
              header: 'Book',
              sortable: true,
              render: item => (
                <span className="text-slate-600">
                  {item.bookName || 'General Branding'}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              sortable: true,
              sortValue: item => Number(item.amount || 0),
              render: item => (
                <span className="whitespace-nowrap font-semibold text-slate-900">
                  {formatCurrency(item.amount)}
                </span>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              sortable: true,
              render: item => (
                <span className="whitespace-nowrap text-slate-600">
                  {item.date}
                </span>
              ),
            },
            {
              key: 'note',
              header: 'Note',
              render: item => (
                <span className="line-clamp-1 text-xs text-slate-500">
                  {item.note || '—'}
                </span>
              ),
            },
            actionsColumn('marketing'),
          ]}
          emptyMessage="No marketing expenses for this month."
        />
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
          currentUser={currentUser}
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
        title="Delete Cost Record?"
        message={`Are you sure you want to delete "${deleteConfirm?.item?.bookName || deleteConfirm?.item?.authorName || deleteConfirm?.item?.employeeName || deleteConfirm?.item?.channel}"? This removes it from totals.`}
        confirmLabel="Delete"
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
  currentUser,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(initialItem);
  const expenseProfiles = useMemo(() => getExpenseProfiles(), []);

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
  const [expenseProfileId, setExpenseProfileId] = useState(() => {
    if (initialItem?.expenseProfileId) return initialItem.expenseProfileId;
    if (type === 'book') {
      return resolveProfileIdFromCategory(initialItem?.costType || COST_TYPES[0]);
    }
    if (type === 'employee') {
      return resolveProfileIdFromCategory(initialItem?.expenseType || EXPENSE_TYPES[0]);
    }
    if (type === 'author') return 'prof-manuscript';
    return 'prof-other';
  });
  const [payeeName, setPayeeName] = useState(initialItem?.payeeName || '');
  const [amount, setAmount] = useState(initialItem?.amount || '');
  const [dueAmount, setDueAmount] = useState(initialItem?.dueAmount || '');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState(initialItem?.note || '');

  // Modal Titles
  const modalTitles = {
    book: isEditing ? 'Edit Book Production Cost' : 'Add Book Production Cost',
    author: isEditing ? 'Edit Author Royalty' : 'Add Author Royalty',
    employee: isEditing ? 'Edit Staff Expense' : 'Add Staff Expense',
    marketing: isEditing ? 'Edit Marketing Expense' : 'Add Marketing Expense',
  };

  const handleSubmit = e => {
    e.preventDefault();

    // Validations
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Enter a valid amount greater than 0.');
      return;
    }
    if (!date) {
      toast.error('Please select a valid date.');
      return;
    }

    const numDue = Math.max(0, Number(dueAmount) || 0);

    if (type === 'book') {
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        bookId,
        bookName: selectedBook?.title || 'Book',
        costType,
        amount: numAmount,
        dueAmount: numDue,
        payeeName: payeeName.trim(),
        expenseProfileId,
        method: paymentMethod,
        date,
        note,
      };
      const saved = isEditing
        ? updateBookCost(initialItem.id, payload)
        : addBookCost(payload);
      if (saved?.id) {
        syncCostToExpenseProfile({
          totalCostRefId: saved.id,
          profileId: expenseProfileId,
          category: costType,
          vendorName: payeeName.trim() || `${costType} (${selectedBook?.title || 'Book'})`,
          bookTitle: selectedBook?.title || '',
          description: note || `${costType} expense from Total Cost`,
          paidAmount: numAmount,
          dueAmount: numDue,
          method: paymentMethod,
          date,
          recordedById: currentUser?.id || 'admin',
          recordedByName: currentUser?.name || 'Admin',
          recordedByRole: currentUser?.role || 'admin',
        });
      }
    } else if (type === 'author') {
      const selectedAuthor = authors.find(
        a => String(a.id) === String(authorId),
      );
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        authorId,
        authorName: selectedAuthor?.name || 'Author',
        bookId: bookId || '',
        bookName: selectedBook?.title || '',
        amount: numAmount,
        dueAmount: numDue,
        expenseProfileId,
        date,
        method: paymentMethod,
        note,
      };
      const saved = isEditing
        ? updateAuthorCommission(initialItem.id, payload)
        : addAuthorCommission(payload);
      if (saved?.id) {
        syncCostToExpenseProfile({
          totalCostRefId: saved.id,
          profileId: expenseProfileId,
          category: 'Manuscript',
          vendorName: selectedAuthor?.name || 'Author Commission',
          bookTitle: selectedBook?.title || '',
          description: note || 'Author commission / manuscript payout',
          paidAmount: numAmount,
          dueAmount: numDue,
          method: paymentMethod,
          date,
          recordedById: currentUser?.id || 'admin',
          recordedByName: currentUser?.name || 'Admin',
          recordedByRole: currentUser?.role || 'admin',
        });
      }
    } else if (type === 'employee') {
      const selectedEmp = employees.find(emp => emp.id === employeeId);
      const finalName =
        employeeId === 'custom'
          ? employeeName.trim() || 'Employee'
          : selectedEmp?.name || employeeName;

      const payload = {
        employeeId,
        employeeName: finalName,
        expenseType,
        amount: numAmount,
        dueAmount: numDue,
        expenseProfileId,
        date,
        note,
      };
      const saved = isEditing
        ? updateEmployeeExpense(initialItem.id, payload)
        : addEmployeeExpense(payload);
      if (saved?.id) {
        syncCostToExpenseProfile({
          totalCostRefId: saved.id,
          profileId: expenseProfileId,
          category: expenseType,
          vendorName: finalName,
          bookTitle: '',
          description: note || `${expenseType} expense from Total Cost`,
          paidAmount: numAmount,
          dueAmount: numDue,
          method: paymentMethod,
          date,
          recordedById: currentUser?.id || 'admin',
          recordedByName: currentUser?.name || 'Admin',
          recordedByRole: currentUser?.role || 'admin',
        });
      }
    } else if (type === 'marketing') {
      const selectedBook = books.find(b => String(b.id) === String(bookId));
      const payload = {
        channel,
        bookId: bookId || '',
        bookName: selectedBook?.title || 'General Branding',
        amount: numAmount,
        dueAmount: numDue,
        expenseProfileId,
        date,
        note,
      };
      const saved = isEditing
        ? updateMarketingCost(initialItem.id, payload)
        : addMarketingCost(payload);
      if (saved?.id) {
        syncCostToExpenseProfile({
          totalCostRefId: saved.id,
          profileId: expenseProfileId,
          category: 'Other',
          vendorName: `${channel} Marketing`,
          bookTitle: selectedBook?.title || '',
          description: note || `${channel} campaign cost`,
          paidAmount: numAmount,
          dueAmount: numDue,
          method: paymentMethod,
          date,
          recordedById: currentUser?.id || 'admin',
          recordedByName: currentUser?.name || 'Admin',
          recordedByRole: currentUser?.role || 'admin',
        });
      }
    }

    toast.success(isEditing ? 'Cost record updated.' : 'Cost record added.');
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900">
              {modalTitles[type]}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Book Cost Inputs */}
          {type === 'book' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Book *
                </label>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
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
                  Cost Type *
                </label>
                <select
                  value={costType}
                  onChange={e => {
                    const nextType = e.target.value;
                    setCostType(nextType);
                    if (!isEditing) {
                      setExpenseProfileId(resolveProfileIdFromCategory(nextType));
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                >
                  {COST_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor / Payee (Optional)
                </label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={e => setPayeeName(e.target.value)}
                  placeholder="Bindery, Press, or Vendor name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                />
              </div>
            </>
          )}

          {/* Author Commission Inputs */}
          {type === 'author' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Author *
                </label>
                <select
                  value={authorId}
                  onChange={e => setAuthorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
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
                  Book (Optional)
                </label>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                >
                  <option value="">All / General</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
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
                  Employee *
                </label>
                <select
                  value={employeeId}
                  onChange={e => {
                    setEmployeeId(e.target.value);
                    const emp = employees.find(em => em.id === e.target.value);
                    if (emp) setEmployeeName(emp.name);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                  <option value="custom">+ Custom Employee Name</option>
                </select>

                {employeeId === 'custom' && (
                  <input
                    type="text"
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    placeholder="Employee name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Type *
                </label>
                <select
                  value={expenseType}
                  onChange={e => {
                    const nextType = e.target.value;
                    setExpenseType(nextType);
                    if (!isEditing) {
                      setExpenseProfileId(resolveProfileIdFromCategory(nextType));
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
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
                  Channel *
                </label>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
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
                  Related Book (Optional)
                </label>
                <select
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                >
                  <option value="">General Branding</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Sync Target Expense Profile */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Expense Profile (Auto-Sync)
            </label>
            <select
              value={expenseProfileId}
              onChange={e => setExpenseProfileId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-slate-500"
            >
              {expenseProfiles.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Paid & Optional Due Fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Paid Amount (৳) *
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Due Amount (৳ - Optional)
              </label>
              <input
                type="number"
                min="0"
                value={dueAmount}
                onChange={e => setDueAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {/* Common Date Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
              required
            />
          </div>

          {/* Common Note Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Note
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows="2"
              placeholder="Optional note or voucher reference..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-slate-500"
            />
          </div>

          {/* Buttons */}
          <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
