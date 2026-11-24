import { useMemo, useState } from 'react';
import {
  FiBookOpen,
  FiFlag,
  FiMessageSquare,
  FiSearch,
  FiStar,
  FiThumbsUp,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHeader from '../../../components/dashboard/PageHeader';
import StarRating from '../../../components/reviews/StarRating';
import { useAuth } from '../../../context/useAuth';
import { useData } from '../../../context/useData';
import { PERMISSIONS } from '../../../utils/roles';

const formatDate = dateStr =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

function BookReviews() {
  const { currentUser, can } = useAuth();
  const { books, reviews, reportReview } = useData();
  const [bookFilter, setBookFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [query, setQuery] = useState('');

  const ownBooks = useMemo(
    () =>
      books.filter(book => String(book.authorId) === String(currentUser.id)),
    [books, currentUser.id],
  );

  const ownBookMap = useMemo(
    () => new Map(ownBooks.map(book => [String(book.id), book])),
    [ownBooks],
  );

  const allOwnReviews = useMemo(
    () =>
      reviews.filter(
        review =>
          review.status === 'approved' && ownBookMap.has(String(review.bookId)),
      ),
    [reviews, ownBookMap],
  );

  const filteredReviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOwnReviews.filter(review => {
      const matchesBook =
        !bookFilter || String(review.bookId) === String(bookFilter);
      const matchesRating =
        !ratingFilter || String(review.rating) === String(ratingFilter);
      const matchesQuery =
        !q ||
        `${review.userName} ${review.title || ''} ${review.comment || ''}`
          .toLowerCase()
          .includes(q);
      return matchesBook && matchesRating && matchesQuery;
    });
  }, [allOwnReviews, bookFilter, ratingFilter, query]);

  /* ---------- Rating Metrics & Breakdown ---------- */
  const metrics = useMemo(() => {
    const total = allOwnReviews.length;
    const sum = allOwnReviews.reduce(
      (acc, r) => acc + Number(r.rating || 0),
      0,
    );
    const average = total ? sum / total : 0;
    const positiveCount = allOwnReviews.filter(
      r => Number(r.rating) >= 4,
    ).length;
    const positiveRate = total ? Math.round((positiveCount / total) * 100) : 0;

    const breakdown = [5, 4, 3, 2, 1].map(star => {
      const count = allOwnReviews.filter(r => Number(r.rating) === star).length;
      const percent = total ? Math.round((count / total) * 100) : 0;
      return { star, count, percent };
    });

    return { total, average, positiveRate, breakdown };
  }, [allOwnReviews]);

  const handleReport = review => {
    if (!can(PERMISSIONS.REVIEW_REPORT)) {
      return toast.error('You do not have permission to report reviews.');
    }
    const result = reportReview(
      review.id,
      currentUser.id,
      'Author report',
      currentUser,
    );
    toast[result.success ? 'success' : 'error'](
      result.success
        ? 'Review has been flagged for moderator review.'
        : result.message,
    );
  };

  const resetFilters = () => {
    setBookFilter('');
    setRatingFilter('');
    setQuery('');
  };

  const hasActiveFilters = Boolean(bookFilter || ratingFilter || query);

  return (
    <div className="space-y-6 text-xs text-dark sm:text-[13px]">
      <PageHeader
        title="Book Reviews"
        description="Monitor verified reader feedback, ratings, and sentiment across your published catalog."
      />

      {/* ---------- Overview & Rating Distribution ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Average Rating Card */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Average Rating
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-base text-amber-500 ring-1 ring-inset ring-amber-500/20">
              <FiStar className="fill-current" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="font-heading text-3xl font-bold tracking-tight text-dark tabular-nums sm:text-4xl">
              {metrics.average ? metrics.average.toFixed(1) : 'New'}
            </span>
            {metrics.average > 0 && (
              <span className="text-xs font-medium text-slate-400">
                out of 5.0
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <StarRating value={metrics.average} size="text-sm" />
            <span className="text-[11px] text-slate-400 tabular-nums">
              ({metrics.total.toLocaleString('en-US')} verified)
            </span>
          </div>
        </div>

        {/* Total Reviews & Positive Sentiment Card */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Approved Reviews
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-base text-dark">
              <FiMessageSquare />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold tracking-tight text-dark tabular-nums sm:text-4xl">
              {metrics.total.toLocaleString('en-US')}
            </span>
            {metrics.total > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 tabular-nums">
                <FiThumbsUp className="text-[10px]" />
                {metrics.positiveRate}% Positive
              </span>
            )}
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400">
            Across {ownBooks.length.toLocaleString('en-US')}{' '}
            {ownBooks.length === 1 ? 'book' : 'books'} in your catalog
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Rating Distribution
            </span>
            {ratingFilter && (
              <button
                type="button"
                onClick={() => setRatingFilter('')}
                className="text-[11px] font-semibold text-primary-hover hover:underline"
              >
                Clear ({ratingFilter}★)
              </button>
            )}
          </div>
          <div className="space-y-2 tabular-nums">
            {metrics.breakdown.map(({ star, count, percent }) => {
              const isSelected = String(ratingFilter) === String(star);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRatingFilter(isSelected ? '' : String(star))
                  }
                  className={`group flex w-full items-center gap-2.5 rounded-md px-1.5 py-0.5 text-left transition ${
                    isSelected ? 'bg-amber-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="flex w-8 shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-600">
                    {star}
                    <FiStar className="text-[10px] text-amber-400 fill-current" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300 group-hover:bg-amber-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[11px] font-medium text-slate-500">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Filter & Search Toolbar ---------- */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="grid gap-2.5 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by reviewer name, headline, or comment..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 sm:text-[13px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <FiX />
              </button>
            )}
          </div>

          <select
            value={bookFilter}
            onChange={event => setBookFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">All Books ({ownBooks.length})</option>
            {ownBooks.map(book => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={event => setRatingFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(rating => (
              <option key={rating} value={rating}>
                {rating} {rating === 1 ? 'Star' : 'Stars'}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-dark"
            >
              <FiX /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ---------- Reviews Feed ---------- */}
      <div className="space-y-3.5">
        {filteredReviews.map(review => {
          const book = ownBookMap.get(String(review.bookId));
          const initial = (review.userName || 'R').charAt(0).toUpperCase();
          const formattedDate = formatDate(review.createdAt || review.date);

          return (
            <article
              key={review.id}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Reviewer Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 font-heading text-sm font-bold text-dark">
                    {initial}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-dark">
                        {review.userName}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Verified Reader
                      </span>
                      {formattedDate && (
                        <span className="text-[11px] text-slate-400">
                          · {formattedDate}
                        </span>
                      )}
                    </div>
                    {book && (
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-slate-100/80 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <FiBookOpen className="text-slate-400" />
                        {book.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 px-2.5 py-1">
                  <StarRating value={review.rating} size="text-xs" />
                  <span className="text-xs font-bold text-amber-700 tabular-nums">
                    {Number(review.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              {review.title && (
                <h3 className="mt-3.5 text-sm font-semibold text-dark">
                  {review.title}
                </h3>
              )}

              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                {review.comment}
              </p>

              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleReport(review)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <FiFlag className="text-xs" />
                  <span>Report to Moderator</span>
                </button>
              </div>
            </article>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
              <FiMessageSquare />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">
                No reviews found
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {hasActiveFilters
                  ? 'No reviews match your current filter criteria.'
                  : 'Your books do not have any approved reader reviews yet.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookReviews;
