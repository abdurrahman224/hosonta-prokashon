import { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiFileText,
  FiDownload,
  FiCalendar,
  FiClock,
  FiBook,
  FiTag,
  FiDollarSign,
  FiPackage,
  FiLayers,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiPercent,
  FiShare2,
} from 'react-icons/fi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../../../context/useData';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import { getBookPath } from '../../../utils/bookSlug';
import StatusBadge from '../../../components/dashboard/StatusBadge';

const formatTaka = (value) =>
  `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookDetailsDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books = [], deleteBook } = useData();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find book
  const book = useMemo(() => {
    return books.find((b) => String(b.id) === String(id)) || null;
  }, [books, id]);

  const handleDelete = () => {
    if (!book) return;
    setIsDeleting(true);
    try {
      if (typeof deleteBook === 'function') {
        deleteBook(book.id);
      }
      toast.success('Book deleted successfully');
      navigate('/dashboard/books');
    } catch {
      toast.error('Failed to delete book');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${getBookPath(book)}`;
    navigator.clipboard.writeText(url);
    toast.success('Public book link copied to clipboard');
  };

  if (!book) {
    return (
      <div className="mx-auto max-w-4xl py-12 px-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-500">
            <FiBook />
          </div>
          <h2 className="font-heading text-2xl font-bold text-dark">Book Not Found</h2>
          <p className="mt-2 text-slate-500">
            The book you are looking for does not exist or might have been removed.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/books"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-dark hover:bg-primary-hover"
            >
              <FiArrowLeft /> Back to Book Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculated values
  const retailPrice = Number(book.retailPrice ?? book.price ?? book.regularPrice ?? 0);
  const discountPercent = Number(book.discount ?? book.offer ?? 0);
  const salePrice =
    book.salePrice != null
      ? Number(book.salePrice)
      : book.offerPrice != null
      ? Number(book.offerPrice)
      : discountPercent > 0
      ? Math.round(retailPrice * (1 - discountPercent / 100))
      : retailPrice;
  const wholesalePrice = Number(book.wholesalePrice || 0);
  const profitMargin = wholesalePrice > 0 ? salePrice - wholesalePrice : 0;
  const marginPercent =
    wholesalePrice > 0 ? ((profitMargin / wholesalePrice) * 100).toFixed(1) : null;
  const stockCount = Number(book.stock || 0);

  const coverUrl =
    book.cover ||
    book.image ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80';

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {/* Top Navigation & Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/books"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Back to Catalog"
          >
            <FiArrowLeft className="text-lg" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {book.title}
              </h1>
              <StatusBadge status={book.status || 'published'} />
              {book.isScheduled && (
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <FiClock className="text-xs" /> Scheduled
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              SKU: <span className="font-mono font-medium text-slate-700">{book.sku || book.isbn || `HP-${String(book.id).padStart(4, '0')}`}</span> • Category: <span className="font-medium text-slate-700">{book.category || 'General'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-none"
            title="Copy Public Store Link"
          >
            <FiShare2 className="text-slate-500" />
            <span className="hidden sm:inline">Share Link</span>
          </button>

          <Link
            to={getBookPath(book)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-none"
          >
            <FiExternalLink className="text-slate-500" />
            <span>Store View</span>
          </Link>

          <Link
            to={`/dashboard/books/edit/${book.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-dark shadow-xs transition hover:bg-primary-hover focus-visible:outline-none"
          >
            <FiEdit2 />
            <span>Edit Book</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none"
          >
            <FiTrash2 />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Media & Highlights */}
        <div className="space-y-6 lg:col-span-4">
          {/* Book Cover Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Book Cover & Media
            </h3>
            <div className="relative mx-auto flex aspect-[3/4] max-w-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-inner">
              <img
                src={coverUrl}
                alt={book.title}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
              />
              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                {book.featured && (
                  <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    Featured
                  </span>
                )}
                {book.bestseller && (
                  <span className="rounded-md bg-emerald-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    Bestseller
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
              <div className="rounded-xl bg-slate-50/80 p-2.5">
                <p className="text-xs font-medium text-slate-500">Stock Count</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    stockCount === 0
                      ? 'text-rose-600'
                      : stockCount <= 5
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}
                >
                  {stockCount} copies
                </p>
              </div>
              <div className="rounded-xl bg-slate-50/80 p-2.5">
                <p className="text-xs font-medium text-slate-500">Total Sold</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {book.sold || 0} copies
                </p>
              </div>
            </div>
          </div>

          {/* Sample PDF Preview Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Sample PDF Preview
            </h3>
            {book.samplePdfUrl || book.samplePdfName ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <FiFileText className="text-xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">
                      {book.samplePdfName || 'Sample Chapter Preview'}
                    </p>
                    <p className="text-xs text-indigo-600">Sample PDF Attached</p>
                  </div>
                </div>
                {book.samplePdfUrl && (
                  <div className="mt-3.5 flex gap-2">
                    <a
                      href={book.samplePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700"
                    >
                      <FiExternalLink /> Open PDF
                    </a>
                    <a
                      href={book.samplePdfUrl}
                      download
                      className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      title="Download PDF"
                    >
                      <FiDownload />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <FiFileText className="text-2xl text-slate-300" />
                <p className="mt-2 text-xs font-medium text-slate-400">
                  No sample PDF uploaded for this book
                </p>
                <Link
                  to={`/dashboard/books/edit/${book.id}`}
                  className="mt-2 text-xs font-semibold text-primary-hover hover:underline"
                >
                  Upload sample PDF →
                </Link>
              </div>
            )}
          </div>

          {/* Schedule Info (if scheduled) */}
          {book.isScheduled && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 font-semibold text-indigo-900">
                <FiCalendar className="text-indigo-600" />
                <span>Scheduled Publication</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-indigo-700">
                This book is scheduled to be automatically published on:
              </p>
              <div className="mt-2 rounded-lg bg-white p-3 font-mono text-sm font-bold text-indigo-950 border border-indigo-100">
                {formatDateTime(book.scheduledAt)}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Comprehensive Book Specifications */}
        <div className="space-y-6 lg:col-span-8">
          {/* Section 1: Book Information */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
                <FiBook className="text-primary" />
                <span>Book Specifications</span>
              </h2>
              <span className="text-xs font-medium text-slate-400">General Information</span>
            </div>

            <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Book Title</dt>
                <dd className="mt-1 font-semibold text-slate-900">{book.title || '—'}</dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Author</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                  <FiUser className="text-slate-400" />
                  <span>{book.author || '—'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Publisher</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {book.publisher || 'Hosonta Prokashon'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Category / Genre</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    <FiTag className="text-xs" />
                    {book.category || 'General'}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Total Pages</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {book.pages ? `${book.pages} pages` : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Cover / Binding</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    <FiLayers className="text-xs" />
                    {book.coverType || 'Paperback'}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">Publishing Year</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {book.publishedYear || book.publishingYear || '2026'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-slate-500">ISBN / SKU</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-slate-800">
                  {book.isbn || book.sku || `HP-${String(book.id).padStart(4, '0')}`}
                </dd>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
                <FiDollarSign className="text-emerald-600" />
                <span>Pricing & Inventory</span>
              </h2>
              <span className="text-xs font-medium text-slate-400">Financial Details</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <p className="text-xs font-medium text-slate-500">Regular / Retail</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatTaka(retailPrice)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-amber-50/40 p-3.5">
                <p className="text-xs font-medium text-amber-700">Discount</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold text-amber-800">
                  <span>{discountPercent}%</span>
                  <FiPercent className="text-sm" />
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
                <p className="text-xs font-medium text-emerald-700">Selling Price</p>
                <p className="mt-1 text-lg font-bold text-emerald-900">
                  {formatTaka(salePrice)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <p className="text-xs font-medium text-slate-500">Wholesale Price</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {wholesalePrice > 0 ? formatTaka(wholesalePrice) : '—'}
                </p>
              </div>
            </div>

            {/* Profit Margin Calculation (if wholesale price is known) */}
            {wholesalePrice > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100/70 px-4 py-3 text-xs sm:text-sm">
                <span className="font-medium text-slate-700">Estimated Profit Per Copy:</span>
                <span className="font-bold text-emerald-700">
                  +{formatTaka(profitMargin)} ({marginPercent}%)
                </span>
              </div>
            )}

            {/* Stock Breakdown */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FiPackage className="text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Stock Availability</p>
                  <p className="font-semibold text-slate-900">
                    {book.availability || (stockCount > 0 ? 'In Stock' : 'Out of Stock')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <FiAlertCircle className="text-lg" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Low Stock Limit Alert</p>
                  <p className="font-semibold text-slate-900">
                    {book.lowStockLimit ?? 5} copies
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Product Description */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="mb-3 font-heading text-lg font-bold text-slate-900">
              Product Description
            </h2>
            {book.description ? (
              <div className="prose max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {book.description}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">
                No description provided for this book.
              </p>
            )}
          </div>

          {/* Section 4: Audit & Metadata */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-xs text-slate-500 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span>Created At: </span>
                <span className="font-medium text-slate-700">
                  {formatDate(book.createdAt)}
                </span>
              </div>
              <div>
                <span>Last Updated: </span>
                <span className="font-medium text-slate-700">
                  {formatDate(book.updatedAt || book.createdAt)}
                </span>
              </div>
              <div>
                <span>Record ID: </span>
                <span className="font-mono font-medium text-slate-700">{book.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Book?"
        message={`Are you sure you want to permanently delete "${book.title}" from the catalog? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Book'}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
