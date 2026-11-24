import { useMemo, useState } from 'react';
import DataTable from '../../../components/dashboard/DataTable';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useData } from '../../../context/useData';

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

const OFFER_PRESETS = [0, 10, 15, 20, 25, 30, 40, 50];

const getRetail = book => Number(book.retailPrice ?? book.price ?? 0);
const getOffer = book => Number(book.offer ?? 0);
// Sale price = retail price minus the offer percentage
const calcSale = (retail, offer) =>
  Math.round(Number(retail || 0) * (1 - Number(offer || 0) / 100));
const getSale = book =>
  book.retailPrice != null
    ? calcSale(book.retailPrice, book.offer)
    : Number(book.salePrice ?? book.price ?? 0);

const emptyForm = {
  title: '',
  author: '',
  category: '',
  sku: '',
  wholesalePrice: '',
  retailPrice: '',
  offer: '0',
  stock: '',
  status: 'draft',
};

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
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Tabs({ active, onChange, tabs }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-slate-200">
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isActive
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
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
  if (!w || !s) return <span className="text-xs text-slate-400">—</span>;
  const profit = s - w;
  const percent = (profit / w) * 100;
  const positive = profit >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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

function AddBookModal({ open, onClose, onSubmit, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  if (!open) return null;

  const salePreview = calcSale(form.retailPrice, form.offer);
  const set = key => event =>
    setForm(prev => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = event => {
    event.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError('Book title and author name are required.');
      return;
    }
    if (Number(form.offer) < 0 || Number(form.offer) > 100) {
      setError('Offer must be between 0% and 100%.');
      return;
    }
    if (salePreview < Number(form.wholesalePrice || 0)) {
      setError(
        'Sale price is lower than wholesale price. Reduce the offer or raise the retail price.',
      );
      return;
    }
    onSubmit({
      ...form,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || 'Uncategorized',
      sku: form.sku.trim(),
      wholesalePrice: Number(form.wholesalePrice || 0),
      retailPrice: Number(form.retailPrice || 0),
      offer: Number(form.offer || 0),
      salePrice: salePreview,
      price: salePreview,
      stock: Number(form.stock || 0),
    });
    setForm(emptyForm);
    setError('');
    onClose();
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="add-book-title"
              className="text-lg font-semibold text-slate-900"
            >
              Add book
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Add a new book to the catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="book-title">
              Book title
            </label>
            <input
              id="book-title"
              className={inputClass}
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Pother Pachali"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="book-author">
              Author
            </label>
            <input
              id="book-author"
              className={inputClass}
              value={form.author}
              onChange={set('author')}
              placeholder="Author name"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="book-category">
              Category
            </label>
            <input
              id="book-category"
              list="book-categories"
              className={inputClass}
              value={form.category}
              onChange={set('category')}
              placeholder="Select or type"
            />
            <datalist id="book-categories">
              {categories.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="book-sku">
              SKU / ISBN
            </label>
            <input
              id="book-sku"
              className={inputClass}
              value={form.sku}
              onChange={set('sku')}
              placeholder="Example: HP-0001 or 978-984-9851-01-1"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="book-wholesale">
              Wholesale price (৳)
            </label>
            <input
              id="book-wholesale"
              type="number"
              min="0"
              className={inputClass}
              value={form.wholesalePrice}
              onChange={set('wholesalePrice')}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="book-retail">
              Retail price (৳)
            </label>
            <input
              id="book-retail"
              type="number"
              min="0"
              className={inputClass}
              value={form.retailPrice}
              onChange={set('retailPrice')}
              placeholder="0"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="book-offer">
              Offer (%)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {OFFER_PRESETS.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm(prev => ({ ...prev, offer: String(value) }))
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    Number(form.offer) === value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {value === 0 ? 'No offer' : `${value}%`}
                </button>
              ))}
              <input
                id="book-offer"
                type="number"
                min="0"
                max="100"
                className={`${inputClass} !w-24`}
                value={form.offer}
                onChange={set('offer')}
                aria-label="Custom offer percentage"
              />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Sale price (auto)</span>
              <span className="font-semibold text-slate-900">
                {formatTaka(salePreview)}
              </span>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="book-stock">
              Stock
            </label>
            <input
              id="book-stock"
              type="number"
              min="0"
              className={inputClass}
              value={form.stock}
              onChange={set('stock')}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="book-status">
              Status
            </label>
            <select
              id="book-status"
              className={inputClass}
              value={form.status}
              onChange={set('status')}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
            </select>
          </div>
          {error && (
            <p
              className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Save book
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Main view ---------- */

function BooksView() {
  // `addBook` and `bookEditHistory` are optional: wire them up in your DataContext.
  const { books, addBook, bookEditHistory } = useData();
  const [activeTab, setActiveTab] = useState('catalog');
  const [modalOpen, setModalOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(books.map(book => book.category))],
    [books],
  );
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

  const handleAddBook = payload => {
    if (typeof addBook === 'function') addBook(payload);
  };

  return (
    <>
      <PageHeader
        title="All Books"
        description="Manage the catalog, prices, and inventory in one place."
      />

      {/* Summary + primary action */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total titles"
            value={books.length}
            hint={`${categories.length} categories`}
          />
          <StatCard
            label="Total stock"
            value={stats.totalStock.toLocaleString()}
            hint="Copies in inventory"
          />
          <StatCard
            label="Stock value"
            value={formatTaka(stats.stockValue)}
            hint="At wholesale price"
          />
          <StatCard
            label="Low stock"
            value={stats.lowStock}
            hint="5 copies or fewer"
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:self-start"
        >
          <span className="text-lg leading-none">+</span>
          Add book
        </button>
      </div>

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'catalog', label: 'Book Catalog', count: books.length },
          { id: 'history', label: 'Edit History', count: history.length },
        ]}
      />

      <div className="mt-6">
        {activeTab === 'catalog' ? (
          <DataTable
            title="Book Catalog"
            data={books}
            searchKeys={['title', 'author', 'category']}
            searchPlaceholder="Search title, author, or category..."
            filters={[
              {
                key: 'category',
                label: 'All Categories',
                options: categories.map(category => ({
                  value: category,
                  label: category,
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
                header: 'Book Details',
                sortable: true,
                render: book => (
                  <div className="flex items-center gap-3">
                    <img
                      src={book.cover}
                      alt=""
                      className="h-12 w-9 rounded-md border border-slate-200 object-cover"
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
                sortable: true,
                render: book => (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {book.category}
                  </span>
                ),
              },
              {
                key: 'wholesalePrice',
                header: 'Wholesale Price',
                sortable: true,
                sortValue: book => Number(book.wholesalePrice || 0),
                render: book => (
                  <span className="font-medium text-slate-700">
                    {formatTaka(book.wholesalePrice)}
                  </span>
                ),
              },
              {
                key: 'retailPrice',
                header: 'Retail Price',
                sortable: true,
                sortValue: book => getRetail(book),
                render: book => (
                  <span
                    className={
                      getOffer(book)
                        ? 'text-slate-400 line-through'
                        : 'font-medium text-slate-700'
                    }
                  >
                    {formatTaka(getRetail(book))}
                  </span>
                ),
              },
              {
                key: 'offer',
                header: 'Offer',
                sortable: true,
                sortValue: book => getOffer(book),
                render: book =>
                  getOffer(book) ? (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {getOffer(book)}% OFF
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  ),
              },
              {
                key: 'salePrice',
                header: 'Sale Price',
                sortable: true,
                sortValue: book => getSale(book),
                render: book => (
                  <span className="font-semibold text-slate-900">
                    {formatTaka(getSale(book))}
                  </span>
                ),
              },
              {
                key: 'profit',
                header: 'Profit',
                sortable: true,
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
                sortable: true,
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
            ]}
            emptyMessage="No books found. Use “Add book” to create the first one."
          />
        ) : (
          <EditHistoryTable history={history} />
        )}
      </div>

      <AddBookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddBook}
        categories={categories}
      />
    </>
  );
}

function EditHistoryTable({ history }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Edit History</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          See who changed which book, and when.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-medium text-slate-700">No edits yet</p>
          <p className="mt-1 text-sm text-slate-400">
            When someone adds or edits a book, it will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {(entry.editedBy || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">
                          {entry.editedBy || 'Unknown'}
                        </p>
                        {entry.role && (
                          <p className="text-xs text-slate-400">{entry.role}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {entry.bookTitle}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        ACTION_STYLES[entry.action] ||
                        'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {entry.changes?.length ? (
                      <ul className="space-y-0.5">
                        {entry.changes.map((change, i) => (
                          <li key={i} className="text-xs">
                            <span className="font-medium text-slate-700">
                              {change.field}:
                            </span>{' '}
                            <span className="text-slate-400 line-through">
                              {String(change.from ?? '—')}
                            </span>{' '}
                            <span className="text-slate-800">
                              {String(change.to ?? '—')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BooksView;
