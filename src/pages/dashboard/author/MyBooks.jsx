import { useMemo, useState } from 'react';
import {
  FiPlus,
  FiBook,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiAlertTriangle,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiSend,
  FiDownload,
  FiStar,
  FiHeart,
  FiEye,
  FiRefreshCw,
  FiLayers,
  FiX,
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { useAuth } from '../../../context/useAuth';
import { getStoredBooks, saveStoredBooks } from '../../../utils/authorStorage';

const LOW_STOCK = 10;

const statusTabs = [
  { value: '', label: 'All Books' },
  { value: 'published', label: 'Published' },
  { value: 'pending', label: 'Pending' },
  { value: 'draft', label: 'Drafts' },
  { value: 'rejected', label: 'Rejected' },
];

const sortOptions = [
  { value: 'newest', label: 'Recently Updated' },
  { value: 'sold', label: 'Best Selling' },
  { value: 'stock', label: 'Lowest Stock' },
  { value: 'title', label: 'Title (A–Z)' },
];

const formatNum = n => Number(n || 0).toLocaleString('en-US');
const formatMoney = n => `৳${formatNum(n)}`;
const formatDate = d =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const earned = b => Number(b.soldCopies || 0) * Number(b.royaltyPerCopy || 0);
const sellingPrice = b => Number(b.discountPrice || b.price || 0);
const discountPercent = b => {
  const printed = Number(b.price || 0);
  const selling = Number(b.discountPrice || 0);
  return printed && selling && selling < printed
    ? Math.round(((printed - selling) / printed) * 100)
    : 0;
};

function MyBooks() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState(getStoredBooks);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const isPending = currentUser.status === 'pending';

  const myBooks = useMemo(
    () => books.filter(b => b.authorId === currentUser.id),
    [books, currentUser.id],
  );

  const categories = useMemo(
    () => [...new Set(myBooks.map(b => b.category).filter(Boolean))],
    [myBooks],
  );

  /* ---------- Summary Metrics ---------- */
  const stats = useMemo(() => {
    const sold = myBooks.reduce((s, b) => s + Number(b.soldCopies || 0), 0);
    const royalty = myBooks.reduce((s, b) => s + earned(b), 0);
    const due = myBooks.reduce((s, b) => s + Number(b.royaltyDue || 0), 0);
    const thisMonth = myBooks.reduce(
      (s, b) => s + Number(b.monthlySales?.at(-1) || 0),
      0,
    );
    const lastMonth = myBooks.reduce(
      (s, b) => s + Number(b.monthlySales?.at(-2) || 0),
      0,
    );
    const trend = lastMonth
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : null;
    const low = myBooks.filter(
      b => b.status === 'published' && Number(b.stock || 0) <= LOW_STOCK,
    ).length;
    const count = s =>
      s ? myBooks.filter(b => b.status === s).length : myBooks.length;

    return { sold, royalty, due, thisMonth, trend, low, count };
  }, [myBooks]);

  /* ---------- Filter & Sort ---------- */
  const visibleBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = myBooks.filter(b => {
      const matchQ =
        !q ||
        [b.title, b.category, b.isbn, b.author].some(v =>
          String(v || '')
            .toLowerCase()
            .includes(q),
        );
      return (
        matchQ &&
        (!statusFilter || b.status === statusFilter) &&
        (!categoryFilter || b.category === categoryFilter)
      );
    });

    const sorters = {
      newest: (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
      sold: (a, b) => Number(b.soldCopies || 0) - Number(a.soldCopies || 0),
      stock: (a, b) => Number(a.stock || 0) - Number(b.stock || 0),
      title: (a, b) => String(a.title).localeCompare(String(b.title)),
    };

    return [...list].sort(sorters[sortBy]);
  }, [myBooks, search, statusFilter, categoryFilter, sortBy]);

  /* ---------- Actions ---------- */
  const updateBooks = next => {
    setBooks(next);
    saveStoredBooks(next);
  };

  const submitForReview = book => {
    if (
      book.authorId !== currentUser.id ||
      !['draft', 'rejected'].includes(book.status)
    )
      return;
    updateBooks(
      books.map(i => (i.id === book.id ? { ...i, status: 'pending' } : i)),
    );
    toast.success('Book submitted for editorial review.');
  };

  const handleEdit = book =>
    navigate(
      book.status === 'draft'
        ? `/dashboard/my-books/${book.id}/edit`
        : `/dashboard/my-books/${book.id}/edit?mode=request`,
    );

  const requestReprint = book => {
    updateBooks(
      books.map(i =>
        i.id === book.id
          ? { ...i, reprintRequestedAt: new Date().toISOString() }
          : i,
      ),
    );
    toast.success('Reprint request sent to the administrator.');
  };

  const confirmDelete = () => {
    if (
      !bookToDelete ||
      bookToDelete.authorId !== currentUser.id ||
      bookToDelete.status !== 'draft'
    ) {
      setBookToDelete(null);
      return;
    }
    updateBooks(books.filter(b => b.id !== bookToDelete.id));
    setBookToDelete(null);
    toast.success('Draft book deleted permanently.');
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSortBy('newest');
  };

  const downloadReport = () => {
    const head = [
      'Title',
      'ISBN',
      'Category',
      'Pages',
      'Printed Price',
      'Selling Price',
      'Sold Copies',
      'Royalty Earned',
      'Stock',
      'Rating',
      'Reviews',
      'Wishlist',
      'Views',
      'Status',
      'Last Updated',
    ];
    const rows = visibleBooks.map(b => [
      b.title,
      b.isbn || '',
      b.category || '',
      b.pages || '',
      b.price || 0,
      sellingPrice(b),
      b.soldCopies || 0,
      earned(b),
      b.stock || 0,
      b.rating || '',
      b.reviewCount || 0,
      b.wishlistCount || 0,
      b.views || 0,
      b.status,
      b.updatedAt || '',
    ]);
    const csv = [head, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-books-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported as CSV.');
  };

  const actions = {
    handleEdit,
    setBookToDelete,
    submitForReview,
    requestReprint,
    currentUser,
  };

  const hasActiveFilters = search || statusFilter || categoryFilter;

  return (
    <div className="space-y-5 text-xs text-dark sm:text-[13px]">
      <PageHeader
        title="My Books"
        description="Manage your published catalog, monitor real-time sales, royalties, and inventory."
        action={
          isPending ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-400 sm:text-sm"
            >
              <FiPlus className="text-base" /> Add New Book
            </button>
          ) : (
            <Link
              to="/dashboard/publishing-terms"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-dark shadow-sm transition-all hover:bg-primary-hover hover:shadow sm:text-sm"
            >
              <FiPlus className="text-base" /> Add New Book
            </Link>
          )
        }
      />

      {isPending && <PendingBanner />}

      {/* ---------- KPI Summary Cards ---------- */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<FiBook />}
          label="Total Catalog"
          value={formatNum(myBooks.length)}
          hint={`${formatNum(stats.count('published'))} Published · ${formatNum(stats.count('pending'))} Pending · ${formatNum(stats.count('draft'))} Drafts`}
        />
        <SummaryCard
          icon={<FiTrendingUp />}
          label="Total Copies Sold"
          value={formatNum(stats.sold)}
          hint={`${formatNum(stats.thisMonth)} copies sold this month`}
          trend={stats.trend}
        />
        <SummaryCard
          icon={<FiDollarSign />}
          label="Total Royalty Earned"
          value={formatMoney(stats.royalty)}
          hint={
            stats.due
              ? `Pending payout: ${formatMoney(stats.due)}`
              : 'All payouts settled'
          }
        />
        <SummaryCard
          icon={<FiAlertTriangle />}
          label="Low Stock Alerts"
          value={formatNum(stats.low)}
          hint={
            stats.low
              ? `${formatNum(LOW_STOCK)} or fewer copies remaining`
              : 'All titles adequately stocked'
          }
          tone={stats.low ? 'warn' : 'default'}
        />
      </div>

      {/* ---------- Main Catalog Container ---------- */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {/* Status Quick-Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 bg-slate-50/50 px-4 pt-2.5">
          {statusTabs.map(tab => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary font-semibold text-dark'
                    : 'border-transparent text-dark-muted hover:text-dark'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active
                      ? 'bg-primary/20 font-semibold text-dark'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {formatNum(stats.count(tab.value))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200/80 p-3.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by book title, ISBN, author, or category..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 sm:text-[13px]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All Categories"
              options={categories.map(c => ({ value: c, label: c }))}
            /> */}
            <Select value={sortBy} onChange={setSortBy} options={sortOptions} />
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <FiDownload className="text-slate-500" /> Export CSV
            </button>
          </div>
        </div>

        {/* Editorial Notice Banner */}
        {/* <div className="flex items-center gap-2 border-b border-slate-200/80 bg-sky-50/70 px-4 py-2.5 text-[11px] text-sky-900">
          <FiInfo className="shrink-0 text-sm text-sky-600" />
          <p>
            Edits made to <span className="font-semibold">Published</span> books
            are submitted as change requests and require admin approval before
            going live.
          </p>
        </div> */}

        {visibleBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
              <FiLayers />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">No books found</p>
              <p className="mt-0.5 text-xs text-dark-muted">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first manuscript to the catalog.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ---------- Desktop / Tablet Data Table ---------- */}
            <div className="hidden max-h-[650px] overflow-auto md:block">
              <table className="w-full min-w-[1580px] border-collapse text-left tabular-nums text-xs md:text-sm">
                <thead className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 text-xs font-semibold text-gray-500 tracking-wide backdrop-blur-xs">
                  <tr>
                    <Th className="sticky left-0 z-20 bg-white">
                      Book Details
                    </Th>
                    <Th>Category</Th>
                    <Th>Pages</Th>
                    <Th>MRP</Th>
                    <Th>Selling Price</Th>
                    <Th>Units Sold</Th>
                    <Th>Royalty</Th>
                    {/* <Th>Sales Trend</Th> */}
                    <Th>Inventory</Th>
                    <Th>Rating</Th>
                    <Th>Wishlist</Th>
                    {/* <Th>Views</Th> */}
                    <Th>Status</Th>
                    <Th>Last Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {visibleBooks.map(book => (
                    <tr
                      key={book.id}
                      className="group align-top transition-colors hover:bg-slate-50/60"
                    >
                      <td className="sticky left-0 z-[5] bg-white px-4 py-3.5 transition-colors group-hover:bg-slate-50/60">
                        <div className="flex w-[220px] gap-3">
                          <CoverThumb src={book.coverImage} alt={book.title} />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-dark">
                              {book.title}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium ">
                              {book.author}
                            </p>
                            {(book.edition || book.publishedYear) && (
                              <p className="mt-0.5 text-[11px] ">
                                {book.edition ? `${book.edition} Edition` : ''}
                                {book.edition && book.publishedYear
                                  ? ' · '
                                  : ''}
                                {book.publishedYear || ''}
                              </p>
                            )}
                            {book.isbn && (
                              <p className="mt-1 font-mono text-[10px] text-slate-400">
                                ISBN: {book.isbn}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-2.5 py-2.5">
                        <span className="0 px-2 py-0.5 text-[12px] font-medium text-[#EAB308] ">
                          {book.category || 'N/A'}
                        </span>
                        {book.binding && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            {book.binding}
                          </p>
                        )}
                      </td>

                      <td className="px-2.5 py-2.5 text-center">
                        {book.pages ? formatNum(book.pages) : 'N/A'}
                      </td>

                      {/* Printed Price (MRP) */}
                      <td className="px-2.5 py-2.5 text-center">
                        <span className="font-medium ">
                          {book.price ? formatMoney(book.price) : 'N/A'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="px-2.5 py-2.5">
                        <p className="font-semibold text-center">
                          {sellingPrice(book)
                            ? formatMoney(sellingPrice(book))
                            : '—'}
                        </p>
                        {discountPercent(book) > 0 && (
                          <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            {formatNum(discountPercent(book))}% OFF
                          </span>
                        )}
                      </td>

                      {/* Sold Copies */}
                      <td className="px-2.5 py-2.5 text-center">
                        <p className="font-semibold text-dark">
                          {formatNum(book.soldCopies)}
                        </p>
                        <p className="text-[12px] ">copies</p>
                      </td>

                      <td className="px-2.5 py-2.5 text-center">
                        <p className="font-semibold text-emerald-700">
                          {formatMoney(earned(book))}
                        </p>
                        {book.royaltyPerCopy ? (
                          <p className="text-[11px] text-slate-400">
                            {formatMoney(book.royaltyPerCopy)} / copy
                          </p>
                        ) : null}
                      </td>

                      {/*                    
                      <td className="px-2.5 py-2.5">
                        <Sparkline data={book.monthlySales} />
                      </td> */}

                      <td className="px-2.5 py-2.5">
                        <StockCell book={book} actions={actions} />
                      </td>

                      {/* Rating */}
                      <td className="px-2.5 py-2.5">
                        {/* <IconStat
                          icon={<FiStar />}
                          tone="bg-amber-50 text-amber-500 ring-amber-500/20"
                        > */}
                        <p className="text-[13px] font-bold leading-none text-dark text-center">
                          {book.rating ? formatNum(book.rating) : 'N/A'}
                        </p>
                        {/* <p className="mt-1 text-[12px] text-slate-400">
                            {formatNum(book.reviewCount)} reviews
                          </p> */}
                        {/* </IconStat> */}
                      </td>

                      {/* Wishlist */}
                      <td className="px-2.5 py-2.5 text-center">
                        {/* <IconStat
                          icon={<FiHeart />}
                          tone="bg-rose-50 text-rose-500 ring-rose-500/20"
                        > */}
                        <p className="text-[13px] font-bold leading-none text-dark">
                          {book.wishlistCount
                            ? formatNum(book.wishlistCount)
                            : 'N/A'}
                        </p>
                        {/* <p className="mt-1 text-[10px] text-slate-400">
                            saved
                          </p> */}
                        {/* </IconStat> */}
                      </td>

                      {/* Views */}
                      {/* <td className="px-2.5 py-2.5">
                        <IconStat
                          icon={<FiEye />}
                          tone="bg-sky-50 text-sky-600 ring-sky-500/20"
                        >
                          <p className="text-[13px] font-bold leading-none text-dark">
                            {formatNum(book.views)}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            views
                          </p>
                        </IconStat>
                      </td> */}

                      {/* Status */}
                      <td className="px-2.5 py-2.5">
                        <StatusCell book={book} />
                      </td>

                      {/* Updated At */}
                      <td className="whitespace-nowrap px-2.5 py-2.5 text-[13px] font-bold  text-center">
                        {book.updatedAt ? formatDate(book.updatedAt) : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <RowActions book={book} actions={actions} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- Mobile Card View ---------- */}
            <ul className="divide-y divide-slate-100 tabular-nums md:hidden">
              {visibleBooks.map(book => (
                <li key={book.id} className="p-4">
                  <div className="flex gap-3.5">
                    <CoverThumb src={book.coverImage} alt={book.title} large />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-dark">
                          {book.title}
                        </p>
                        <StatusBadge status={book.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {book.author} · {book.category || 'Uncategorized'}
                      </p>

                      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50/80 p-2.5 text-[11px]">
                        <Info
                          label="Pages"
                          value={book.pages ? formatNum(book.pages) : '—'}
                        />
                        <Info
                          label="MRP"
                          value={book.price ? formatMoney(book.price) : '—'}
                        />
                        <Info
                          label="Price"
                          value={
                            sellingPrice(book)
                              ? `${formatMoney(sellingPrice(book))}${discountPercent(book) ? ` (-${formatNum(discountPercent(book))}%)` : ''}`
                              : '—'
                          }
                        />
                        <Info
                          label="Sold"
                          value={`${formatNum(book.soldCopies)} copies`}
                        />
                        <Info
                          label="Royalty"
                          value={formatMoney(earned(book))}
                        />
                        <Info
                          label="Updated"
                          value={formatDate(book.updatedAt)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StockCell book={book} actions={actions} />
                    {/* <Sparkline data={book.monthlySales} /> */}
                  </div>

                  {/* Rating · Wishlist · Views */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniStat
                      icon={<FiStar />}
                      tone="bg-amber-50 text-amber-500"
                      value={book.rating ? formatNum(book.rating) : '—'}
                      label={`${formatNum(book.reviewCount)} reviews`}
                    />
                    <MiniStat
                      icon={<FiHeart />}
                      tone="bg-rose-50 text-rose-500"
                      value={formatNum(book.wishlistCount)}
                      label="Wishlist"
                    />
                    <MiniStat
                      icon={<FiEye />}
                      tone="bg-sky-50 text-sky-600"
                      value={formatNum(book.views)}
                      label="Views"
                    />
                  </div>

                  {(book.editRequest || book.reviewComment) && (
                    <StatusNotes book={book} />
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <RowActions book={book} actions={actions} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Delete Draft Book?"
        message="This action cannot be undone. The draft and its metadata will be permanently removed."
        onCancel={() => setBookToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}

/* =================== Sub-Components =================== */

function Th({ children, className = '' }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3.5 font-semibold text-xs text-gray-500 tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Info({ label, value }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </p>
  );
}

function IconStat({ icon, tone, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ring-1 ring-inset ${tone}`}
      >
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}

function MiniStat({ icon, tone, value, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2.5 py-2">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold leading-none text-dark">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, hint, trend, tone = 'default' }) {
  const warn = tone === 'warn';
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        warn ? 'border-amber-200/90' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-base ${
            warn ? 'bg-amber-100/80 text-amber-700' : 'bg-primary/15 text-dark'
          }`}
        >
          {icon}
        </span>
        {trend !== null && trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
              trend >= 0
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20'
            }`}
          >
            {trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            {formatNum(Math.abs(trend))}%
          </span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold tracking-tight text-dark tabular-nums sm:text-2xl">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{hint}</p>
    </div>
  );
}

function CoverThumb({ src, alt, large }) {
  const size = large ? 'h-24 w-16' : 'h-[74px] w-[50px]';
  return src ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${size} shrink-0 rounded-md object-cover shadow-xs ring-1 ring-black/10`}
    />
  ) : (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ring-1 ring-black/5`}
    >
      <FiBook className="text-base" />
    </div>
  );
}

function StockCell({ book, actions }) {
  const n = Number(book.stock || 0);
  const style =
    n === 0
      ? ' text-rose-700 ring-rose-600/20'
      : n <= LOW_STOCK
        ? ' text-amber-700 ring-amber-600/20'
        : ' text-emerald-700 ring-emerald-600/20';

  const needsReprint = book.status === 'published' && n <= LOW_STOCK;

  return (
    <div>
      <span
        className={`inline-flex items-center  text-[12px] font-semibold   ${style}`}
      >
        {n === 0 ? 'Out of Stock' : `${formatNum(n)} in stock`}
      </span>

      {book.stockUpdatedAt && (
        <p className="mt-1 text-[10px] text-slate-400">
          Updated: {formatDate(book.stockUpdatedAt)}
        </p>
      )}

      {needsReprint &&
        (book.reprintRequestedAt ? (
          <p className="mt-1 text-[10px] font-medium text-sky-700">
            Reprint requested
          </p>
        ) : (
          <button
            type="button"
            onClick={() => actions.requestReprint(book)}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 transition hover:text-sky-800 hover:underline"
          >
            <FiRefreshCw className="text-[10px]" /> Request Reprint
          </button>
        ))}
    </div>
  );
}

function StatusNotes({ book }) {
  return (
    <div className="mt-1.5 space-y-1">
      {book.editRequest && (
        <p className="rounded-md border border-amber-200/80 bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
          Edit request awaiting admin review
        </p>
      )}
      {book.reviewComment && (
        <p className="rounded-md border border-rose-200/80 bg-rose-50 px-2 py-1 text-[11px] leading-snug text-rose-700">
          Admin note: {book.reviewComment}
        </p>
      )}
    </div>
  );
}

function StatusCell({ book }) {
  return (
    <div className="max-w-[200px]">
      <StatusBadge status={book.status} />
      <StatusNotes book={book} />
    </div>
  );
}

function IconButton({ onClick, label, tone, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center text-sm transition-all ${tone}`}
    >
      {children}
    </button>
  );
}

function RowActions({ book, actions }) {
  const { handleEdit, setBookToDelete, submitForReview, currentUser } = actions;
  const canSubmit =
    book.authorId === currentUser.id &&
    ['draft', 'rejected'].includes(book.status);

  return (
    <div className="flex justify-end gap-1.5">
      <IconButton
        onClick={() => handleEdit(book)}
        label={book.status === 'draft' ? 'Edit Book' : 'Request Edit'}
        tone=""
      >
        <FiEdit2 />
      </IconButton>
      {canSubmit && (
        <IconButton
          onClick={() => submitForReview(book)}
          label="Submit for Review"
          tone=""
        >
          <FiSend />
        </IconButton>
      )}
      {book.status === 'draft' && (
        <IconButton
          onClick={() => setBookToDelete(book)}
          label="Delete Draft"
          tone=""
        >
          <FiTrash2 />
        </IconButton>
      )}
    </div>
  );
}

// function Sparkline({ data }) {
//   if (!Array.isArray(data) || data.length < 2) {
//     return <span className="text-[11px] text-slate-400"></span>;
//   }
//   const w = 84;
//   const h = 30;
//   const max = Math.max(...data, 1);
//   const step = w / (data.length - 1);
//   const pts = data.map(
//     (v, i) =>
//       `${(i * step).toFixed(1)},${(h - 4 - (v / max) * (h - 8)).toFixed(1)}`,
//   );
//   const up = data.at(-1) >= data.at(-2);
//   const color = up ? '#059669' : '#e11d48';

//   return (
//     <svg
//       width={w}
//       height={h}
//       viewBox={`0 0 ${w} ${h}`}
//       aria-label="Monthly sales trend"
//       className="overflow-visible"
//     >
//       <polyline
//         points={pts.join(' ')}
//         fill="none"
//         stroke={color}
//         strokeWidth="2"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//       <circle
//         cx={pts.at(-1).split(',')[0]}
//         cy={pts.at(-1).split(',')[1]}
//         r="2.5"
//         fill={color}
//       />
//     </svg>
//   );
// }

function PendingBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-xs text-amber-900 shadow-2xs sm:text-[13px]">
      <FiAlertTriangle className="shrink-0 text-base text-amber-600" />
      <p>
        Your author account is currently{' '}
        <span className="font-semibold">pending approval</span>. You will be
        able to add new books and submit manuscripts once verified.
      </p>
    </div>
  );
}

export default MyBooks;
