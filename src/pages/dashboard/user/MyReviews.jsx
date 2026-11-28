import { useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiBook,
  FiEdit2,
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import StarRating from '../../../components/reviews/StarRating';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import books from '../../../data/books';
import { getBookPath } from '../../../utils/bookSlug';

const statusTabs = [
  { value: '', label: 'সব' },
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'approved', label: 'প্রকাশিত' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত' },
  { value: 'hidden', label: 'লুকানো' },
];

const toBn = value => Number(value).toLocaleString('bn-BD');

function MyReviews() {
  const { currentUser, can } = useAuth();
  const { reviews, deleteReview } = useData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const ownReviews = useMemo(
    () =>
      reviews
        .filter(review => review.userId === currentUser.id)
        .map(review => ({
          ...review,
          book: books.find(item => String(item.id) === String(review.bookId)),
        })),
    [currentUser.id, reviews],
  );

  const counts = useMemo(() => {
    const result = { '': ownReviews.length };
    ownReviews.forEach(review => {
      result[review.status] = (result[review.status] ?? 0) + 1;
    });
    return result;
  }, [ownReviews]);

  const myReviews = useMemo(() => {
    const search = query.trim().toLowerCase();
    return ownReviews.filter(
      review =>
        (!status || review.status === status) &&
        (!search ||
          `${review.book?.title ?? ''} ${review.title ?? ''} ${review.comment}`
            .toLowerCase()
            .includes(search)),
    );
  }, [ownReviews, query, status]);

  const confirmDelete = () => {
    const result = deleteReview(deleteTarget.id, currentUser);
    toast[result.success ? 'success' : 'error'](
      result.success ? 'রিভিউ মুছে ফেলা হয়েছে।' : result.message,
    );
    setDeleteTarget(null);
  };

  return (
    <>
      {/* হেডার */}
      <div className="mb-3 sm:mb-6">
        <h1 className="font-heading text-lg font-bold text-dark sm:text-3xl">
          আমার রিভিউ
        </h1>
        <p className="mt-0.5 truncate text-xs text-dark-muted sm:mt-1 sm:text-base">
          আপনার রিভিউয়ের প্রকাশনা অবস্থা দেখুন।
        </p>
      </div>

      {/* সার্চ + ফিল্টার */}
      <div className="mb-3 space-y-2 sm:mb-5 sm:space-y-3">
        {/* একটাই ফোকাস রিং: wrapper-এ focus-within, ইনপুটে কোনো আউটলাইন/রিং নেই */}
        <div className="flex w-full items-center gap-2 rounded-lg border border-dark/15 bg-white px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 md:max-w-md">
          <FiSearch
            className="shrink-0 text-base text-dark-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="বই বা রিভিউ খুঁজুন..."
            aria-label="রিভিউ খুঁজুন"
            className="min-w-0 flex-1 appearance-none border-0 bg-transparent py-2 text-base text-dark shadow-none outline-none ring-0 placeholder:text-dark-muted/60 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 sm:py-2.5"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="সার্চ মুছুন"
              className="shrink-0 rounded-full p-1 text-dark-muted transition hover:bg-cream hover:text-dark"
            >
              <FiX />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="স্ট্যাটাস ফিল্টার"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {statusTabs.map(tab => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(tab.value)}
                className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? 'border-dark bg-dark text-white'
                    : 'border-dark/15 bg-white text-dark hover:bg-cream'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] sm:text-xs ${
                    active ? 'bg-white/20' : 'bg-dark/5 text-dark-muted'
                  }`}
                >
                  {toBn(counts[tab.value] ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* রিভিউ তালিকা: মোবাইলে এক বক্সের ভেতর সারি, ডেস্কটপে আলাদা কার্ড */}
      <div className="divide-y divide-dark/10 overflow-hidden rounded-lg border border-dark/10 bg-white shadow-sm empty:hidden sm:space-y-4 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
        {myReviews.map(review => (
          <article
            key={review.id}
            className="px-3 py-2.5 sm:rounded-2xl sm:border sm:border-dark/10 sm:bg-white sm:p-5 sm:shadow-sm"
          >
            {/* লাইন ১: শিরোনাম · স্ট্যাটাস · অ্যাকশন */}
            <div className="flex items-center gap-2 sm:items-start sm:gap-3">
              <span
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cream text-lg text-dark-muted sm:flex"
                aria-hidden="true"
              >
                <FiBook />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="truncate font-heading text-sm font-semibold text-dark sm:text-base">
                  {review.book?.title ?? 'বই'}
                </h2>
                {/* ডেস্কটপে স্টার শিরোনামের নিচে */}
                <div className="mt-1 hidden sm:block">
                  <StarRating value={review.rating} />
                </div>
              </div>

              <span className="shrink-0 whitespace-nowrap [&>*]:px-2 [&>*]:py-0.5 [&>*]:text-[10px] sm:[&>*]:px-2.5 sm:[&>*]:py-1 sm:[&>*]:text-xs">
                <StatusBadge status={review.status} />
              </span>

              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                {review.status === 'rejected' && (
                  <IconLink
                    to={`${getBookPath(review.bookId, books)}#reviews`}
                    label="সংশোধন করে আবার জমা দিন"
                    tone="primary"
                  >
                    <FiRotateCcw />
                  </IconLink>
                )}
                {/* মোবাইলে জায়গা বাঁচাতে "দেখুন" লুকানো */}
                <IconLink
                  to={`${getBookPath(review.bookId, books)}#reviews`}
                  label="রিভিউ দেখুন"
                  className="hidden sm:flex"
                >
                  <FiEye />
                </IconLink>
                <IconLink
                  to={`${getBookPath(review.bookId, books)}#reviews`}
                  label="রিভিউ এডিট করুন"
                >
                  <FiEdit2 />
                </IconLink>
                {can('review:delete-own') && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(review)}
                    aria-label="রিভিউ ডিলিট করুন"
                    title="ডিলিট"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-white text-[13px] text-red-600 transition hover:bg-red-50 sm:h-9 sm:w-9 sm:text-base"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>

            {/* লাইন ২ (মোবাইল): স্টার · রিভিউয়ের শিরোনাম */}
            <div className="mt-1 flex items-center gap-2 sm:hidden">
              <span
                className="shrink-0 origin-left scale-[0.8]"
                style={{ marginRight: '-0.9rem' }}
              >
                <StarRating value={review.rating} />
              </span>
              {review.title && (
                <h3 className="min-w-0 flex-1 truncate pl-1 text-xs font-semibold text-dark">
                  {review.title}
                </h3>
              )}
            </div>

            {/* ডেস্কটপ: শিরোনাম */}
            {review.title && (
              <h3 className="mt-4 hidden text-sm text-dark sm:block">
                {review.title}
              </h3>
            )}

            {/* লাইন ৩: লেখা (মোবাইলে ১ লাইন) */}
            <p className="mt-0.5 truncate text-xs text-dark-muted sm:mt-1 sm:whitespace-normal sm:text-base sm:leading-7">
              {review.comment}
            </p>

            {review.moderatorNote && review.status === 'rejected' && (
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-[11px] text-rose-700 sm:mt-3 sm:items-start sm:px-3 sm:py-2 sm:text-sm">
                <FiAlertCircle
                  className="shrink-0 text-sm"
                  aria-hidden="true"
                />
                <span className="truncate sm:whitespace-normal">
                  {review.moderatorNote}
                </span>
              </p>
            )}
          </article>
        ))}
      </div>

      {myReviews.length === 0 && (
        <div className="rounded-lg border border-dashed border-dark/20 bg-white px-4 py-8 text-center sm:rounded-2xl sm:py-16">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cream text-base text-dark-muted sm:h-12 sm:w-12 sm:text-xl">
            <FiSearch aria-hidden="true" />
          </span>
          <p className="mt-2.5 text-sm font-semibold text-dark sm:mt-4 sm:text-base">
            {ownReviews.length
              ? 'কোনো রিভিউ পাওয়া যায়নি'
              : 'আপনার কোনো রিভিউ নেই'}
          </p>
          <p className="mt-0.5 text-xs text-dark-muted sm:mt-1 sm:text-sm">
            {ownReviews.length
              ? 'অন্য শব্দ বা অন্য স্ট্যাটাস দিয়ে খুঁজুন।'
              : 'কোনো বইয়ের পেজে গিয়ে প্রথম রিভিউ লিখুন।'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="রিভিউ মুছে ফেলবেন?"
        message="এই কাজটি পরে ফিরিয়ে আনা যাবে না।"
        confirmLabel="ডিলিট"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function IconLink({
  to,
  label,
  tone = 'default',
  className = 'flex',
  children,
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary bg-primary text-dark hover:bg-primary-hover'
      : 'border-dark/15 bg-white text-dark hover:bg-cream';
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`${className} h-7 w-7 items-center justify-center rounded-md border text-[13px] transition sm:h-9 sm:w-9 sm:text-base ${toneClass}`}
    >
      {children}
    </Link>
  );
}

export default MyReviews;
