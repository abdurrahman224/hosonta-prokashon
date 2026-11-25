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
    বাতিল
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
      title={isEdit ? 'প্রকাশনী তথ্য সম্পাদনা' : 'নতুন প্রকাশনী যুক্ত করুন'}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SubmitBtn>{isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</SubmitBtn>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            প্রকাশনীর নাম (বাংলা) <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="যেমন: হসন্ত প্রকাশন"
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
          <label className={labelCls}>কোড</label>
          <input
            value={form.code}
            onChange={set('code')}
            placeholder="HP"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>প্রতিষ্ঠা সাল</label>
          <input
            value={form.established}
            onChange={set('established')}
            placeholder="২০২৬"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>স্ট্যাটাস</label>
          <select
            value={form.status}
            onChange={set('status')}
            className={inputCls}
          >
            <option value="active">সক্রিয়</option>
            <option value="inactive">নিষ্ক্রিয়</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>ফোন নম্বর</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="০১৮১২-৩৪৫৬৭৮"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>ইমেইল</label>
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
        <label className={labelCls}>ঠিকানা</label>
        <input
          value={form.address}
          onChange={set('address')}
          placeholder="৩৮/২ বাংলাবাজার, ঢাকা-১১০০"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>ওয়েবসাইট (ঐচ্ছিক)</label>
        <input
          value={form.website}
          onChange={set('website')}
          placeholder="https://..."
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>লোগো (URL)</label>
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
        <label className={labelCls}>পরিচিতি / বিবরণ</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="প্রকাশনীর সংক্ষিপ্ত পরিচিতি..."
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
      toast.error('বইয়ের নাম ও লেখকের নাম আবশ্যক');
      return;
    }
    const price = Number(form.price || 0);
    const sale = form.salePrice === '' ? price : Number(form.salePrice);
    if (sale > price) {
      toast.error('বিক্রয় মূল্য মূল্যের চেয়ে বেশি হতে পারবে না');
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
      title={isEdit ? 'বই সম্পাদনা' : 'নতুন বই যোগ করুন'}
      subtitle={`প্রকাশনী: ${publisher.name}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <SubmitBtn>{isEdit ? 'আপডেট করুন' : 'বই সংরক্ষণ করুন'}</SubmitBtn>
        </>
      }
    >
      <div>
        <label className={labelCls}>
          বইয়ের নাম <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={set('title')}
          placeholder="বইয়ের নাম"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            লেখক <span className="text-red-500">*</span>
          </label>
          <input
            value={form.author}
            onChange={set('author')}
            placeholder="লেখকের নাম"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>ক্যাটাগরি</label>
          <input
            list="publisher-book-categories"
            value={form.category}
            onChange={set('category')}
            placeholder="নির্বাচন করুন বা লিখুন"
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
          <label className={labelCls}>মূল্য (৳)</label>
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
          <label className={labelCls}>বিক্রয় মূল্য (৳)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={form.salePrice}
            onChange={set('salePrice')}
            placeholder="খালি রাখলে মূল্যের সমান"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div>
          <label className={labelCls}>স্টক (কপি)</label>
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
          <label className={labelCls}>স্ট্যাটাস</label>
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
        <label className={labelCls}>কভার ছবি (URL, ঐচ্ছিক)</label>
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
      toast.error('প্রকাশনীর নাম প্রদান করা বাধ্যতামূলক');
      return;
    }
    if (editing) {
      if (typeof updatePublisher === 'function')
        updatePublisher(editing.id, form);
      toast.success(`"${form.name}" প্রকাশনীর তথ্য আপডেট করা হয়েছে`);
    } else {
      const exists = publishers.some(
        p => p.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
      );
      if (exists) {
        toast.error('এই নামের প্রকাশনী ইতিমধ্যে বিদ্যমান!');
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
      toast.success(`"${form.name}" সফলভাবে যুক্ত হয়েছে`);
      setSelectedPublisherId(newPub.id);
    }
    setPublisherModal(null);
  };

  const confirmDeletePublisher = () => {
    if (!publisherToDelete) return;
    try {
      if (typeof deletePublisher === 'function')
        deletePublisher(publisherToDelete.id);
      toast.success(`"${publisherToDelete.name}" প্রকাশনীটি মুছে ফেলা হয়েছে`);
      if (selectedPublisherId === publisherToDelete.id) {
        const remaining = publishers.filter(p => p.id !== publisherToDelete.id);
        setSelectedPublisherId(remaining[0]?.id || '');
      }
    } catch {
      toast.error('প্রকাশনী মুছতে সমস্যা হয়েছে');
    } finally {
      setPublisherToDelete(null);
    }
  };

  /* ---------- Book handlers ---------- */

  const saveBook = payload => {
    const editing = bookModal?.book;
    if (editing) {
      if (typeof updateBook === 'function') updateBook(editing.id, payload);
      toast.success(`"${payload.title}" আপডেট করা হয়েছে`);
    } else {
      if (typeof addBook === 'function') {
        addBook({ ...payload, id: `book-${Date.now()}` });
      }
      toast.success(`"${payload.title}" বইটি যুক্ত করা হয়েছে`);
    }
    setBookModal(null);
  };

  const confirmDeleteBook = () => {
    if (!bookToDelete) return;
    try {
      if (typeof deleteBook === 'function') deleteBook(bookToDelete.id);
      toast.success(`"${bookToDelete.title}" বইটি মুছে ফেলা হয়েছে`);
    } catch {
      toast.error('বই মুছতে সমস্যা হয়েছে');
    } finally {
      setBookToDelete(null);
    }
  };

  /* ---------- Small action buttons for books ---------- */

  const BookActions = ({ book }) => (
    <div className="flex items-center gap-1">
      <Link
        to={`/dashboard/books/${book.id}`}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
        title="বিস্তারিত"
      >
        <FiEye />
      </Link>
      <button
        type="button"
        onClick={() => setBookModal({ book })}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-700"
        title="এডিট"
      >
        <FiEdit2 />
      </button>
      <button
        type="button"
        onClick={() => setBookToDelete(book)}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        title="মুছুন"
      >
        <FiTrash2 />
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <PageHeader
        title="Publishers Management (প্রকাশনী)"
        description="প্রকাশনী ও প্রকাশনীভিত্তিক বইয়ের ক্যাটালগ ব্যবস্থাপনা।"
      />

      {/* Overview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'প্রকাশনী', value: overall.publishers },
          { label: 'মোট বই', value: overall.books },
          { label: 'মোট স্টক', value: overall.stock.toLocaleString() },
        ].map(s => (
          <div
            key={s.label}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"
          >
            <p className="truncate text-xs font-medium text-slate-500">
              {s.label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Publishers list */}
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            প্রকাশনী তালিকা
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="প্রকাশনী খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-dark transition hover:bg-primary-hover"
            >
              <FiPlus className="text-base" /> নতুন প্রকাশনী
            </button>
          </div>
        </div>

        {filteredPublishers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
            কোনো প্রকাশনী পাওয়া যায়নি।
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
                  className={`cursor-pointer rounded-xl border bg-white p-4 transition ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30'
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
                      className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-sm font-bold text-slate-900">
                        {pub.name}
                      </h3>
                      <p className="truncate text-xs text-slate-500">
                        {pub.nameEn || pub.code || 'প্রকাশক'}
                      </p>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        pub.status === 'inactive'
                          ? 'bg-slate-300'
                          : 'bg-emerald-500'
                      }`}
                      title={
                        pub.status === 'inactive' ? 'নিষ্ক্রিয়' : 'সক্রিয়'
                      }
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      <strong className="text-slate-800">
                        {stats.totalBooks}
                      </strong>{' '}
                      টি বই
                    </span>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={e => openEditPublisher(pub, e)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="সম্পাদনা"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      {!pub.isPrimary && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setPublisherToDelete(pub);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="মুছুন"
                        >
                          <FiTrash2 className="text-sm" />
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
          {/* Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <img
                  src={activePublisher.logo || FALLBACK_COVER}
                  alt=""
                  onError={e => {
                    e.currentTarget.src = FALLBACK_COVER;
                  }}
                  className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover sm:h-16 sm:w-16"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-heading text-xl font-bold text-slate-900 sm:text-2xl">
                      {activePublisher.name}
                    </h2>
                    {activePublisher.code && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {activePublisher.code}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        activePublisher.status === 'inactive'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {activePublisher.status === 'inactive'
                        ? 'নিষ্ক্রিয়'
                        : 'সক্রিয়'}
                    </span>
                  </div>

                  {activePublisher.description && (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {activePublisher.description}
                    </p>
                  )}

                  <p className="mt-2 break-words text-xs text-slate-500">
                    {[
                      activePublisher.phone,
                      activePublisher.email,
                      activePublisher.address,
                    ]
                      .filter(Boolean)
                      .join('  •  ')}
                    {activePublisher.website && (
                      <>
                        {'  •  '}
                        <a
                          href={activePublisher.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          ওয়েবসাইট
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setBookModal({ book: null })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-dark transition hover:bg-primary-hover"
                >
                  <FiPlus className="text-base" /> বই যোগ করুন
                </button>
                <button
                  type="button"
                  onClick={e => openEditPublisher(activePublisher, e)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiEdit2 /> সম্পাদনা
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4 text-center">
              <div className="min-w-0 px-1">
                <p className="truncate text-xs text-slate-500">বই</p>
                <p className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">
                  {activeStats.totalBooks} টি
                </p>
              </div>
              <div className="min-w-0 px-1">
                <p className="truncate text-xs text-slate-500">স্টক</p>
                <p className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">
                  {activeStats.totalStock} কপি
                </p>
              </div>
              <div className="min-w-0 px-1">
                <p className="truncate text-xs text-slate-500">স্টক মূল্য</p>
                <p className="mt-0.5 break-words text-base font-bold text-emerald-700 sm:text-lg">
                  {formatTaka(activeStats.totalValue)}
                </p>
              </div>
            </div>
          </div>

          {/* Books */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="font-heading text-base font-bold text-slate-900 sm:text-lg">
                {activePublisher.name}-এর বই ({activeBooks.length})
              </h3>

              {activeBooks.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      placeholder="বই, লেখক বা ক্যাটাগরি..."
                      className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <select
                    value={bookStatus}
                    onChange={e => setBookStatus(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none"
                  >
                    <option value="all">সব স্ট্যাটাস</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              )}
            </div>

            {activeBooks.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                  <FiBookOpen />
                </div>
                <h4 className="font-heading text-base font-bold text-slate-800">
                  এই প্রকাশনীর কোনো বই নেই
                </h4>
                <button
                  type="button"
                  onClick={() => setBookModal({ book: null })}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-dark hover:bg-primary-hover"
                >
                  <FiPlus /> প্রথম বই যোগ করুন
                </button>
              </div>
            ) : visibleBooks.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                কোনো বই পাওয়া যায়নি।
              </p>
            ) : (
              <>
                {/* Mobile: cards */}
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
                            className="h-16 w-12 shrink-0 rounded-md border border-slate-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-semibold text-slate-900">
                              {book.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {book.author} • {book.category || 'General'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
                                স্টক: {stock}
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

                {/* Tablet / desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th className="px-6 py-3">বই</th>
                        <th className="px-4 py-3">ক্যাটাগরি</th>
                        <th className="px-4 py-3">মূল্য</th>
                        <th className="px-4 py-3">বিক্রয় মূল্য</th>
                        <th className="px-4 py-3">স্টক</th>
                        <th className="px-4 py-3">স্ট্যাটাস</th>
                        <th className="px-6 py-3 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleBooks.map(book => {
                        const stock = Number(book.stock || 0);
                        const price = book.price || book.retailPrice;
                        return (
                          <tr key={book.id} className="hover:bg-slate-50/60">
                            <td className="px-6 py-3">
                              <div className="flex min-w-[200px] items-center gap-3">
                                <img
                                  src={
                                    book.cover || book.image || FALLBACK_COVER
                                  }
                                  alt=""
                                  onError={e => {
                                    e.currentTarget.src = FALLBACK_COVER;
                                  }}
                                  className="h-12 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
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
                            <td className="px-4 py-3 text-slate-600">
                              {book.category || 'General'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
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
                              {stock} টি
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={book.status || 'published'}
                              />
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex justify-end">
                                <BookActions book={book} />
                              </div>
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
        title="প্রকাশনী মুছে ফেলবেন?"
        message={`আপনি কি নিশ্চিতভাবে "${publisherToDelete?.name}" প্রকাশনীটি মুছে ফেলতে চান?`}
        confirmLabel="মুছে ফেলুন"
        onConfirm={confirmDeletePublisher}
        onCancel={() => setPublisherToDelete(null)}
      />

      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="বই মুছে ফেলবেন?"
        message={`আপনি কি নিশ্চিতভাবে "${bookToDelete?.title}" বইটি মুছে ফেলতে চান?`}
        confirmLabel="মুছে ফেলুন"
        onConfirm={confirmDeleteBook}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
}
