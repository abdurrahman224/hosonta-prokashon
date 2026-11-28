import { useState, useMemo } from 'react';
import {
  FiBookOpen,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import { useData } from '../../../context/useData';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatTaka = value =>
  `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80';

const DEFAULT_LOGOS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
];

const DEFAULT_PUBLISHER = 'হসন্ত প্রকাশন';

const emptyPublisher = (logo = DEFAULT_LOGOS[0]) => ({
  name: '',
  nameEn: '',
  code: '',
  established: '২০২৬',
  phone: '',
  email: '',
  website: '',
  address: '',
  description: '',
  logo,
  status: 'active',
});

const emptyBook = {
  title: '',
  author: '',
  category: '',
  price: '',
  salePrice: '',
  stock: '',
  status: 'published',
  cover: '',
};

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none sm:h-10 sm:text-sm';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-700';

const stockTone = stock =>
  stock === 0
    ? 'text-rose-600'
    : stock <= 5
      ? 'text-amber-600'
      : 'text-slate-800';

/* ------------------------------------------------------------------ */
/* Shared modal shell (bottom sheet on mobile, dialog on >= sm)        */
/* ------------------------------------------------------------------ */

function ModalShell({ title, subtitle, onClose, onSubmit, footer, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {children}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      </form>
    </div>
  );
}

const CancelBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
  >
    Cancel
  </button>
);

const SubmitBtn = ({ children }) => (
  <button
    type="submit"
    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-dark hover:bg-primary-hover"
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Modal: Add / Edit Publisher                                         */
/* ------------------------------------------------------------------ */

function PublisherModal({ initial, isEdit, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = key => e => setForm({ ...form, [key]: e.target.value });

  const submit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit Publisher' : 'Add Publisher'}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SubmitBtn>{isEdit ? 'Save Changes' : 'Save Publisher'}</SubmitBtn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            Publisher Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Hosonta Prokashon"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>English Name</label>
          <input
            value={form.nameEn}
            onChange={set('nameEn')}
            placeholder="Hosonta Prokashon"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Code</label>
          <input
            value={form.code}
            onChange={set('code')}
            placeholder="HP"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Established</label>
          <input
            value={form.established}
            onChange={set('established')}
            placeholder="2026"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={set('status')}
            className={inputCls}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+880..."
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="publisher@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Address</label>
        <input
          value={form.address}
          onChange={set('address')}
          placeholder="38/2 Banglabazar, Dhaka-1100"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Website (optional)</label>
        <input
          value={form.website}
          onChange={set('website')}
          placeholder="https://..."
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Logo URL</label>
        <div className="flex items-center gap-3">
          <img
            src={form.logo || DEFAULT_LOGOS[0]}
            alt="Logo"
            onError={e => {
              e.currentTarget.src = DEFAULT_LOGOS[0];
            }}
            className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
          <input
            value={form.logo}
            onChange={set('logo')}
            placeholder="https://..."
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="Short publisher bio..."
          className="w-full rounded-xl border border-slate-200 p-3 text-base focus:border-primary focus:outline-none sm:text-sm"
        />
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Add / Edit Book (always belongs to one publisher)            */
/* ------------------------------------------------------------------ */

function BookModal({ publisher, book, categories, onClose, onSave }) {
  const isEdit = Boolean(book);
  const [form, setForm] = useState(() =>
    book
      ? {
          title: book.title || '',
          author: book.author || '',
          category: book.category || '',
          price: book.price ?? book.retailPrice ?? '',
          salePrice: book.salePrice ?? book.offerPrice ?? '',
          stock: book.stock ?? '',
          status: book.status || 'published',
          cover: book.cover || book.image || '',
        }
      : emptyBook,
  );
  const set = key => e => setForm({ ...form, [key]: e.target.value });

  const submit = e => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      toast.error('Book title and author are required');
      return;
    }
    const price = Number(form.price || 0);
    const sale = form.salePrice === '' ? price : Number(form.salePrice);
    if (sale > price) {
      toast.error('Sale price cannot exceed regular price');
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim() || 'General',
      price,
      retailPrice: price,
      salePrice: sale,
      stock: Number(form.stock || 0),
      publisher: publisher.name,
    });
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit Book' : 'Add Book'}
      subtitle={`Publisher: ${publisher.name}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SubmitBtn>{isEdit ? 'Save Changes' : 'Save Book'}</SubmitBtn>
        </>
      }
    >
      <div>
        <label className={labelCls}>
          Book Title <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={set('title')}
          placeholder="Book title"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            Author <span className="text-red-500">*</span>
          </label>
          <input
            value={form.author}
            onChange={set('author')}
            placeholder="Author name"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <input
            list="publisher-book-categories"
            value={form.category}
            onChange={set('category')}
            placeholder="Select or type"
            className={inputCls}
          />
          <datalist id="publisher-book-categories">
            {categories.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div>
          <label className={labelCls}>Price (৳)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={form.price}
            onChange={set('price')}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Sale Price (৳)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={form.salePrice}
            onChange={set('salePrice')}
            placeholder="Defaults to regular price"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div>
          <label className={labelCls}>Stock</label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.stock}
            onChange={set('stock')}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={set('status')}
            className={inputCls}
          >
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Cover Image URL (optional)</label>
        <input
          value={form.cover}
          onChange={set('cover')}
          placeholder="https://..."
          className={inputCls}
        />
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export default function PublishersManagement() {
  const {
    books = [],
    publishers = [],
    addPublisher,
    updatePublisher,
    deletePublisher,
    addBook,
    updateBook,
    deleteBook,
  } = useData();

  const [selectedPublisherId, setSelectedPublisherId] = useState(
    () => publishers[0]?.id || 'pub-hosonta',
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Publisher modals
  const [publisherModal, setPublisherModal] = useState(null); // { initial, editing }
  const [publisherToDelete, setPublisherToDelete] = useState(null);

  // Book modals
  const [bookModal, setBookModal] = useState(null); // { book | null }
  const [bookToDelete, setBookToDelete] = useState(null);

  // Book table filters
  const [bookSearch, setBookSearch] = useState('');
  const [bookStatus, setBookStatus] = useState('all');

  const activePublisher = useMemo(
    () =>
      publishers.find(
        p => p.id === selectedPublisherId || p.name === selectedPublisherId,
      ) ||
      publishers[0] ||
      null,
    [publishers, selectedPublisherId],
  );

  const filteredPublishers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return publishers;
    return publishers.filter(p =>
      [p.name, p.nameEn, p.code, p.phone, p.address].some(v =>
        String(v || '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [publishers, searchQuery]);

  // Per-publisher stats
  const publisherStats = useMemo(() => {
    const map = {};
    publishers.forEach(pub => {
      map[pub.name] = { totalBooks: 0, totalStock: 0, totalValue: 0 };
    });
    books.forEach(book => {
      const name = book.publisher || DEFAULT_PUBLISHER;
      if (!map[name])
        map[name] = { totalBooks: 0, totalStock: 0, totalValue: 0 };
      map[name].totalBooks += 1;
      map[name].totalStock += Number(book.stock || 0);
      map[name].totalValue +=
        Number(book.stock || 0) * Number(book.price || book.retailPrice || 0);
    });
    return map;
  }, [publishers, books]);

  const overall = useMemo(
    () => ({
      publishers: publishers.length,
      books: books.length,
      stock: books.reduce((s, b) => s + Number(b.stock || 0), 0),
    }),
    [publishers, books],
  );

  const categories = useMemo(
    () => [...new Set(books.map(b => b.category).filter(Boolean))],
    [books],
  );

  const activeBooks = useMemo(() => {
    if (!activePublisher) return [];
    return books.filter(b => {
      const pub = b.publisher || DEFAULT_PUBLISHER;
      return pub === activePublisher.name || pub === activePublisher.nameEn;
    });
  }, [books, activePublisher]);

  const visibleBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return activeBooks.filter(b => {
      if (bookStatus !== 'all' && (b.status || 'published') !== bookStatus)
        return false;
      if (!q) return true;
      return [b.title, b.author, b.category].some(v =>
        String(v || '')
          .toLowerCase()
          .includes(q),
      );
    });
  }, [activeBooks, bookSearch, bookStatus]);

  const activeStats = (activePublisher &&
    publisherStats[activePublisher.name]) || {
    totalBooks: 0,
    totalStock: 0,
    totalValue: 0,
  };

  /* ---------- Publisher handlers ---------- */

  const openAddPublisher = () =>
    setPublisherModal({
      initial: emptyPublisher(
        DEFAULT_LOGOS[publishers.length % DEFAULT_LOGOS.length],
      ),
      editing: null,
    });

  const openEditPublisher = (pub, e) => {
    e?.stopPropagation();
    setPublisherModal({
      initial: {
        ...emptyPublisher(),
        ...pub,
        logo: pub.logo || DEFAULT_LOGOS[0],
      },
      editing: pub,
    });
  };

  const savePublisher = form => {
    const editing = publisherModal?.editing;
    if (!form.name.trim()) {
      toast.error('Publisher name is required');
      return;
    }
    if (editing) {
      if (typeof updatePublisher === 'function')
        updatePublisher(editing.id, form);
      toast.success(`"${form.name}" updated`);
    } else {
      const exists = publishers.some(
        p => p.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      );
      if (exists) {
        toast.error('A publisher with this name already exists.');
        return;
      }
      const stamp = Date.now();
      const newPub = {
        ...form,
        id: `pub-${stamp}`,
        slug: form.nameEn
          ? form.nameEn.toLowerCase().replace(/\s+/g, '-')
          : `pub-${stamp}`,
      };
      if (typeof addPublisher === 'function') addPublisher(newPub);
      toast.success(`"${form.name}" added`);
      setSelectedPublisherId(newPub.id);
    }
    setPublisherModal(null);
  };

  const confirmDeletePublisher = () => {
    if (!publisherToDelete) return;
    try {
      if (typeof deletePublisher === 'function')
        deletePublisher(publisherToDelete.id);
      toast.success(`"${publisherToDelete.name}" deleted`);
      if (selectedPublisherId === publisherToDelete.id) {
        const remaining = publishers.filter(p => p.id !== publisherToDelete.id);
        setSelectedPublisherId(remaining[0]?.id || '');
      }
    } catch {
      toast.error('Failed to delete publisher');
    } finally {
      setPublisherToDelete(null);
    }
  };

  /* ---------- Book handlers ---------- */

  const saveBook = payload => {
    const editing = bookModal?.book;
    if (editing) {
      if (typeof updateBook === 'function') updateBook(editing.id, payload);
      toast.success(`"${payload.title}" updated`);
    } else {
      if (typeof addBook === 'function') {
        addBook({ ...payload, id: `book-${Date.now()}` });
      }
      toast.success(`"${payload.title}" added`);
    }
    setBookModal(null);
  };

  const confirmDeleteBook = () => {
    if (!bookToDelete) return;
    try {
      if (typeof deleteBook === 'function') deleteBook(bookToDelete.id);
      toast.success(`"${bookToDelete.title}" deleted`);
    } catch {
      toast.error('Failed to delete book');
    } finally {
      setBookToDelete(null);
    }
  };

  /* ---------- Small action buttons for books ---------- */

  const BookActions = ({ book }) => (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/dashboard/books/${book.id}`}
        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        title="View Details"
        aria-label={`View ${book.title}`}
      >
        <FiEye size={15} />
      </Link>
      <button
        type="button"
        onClick={() => setBookModal({ book })}
        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        title="Edit"
        aria-label={`Edit ${book.title}`}
      >
        <FiEdit2 size={15} />
      </button>
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
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <PageHeader
        title="Publishers"
        description="Manage publishers and their book catalogs."
      />

      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Publishers', value: overall.publishers },
          { label: 'Books', value: overall.books },
          { label: 'Total Stock', value: overall.stock.toLocaleString() },
        ].map(s => (
          <div
            key={s.label}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
          >
            <p className="truncate text-xs font-medium text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Publishers list */}
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-base font-bold text-slate-900">
            All Publishers ({publishers.length})
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search publisher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear"
                >
                  <FiX />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={openAddPublisher}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-dark transition hover:bg-primary-hover"
            >
              <FiPlus size={14} /> Add Publisher
            </button>
          </div>
        </div>

        {filteredPublishers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            No publishers found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPublishers.map(pub => {
              const isSelected = activePublisher?.id === pub.id;
              const stats = publisherStats[pub.name] || { totalBooks: 0 };
              return (
                <div
                  key={pub.id}
                  onClick={() => setSelectedPublisherId(pub.id)}
                  className={`cursor-pointer rounded-xl border bg-white p-3.5 transition ${
                    isSelected
                      ? 'border-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pub.logo || FALLBACK_COVER}
                      alt=""
                      onError={e => {
                        e.currentTarget.src = FALLBACK_COVER;
                      }}
                      className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-sm font-semibold text-slate-900">
                        {pub.name}
                      </h3>
                      <p className="truncate text-xs text-slate-400">
                        {stats.totalBooks} books
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-0.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={e => openEditPublisher(pub, e)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                        title="Edit"
                        aria-label={`Edit ${pub.name}`}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      {!pub.isPrimary && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setPublisherToDelete(pub);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                          aria-label={`Delete ${pub.name}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Selected publisher */}
      {activePublisher && (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                <img
                  src={activePublisher.logo || FALLBACK_COVER}
                  alt=""
                  onError={e => {
                    e.currentTarget.src = FALLBACK_COVER;
                  }}
                  className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-slate-900">
                      {activePublisher.name}
                    </h2>
                    {activePublisher.code && (
                      <span className="text-xs text-slate-400">
                        ({activePublisher.code})
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[
                      activePublisher.phone,
                      activePublisher.email,
                      activePublisher.address,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No contact details added'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBookModal({ book: null })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-dark transition hover:bg-primary-hover"
                >
                  <FiPlus size={14} /> Add Book
                </button>
                <button
                  type="button"
                  onClick={e => openEditPublisher(activePublisher, e)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiEdit2 size={13} /> Edit
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3.5 text-center">
              <div className="px-2">
                <p className="text-xs text-slate-500">Books</p>
                <p className="mt-0.5 text-base font-bold text-slate-900">
                  {activeStats.totalBooks}
                </p>
              </div>
              <div className="px-2">
                <p className="text-xs text-slate-500">Stock</p>
                <p className="mt-0.5 text-base font-bold text-slate-900">
                  {activeStats.totalStock}
                </p>
              </div>
              <div className="px-2">
                <p className="text-xs text-slate-500">Stock Value</p>
                <p className="mt-0.5 text-base font-bold text-slate-900">
                  {formatTaka(activeStats.totalValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Books table */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Catalog ({activeBooks.length})
              </h3>

              {activeBooks.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative sm:w-56">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      placeholder="Search title, author..."
                      className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={bookStatus}
                    onChange={e => setBookStatus(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-slate-500 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              )}
            </div>

            {activeBooks.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FiBookOpen className="mx-auto mb-2 text-2xl text-slate-300" />
                <p className="text-sm font-medium text-slate-600">
                  No books under this publisher
                </p>
                <button
                  type="button"
                  onClick={() => setBookModal({ book: null })}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-dark hover:bg-primary-hover"
                >
                  <FiPlus size={14} /> Add Book
                </button>
              </div>
            ) : visibleBooks.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No matching books found.
              </p>
            ) : (
              <>
                {/* Mobile cards */}
                <ul className="divide-y divide-slate-100 md:hidden">
                  {visibleBooks.map(book => {
                    const stock = Number(book.stock || 0);
                    return (
                      <li key={book.id} className="p-4">
                        <div className="flex gap-3">
                          <img
                            src={book.cover || book.image || FALLBACK_COVER}
                            alt=""
                            onError={e => {
                              e.currentTarget.src = FALLBACK_COVER;
                            }}
                            className="h-14 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">
                              {book.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {book.author} · {book.category || 'General'}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs">
                              <span className="font-semibold text-slate-900">
                                {formatTaka(
                                  book.salePrice ||
                                    book.offerPrice ||
                                    book.price,
                                )}
                              </span>
                              <span
                                className={`font-semibold ${stockTone(stock)}`}
                              >
                                Stock: {stock}
                              </span>
                              <StatusBadge
                                status={book.status || 'published'}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <BookActions book={book} />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                      <tr>
                        <th className="whitespace-nowrap px-5 py-3">Book</th>
                        <th className="whitespace-nowrap px-4 py-3">Category</th>
                        <th className="whitespace-nowrap px-4 py-3">Price</th>
                        <th className="whitespace-nowrap px-4 py-3">
                          Sale Price
                        </th>
                        <th className="whitespace-nowrap px-4 py-3">Stock</th>
                        <th className="whitespace-nowrap px-4 py-3">Status</th>
                        <th className="whitespace-nowrap px-5 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleBooks.map(book => {
                        const stock = Number(book.stock || 0);
                        const price = book.price || book.retailPrice;
                        return (
                          <tr key={book.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <div className="flex min-w-[200px] items-center gap-3">
                                <img
                                  src={
                                    book.cover || book.image || FALLBACK_COVER
                                  }
                                  alt=""
                                  onError={e => {
                                    e.currentTarget.src = FALLBACK_COVER;
                                  }}
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
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                              {book.category || 'General'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {formatTaka(price)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                              {formatTaka(
                                book.salePrice || book.offerPrice || price,
                              )}
                            </td>
                            <td
                              className={`whitespace-nowrap px-4 py-3 font-semibold ${stockTone(
                                stock,
                              )}`}
                            >
                              {stock}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={book.status || 'published'}
                              />
                            </td>
                            <td className="px-5 py-3">
                              <BookActions book={book} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      {publisherModal && (
        <PublisherModal
          initial={publisherModal.initial}
          isEdit={Boolean(publisherModal.editing)}
          onClose={() => setPublisherModal(null)}
          onSave={savePublisher}
        />
      )}

      {bookModal && activePublisher && (
        <BookModal
          publisher={activePublisher}
          book={bookModal.book}
          categories={categories}
          onClose={() => setBookModal(null)}
          onSave={saveBook}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(publisherToDelete)}
        title="Delete Publisher?"
        message={`Are you sure you want to delete "${publisherToDelete?.name}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDeletePublisher}
        onCancel={() => setPublisherToDelete(null)}
      />

      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Delete Book?"
        message={`Are you sure you want to delete "${bookToDelete?.title}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteBook}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
}
