import { Link } from 'react-router-dom'
import StarRating from './StarRating'

function RatingSummary({ stats, selectedRating, onSelectRating, canWriteReview, hasOwnReview, isAuthenticated, onWriteReview }) {
  return (
    <div className=" ">
      <div className="grid items-center gap-6 md:grid-cols-[12rem_minmax(9rem,0.7fr)_minmax(18rem,1.3fr)]">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="text-sm text-dark-muted">এই পণ্যের রেটিং দিন</p>
          {isAuthenticated && hasOwnReview ? (
            <p className="mt-4 text-sm text-dark-muted">আপনার রিভিউ ইতিমধ্যে আছে</p>
          ) : isAuthenticated && canWriteReview ? (
            <button type="button" onClick={onWriteReview} className="mt-2 rounded-md border border-dark px-5 py-2text-sm font-semibold text-dark transition hover:bg-dark hover:text-white">
              রিভিউ লিখুন
            </button>
          ) : isAuthenticated ? (
            <p className="mt-2 text-sm text-dark-muted">লেখক নিজের বইয়ে রিভিউ দিতে পারবেন না</p>
          ) : (
            <Link to="/login" className="mt-4 inline-flex rounded-md border border-dark px-5 py-2 text-sm font-semibold text-dark transition hover:bg-dark hover:text-white">
              রিভিউ লিখতে লগইন করুন
            </Link>
          )}
        </div>
        <div className="order-1 border-b border-dark/10 pb-4 text-center md:order-2 md:border-b-0 md:border-l md:border-r md:pb-0">
          <p className="font-heading text-3xl font-bold leading-none text-dark">
            {stats.total ? stats.average.toFixed(2) : 'নতুন'}
          </p>
          {stats.total > 0 && <StarRating value={stats.average} size="text-base" />}
          <p className="mt-2 text-sm text-dark-muted">{stats.total}টি রিভিউ</p>
        </div>
        <div className="order-3 space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.distribution[rating] ?? 0
            const percentage = stats.total ? (count / stats.total) * 100 : 0
            return (
              <button
                type="button"
                key={rating}
                onClick={() => onSelectRating(selectedRating === rating ? 0 : rating)}
                className={`flex w-full items-center gap-3 rounded-md px-1 py-0.5 text-left transition hover:bg-cream ${selectedRating === rating ? 'bg-cream' : ''}`}
                aria-label={`${rating} স্টারের রিভিউ দেখুন`}
              >
                <span className="w-5 shrink-0 text-xs text-dark">{rating}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-dark/10">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </span>
                <span className="w-7 text-right text-sm text-dark-muted">{count}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RatingSummary
