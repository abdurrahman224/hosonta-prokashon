import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import { useData } from '../../../context/useData';
import { getCategoryLabel } from '../../../utils/i18n';

const formatTaka = value =>
  `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const formatDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRetail = book => Number(book.retailPrice ?? book.price ?? 0);
const getOffer = book => Number(book.offer ?? 0);
// Sale price = retail price minus the offer percentage
const calcSale = (retail, offer) =>
  Math.round(Number(retail || 0) * (1 - Number(offer || 0) / 100));
const getSale = book =>
  book.retailPrice != null
    ? calcSale(book.retailPrice, book.offer)
    : Number(book.salePrice ?? book.price ?? 0);

/* Demo data: shown only while the context has no real edit history.
   Remove this block (and the fallback in BooksView) once `bookEditHistory` is wired up. */
const DUMMY_HISTORY = [
  {
    id: 'h1',
    editedAt: '2026-11-20T14:32:00',
    editedBy: 'Rahim Uddin',
    role: 'Admin',
    bookTitle: 'পথের পাঁচালী',
    action: 'updated',
    changes: [
      { field: 'Offer', from: '25%', to: '40%' },
      { field: 'Sale Price', from: '৳375', to: '৳300' },
    ],
  },
  {
    id: 'h2',
    editedAt: '2026-11-20T11:05:00',
    editedBy: 'Nusrat Jahan',
    role: 'Manager',
    bookTitle: 'লালসালু',
    action: 'updated',
    changes: [{ field: 'Stock', from: 8, to: 24 }],
  },
  {
    id: 'h3',
    editedAt: '2026-11-19T17:48:00',
    editedBy: 'Rahim Uddin',
    role: 'Admin',
    bookTitle: 'দেশ ও সমাজ',
    action: 'created',
    changes: [
      { field: 'Wholesale Price', from: '—', to: '৳180' },
      { field: 'Retail Price', from: '—', to: '৳320' },
    ],
  },
  {
    id: 'h4',
    editedAt: '2026-11-19T10:20:00',
    editedBy: 'Tanvir Ahmed',
    role: 'Staff',
    bookTitle: 'অপরাজিত',
    action: 'updated',
    changes: [
      { field: 'Wholesale Price', from: '৳210', to: '৳225' },
      { field: 'Status', from: 'draft', to: 'published' },
    ],
  },
  {
    id: 'h5',
    editedAt: '2026-11-18T16:12:00',
    editedBy: 'Nusrat Jahan',
    role: 'Manager',
    bookTitle: 'শেষের কবিতা',
    action: 'updated',
    changes: [{ field: 'Retail Price', from: '৳450', to: '৳480' }],
  },
  {
    id: 'h6',
    editedAt: '2026-11-17T13:40:00',
    editedBy: 'Tanvir Ahmed',
    role: 'Staff',
    bookTitle: 'পুরাতন সংস্করণ বই',
    action: 'deleted',
    changes: [],
  },
  {
    id: 'h7',
    editedAt: '2026-11-16T09:55:00',
    editedBy: 'Rahim Uddin',
    role: 'Admin',
    bookTitle: 'কপালকুণ্ডলা',
    action: 'created',
    changes: [
      { field: 'Stock', from: '—', to: 40 },
      { field: 'Offer', from: '—', to: '25%' },
    ],
  },
];

/* ---------- Small UI pieces ---------- */

function StatCard({ label, value, hint }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Tabs({ active, onChange, tabs }) {
  return (
    <div
      role="tablist"
      className="flex gap-4 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition-colors focus-visible:outline-none ${
              isActive
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs font-medium text-slate-400">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MarginBadge({ wholesale, sale }) {
  const w = Number(wholesale || 0);
  const s = Number(sale || 0);
  if (!w || !s) return <span className="text-xs text-slate-400">N/A</span>;
  const profit = s - w;
  const percent = (profit / w) * 100;
  const positive = profit >= 0;
  return (
    <span
      className={`whitespace-nowrap text-xs font-semibold ${
        positive ? 'text-slate-700' : 'text-rose-600'
      }`}
    >
      {positive ? '+' : ''}
      {formatTaka(profit)} ({percent.toFixed(0)}%)
    </span>
  );
}

const ACTION_STYLES = {
  created: 'bg-emerald-50 text-emerald-700',
  updated: 'bg-indigo-50 text-indigo-700',
  deleted: 'bg-rose-50 text-rose-700',
};

const ACTION_LABELS = {
  created: 'Added',
  updated: 'Edited',
  deleted: 'Deleted',
};

/* ---------- Main view ---------- */

function BooksView() {
  const { books, bookEditHistory, deleteBook, publishers = [] } = useData();
  const [activeTab, setActiveTab] = useState('catalog');
  const [bookToDelete, setBookToDelete] = useState(null);

  const categories = useMemo(
    () => [...new Set(books.map(book => book.category))],
    [books],
  );

  const publisherOptions = useMemo(() => {
    const fromContext = publishers.map(p => p.name);
    const fromBooks = books.map(b => b.publisher).filter(Boolean);
    const set = new Set([...fromContext, ...fromBooks, 'হসন্ত প্রকাশন', 'সেরা পাবলিকেশন']);
    return Array.from(set);
  }, [publishers, books]);

  const history = bookEditHistory?.length ? bookEditHistory : DUMMY_HISTORY;

  const stats = useMemo(() => {
    const totalStock = books.reduce(
      (sum, book) => sum + Number(book.stock || 0),
      0,
    );
    const stockValue = books.reduce(
      (sum, book) =>
        sum + Number(book.stock || 0) * Number(book.wholesalePrice || 0),
      0,
    );
    const lowStock = books.filter(book => Number(book.stock || 0) <= 5).length;
    return { totalStock, stockValue, lowStock };
  }, [books]);

  const handleConfirmDelete = () => {
    if (!bookToDelete) return;
    try {
      if (typeof deleteBook === 'function') {
        deleteBook(bookToDelete.id);
      }
      toast.success(`"${bookToDelete.title}" has been deleted.`);
    } catch {
      toast.error('Failed to delete book');
    } finally {
      setBookToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="All Books"
        description="Manage book catalog, pricing, and inventory."
      />

      {/* Summary + primary action */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total Titles"
            value={books.length}
            hint={`${categories.length} categories`}
          />
          <StatCard
            label="Total Stock"
            value={stats.totalStock.toLocaleString()}
            hint="Copies"
          />
          <StatCard
            label="Stock Value"
            value={formatTaka(stats.stockValue)}
            hint="Wholesale"
          />
          <StatCard
            label="Low Stock"
            value={stats.lowStock}
            hint="5 or fewer"
          />
        </div>
        <Link
          to="/dashboard/books/new"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-dark transition hover:bg-primary-hover lg:w-auto lg:self-start"
        >
          <span className="text-base leading-none">+</span>
          Add Book
        </Link>
      </div>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'catalog', label: 'Catalog', count: books.length },
          { id: 'history', label: 'Edit History', count: history.length },
        ]}
      />

      <div className="mt-5 min-w-0">
        {activeTab === 'catalog' ? (
          <div className="max-w-full overflow-x-auto">
            <DataTable
              title="Book Catalog"
              data={books}
              selectable={false}
              searchKeys={['title', 'author', 'category', 'publisher']}
              searchPlaceholder="Search title, author, category..."
              filters={[
                {
                  key: 'publisher',
                  label: 'All Publishers',
                  options: publisherOptions.map(pub => ({
                    value: pub,
                    label: pub,
                  })),
                  predicate: (book, selectedPublisher) => {
                    const pub = book.publisher || 'হসন্ত প্রকাশন';
                    return pub === selectedPublisher;
                  },
                },
                {
                  key: 'category',
                  label: 'All Categories',
                  options: categories.map(category => ({
                    value: category,
                    label: getCategoryLabel(category),
                  })),
                },
                {
                  key: 'status',
                  label: 'All Statuses',
                  options: [
                    { value: 'published', label: 'Published' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'draft', label: 'Draft' },
                  ],
                },
              ]}
              columns={[
                {
                  key: 'title',
                  header: 'Book',
                  render: book => (
                    <div className="flex min-w-[200px] items-center gap-3">
                      <img
                        src={book.cover}
                        alt=""
                        className="h-11 w-8 shrink-0 rounded border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {book.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'category',
                  header: 'Category',
                  render: book => (
                    <span className="whitespace-nowrap text-xs text-slate-600">
                      {getCategoryLabel(book.category)}
                    </span>
                  ),
                },
                {
                  key: 'wholesalePrice',
                  header: 'Wholesale',
                  sortValue: book => Number(book.wholesalePrice || 0),
                  render: book => (
                    <span className="whitespace-nowrap text-slate-700">
                      {formatTaka(book.wholesalePrice)}
                    </span>
                  ),
                },
                {
                  key: 'retailPrice',
                  header: 'Retail',
                  sortValue: book => getRetail(book),
                  render: book => (
                    <span
                      className={`whitespace-nowrap ${
                        getOffer(book)
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700'
                      }`}
                    >
                      {formatTaka(getRetail(book))}
                    </span>
                  ),
                },
                {
                  key: 'offer',
                  header: 'Offer',
                  sortValue: book => getOffer(book),
                  render: book =>
                    getOffer(book) ? (
                      <span className="whitespace-nowrap text-xs font-medium text-slate-700">
                        {getOffer(book)}% OFF
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    ),
                },
                {
                  key: 'salePrice',
                  header: 'Sale Price',
                  sortValue: book => getSale(book),
                  render: book => (
                    <span className="whitespace-nowrap font-semibold text-slate-900">
                      {formatTaka(getSale(book))}
                    </span>
                  ),
                },
                {
                  key: 'profit',
                  header: 'Profit',
                  sortValue: book =>
                    getSale(book) - Number(book.wholesalePrice || 0),
                  render: book => (
                    <MarginBadge
                      wholesale={book.wholesalePrice}
                      sale={getSale(book)}
                    />
                  ),
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  sortValue: book => Number(book.stock || 0),
                  render: book => {
                    const stock = Number(book.stock || 0);
                    return (
                      <span
                        className={`text-sm font-semibold ${
                          stock === 0
                            ? 'text-rose-600'
                            : stock <= 5
                              ? 'text-amber-600'
                              : 'text-slate-700'
                        }`}
                      >
                        {stock}
                      </span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: book => <StatusBadge status={book.status} />,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  align: 'right',
                  render: book => (
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/dashboard/books/${book.id}`}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="View"
                        aria-label={`View ${book.title}`}
                      >
                        <FiEye size={15} />
                      </Link>
                      <Link
                        to={`/dashboard/books/edit/${book.id}`}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Edit"
                        aria-label={`Edit ${book.title}`}
                      >
                        <FiEdit2 size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setBookToDelete(book)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                        aria-label={`Delete ${book.title}`}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  ),
                },
              ]}
              emptyMessage="No books found."
            />
          </div>
        ) : (
          <EditHistoryTable history={history} />
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Delete Book?"
        message={`Are you sure you want to delete "${bookToDelete?.title}"? This action will permanently remove the book from the catalog.`}
        confirmLabel="Delete Book"
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookToDelete(null)}
      />
    </>
  );
}

/* ---------- Edit history: cards on mobile, table on >= md ---------- */

function ChangeList({ changes }) {
  if (!changes?.length) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <ul className="space-y-0.5">
      {changes.map((change, i) => (
        <li key={i} className="text-xs">
          <span className="font-medium text-slate-700">{change.field}:</span>{' '}
          <span className="text-slate-400 line-through">
            {String(change.from ?? '—')}
          </span>{' '}
          <span className="text-slate-800">{String(change.to ?? '—')}</span>
        </li>
      ))}
    </ul>
  );
}

function ActionBadge({ action }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
        ACTION_STYLES[action] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function Avatar({ name }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function EditHistoryTable({ history }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h3 className="text-sm font-semibold text-slate-900">Edit History</h3>
      </div>

      {history.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">No edits yet</p>
          <p className="mt-1 text-sm text-slate-400">
            When someone adds or edits a book, it will show up here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {history.map((entry, index) => (
              <li key={entry.id ?? index} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-medium text-slate-900">
                    {entry.bookTitle}
                  </p>
                  <ActionBadge action={entry.action} />
                </div>

                <div className="flex items-center gap-2.5">
                  <Avatar name={entry.editedBy} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {entry.editedBy || 'Unknown'}
                      {entry.role && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">
                          {entry.role}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(entry.editedAt)}
                    </p>
                  </div>
                </div>

                {entry.changes?.length > 0 && (
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <ChangeList changes={entry.changes} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Tablet / desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date &amp; Time</th>
                  <th className="px-5 py-3">Edited By</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((entry, index) => (
                  <tr key={entry.id ?? index} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {formatDateTime(entry.editedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={entry.editedBy} />
                        <div>
                          <p className="font-medium text-slate-800">
                            {entry.editedBy || 'Unknown'}
                          </p>
                          {entry.role && (
                            <p className="text-xs text-slate-400">
                              {entry.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {entry.bookTitle}
                    </td>
                    <td className="px-5 py-3.5">
                      <ActionBadge action={entry.action} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <ChangeList changes={entry.changes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default BooksView;
