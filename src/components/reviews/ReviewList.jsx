import { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import ReviewCard from './ReviewCard';
import { useAuth } from '../../context/useAuth';
import useData from '../../context/useData';
import Skeleton from '../common/Skeleton';

function ReviewList({ bookId, initialRating = 0, onEdit }) {
  const { reviews } = useData();
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState(initialRating);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('new');
  const [visibleCount, setVisibleCount] = useState(5);

  const filteredReviews = useMemo(() => {
    const result = reviews.filter(review => {
      const visible =
        review.status === 'approved' || review.userId === currentUser?.id;
      const matchesBook = String(review.bookId) === String(bookId);
      const matchesQuery =
        !query ||
        `${review.title} ${review.comment}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return (
        visible &&
        matchesBook &&
        matchesQuery &&
        (!rating || review.rating === rating) &&
        (!verifiedOnly || review.verifiedPurchase)
      );
    });
    return result.sort((first, second) => {
      if (sort === 'old')
        return new Date(first.createdAt) - new Date(second.createdAt);
      if (sort === 'helpful') return second.helpfulCount - first.helpfulCount;
      if (sort === 'high') return second.rating - first.rating;
      if (sort === 'low') return first.rating - second.rating;
      return new Date(second.createdAt) - new Date(first.createdAt);
    });
  }, [bookId, currentUser?.id, query, rating, reviews, sort, verifiedOnly]);

  return (
    <div>
      {/* <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-2 rounded-md border border-dark/10 bg-white px-3 text-dark-muted">
          <FiSearch />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(5) }} placeholder="রিভিউ খুঁজুন..." className="w-full bg-transparent py-3 text-dark outline-none" />
        </label>
        <select value={rating} onChange={(event) => { setRating(Number(event.target.value)); setVisibleCount(5) }} className="rounded-md border border-dark/10 bg-white px-3 py-3 text-dark">
          <option value="0">সব রেটিং</option>
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} স্টার</option>)}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border border-dark/10 bg-white px-3 py-3 text-dark">
          <option value="new">নতুন</option><option value="old">পুরনো</option><option value="helpful">সবচেয়ে সহায়ক</option><option value="high">বেশি রেটিং</option><option value="low">কম রেটিং</option>
        </select>
      </div> */}
      {/* <label className="mt-3 inline-flex items-center gap-2 text-sm text-dark-muted">
        <input type="checkbox" checked={verifiedOnly} onChange={(event) => { setVerifiedOnly(event.target.checked); setVisibleCount(5) }} className="accent-primary" />
        শুধু যাচাইকৃত ক্রেতা
      </label> */}
      <div className="mt-6 space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark/20 bg-white px-6 py-12 text-center text-dark-muted">
            কোনো রিভিউ পাওয়া যায়নি। প্রথম রিভিউটি আপনি লিখুন।
          </div>
        ) : (
          filteredReviews
            .slice(0, visibleCount)
            .map(review => (
              <ReviewCard key={review.id} review={review} onEdit={onEdit} />
            ))
        )}
      </div>
      {visibleCount < filteredReviews.length && (
        <button
          type="button"
          onClick={() => setVisibleCount(value => value + 5)}
          className="mt-6 rounded-md border border-dark/10 bg-white px-5 py-3 font-semibold text-dark hover:border-primary"
        >
          আরও দেখুন
        </button>
      )}
    </div>
  );
}

export function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default ReviewList;
