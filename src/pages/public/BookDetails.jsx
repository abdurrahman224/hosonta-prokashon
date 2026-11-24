import { useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiBookOpen,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShare2,
  FiShoppingBag,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import BookRow from '../../components/books/BookRow';
import books from '../../data/books';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import { useData } from '../../context/useData';
import { useAuth } from '../../context/useAuth';
import RatingSummary from '../../components/reviews/RatingSummary';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList, {
  ReviewListSkeleton,
} from '../../components/reviews/ReviewList';
import StarRating from '../../components/reviews/StarRating';
import useFormat from '../../hooks/useFormat';

const bookMetadata = {
  1: { isbn: '978-984-9851-01-1', pages: '১২৮' },
  2: { isbn: '978-984-9851-02-8', pages: '২৪০' },
  3: { isbn: '978-984-9851-03-5', pages: '১৬০' },
  4: { isbn: '978-984-9851-04-2', pages: '১৯২' },
  5: { isbn: '978-984-9851-05-9', pages: '২২৪' },
  6: { isbn: '978-984-9851-06-6', pages: '২৮৮' },
  7: { isbn: '978-984-9851-07-3', pages: '১৪৪' },
  8: { isbn: '978-984-9851-08-0', pages: '১১২' },
  9: { isbn: '978-984-9851-09-7', pages: '৩২০' },
  12: { isbn: '978-984-9851-12-7', pages: '১৭৬' },
};

function BookDetails() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const { books: stockedBooks, reviews, getBookRatingStats } = useData();
  const { currentUser, can } = useAuth();
  const { addToCart } = useCart();
  const { formatCurrency, formatNumber } = useFormat();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const book = books.find(
    item => String(item.id) === id && item.status === 'published',
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReviewLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, [id]);

  if (!book) {
    return <BookNotFound />;
  }

  const ratingStats = getBookRatingStats(book.id);
  const ownReview = reviews.find(
    review =>
      String(review.bookId) === String(book.id) &&
      review.userId === currentUser?.id,
  );
  const canWriteReview = Boolean(
    currentUser &&
    can('review:write') &&
    String(book.authorId) !== String(currentUser.id),
  );

  const metadata = bookMetadata[book.id] ?? {
    isbn: '978-984-9851-00-4',
    pages: '১৬০',
  };
  const stockedBook =
    stockedBooks.find(item => String(item.id) === String(book.id)) ?? book;
  const outOfStock = Number(stockedBook.stock ?? 0) <= 0;
  const authorBooks = books
    .filter(
      item =>
        item.authorId === book.authorId &&
        item.id !== book.id &&
        item.status === 'published',
    )
    .slice(0, 6);
  const relatedBooks = books
    .filter(
      item =>
        item.categoryId === book.categoryId &&
        item.id !== book.id &&
        item.status === 'published',
    )
    .slice(0, 6);

  const handleCart = () => {
    const result = addToCart(stockedBook, quantity);
    if (result.success) toast.success('কার্টে যোগ হয়েছে।');
    else toast.error(result.message);
  };

  const handleWishlist = () => {
    const result = toggleWishlist(book.id);
    if (!result.success) toast.error(result.message);
    else
      toast.success(
        result.added ? 'উইশলিস্টে যোগ হয়েছে।' : 'উইশলিস্ট থেকে সরানো হয়েছে।',
      );
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = book.title?.bn || book.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        return;
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('লিংক কপি হয়েছে।');
    } catch {
      toast.error('লিংক কপি করা যায়নি।');
    }
  };

  return (
    <div className="bg-cream">
      <main className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-12">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-dark-muted"
          aria-label="ব্রেডক্রাম্ব"
        >
          <Link to="/" className="transition hover:text-primary-hover">
            হোম
          </Link>
          <span>/</span>
          <Link to="/books" className="transition hover:text-primary-hover">
            বই
          </Link>
          <span>/</span>
          <span className="max-w-[14rem] truncate text-dark">
            {book.title?.bn || book.title}
          </span>
        </nav>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-6">
          <div className="mx-auto w-full max-w-md">
            <div className="h-full  w-full overflow-hidden rounded-md bg-dark-gray shadow-xl">
              <img
                src={book.cover}
                alt={book.title?.bn || book.title}
                className=" h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="font-heading text-base font-bold leading-tight text-dark md:text-xl">
              {book.title?.bn || book.title}
            </h1>
            <p className="mt-1 text-sm text-dark-muted">
              লেখক:{' '}
              <Link
                to={`/authors/${book.authorId}`}
                className="font-semibold text-sm text-dark  transition hover:text-primary-hover"
              >
                {book.author?.bn || book.author}
              </Link>
            </p>
            <span className="mt-2 w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-dark">
              {book.category?.bn || book.category}
            </span>

            <div className="mt-3 flex flex-wrap items-center gap-3 ">
              {ratingStats.total > 0 ? (
                <>
                  <span className="font-heading text-xl font-bold text-dark">
                    {formatNumber(ratingStats.average.toFixed(1))}
                  </span>
                  <StarRating value={ratingStats.average} />
                  <span className="text-sm text-dark-muted">
                    ({ratingStats.total}টি রিভিউ)
                  </span>
                </>
              ) : (
                <span className="text-sm text-dark-muted">
                  এখনো কোনো রেটিং নেই
                </span>
              )}
            </div>

            <dl className="mt-2 grid max-w-xl grid-cols-2 gap-4 border-y border-dark/10 py-2 sm:grid-cols-3">
              <BookMeta label="প্রকাশের বছর" value={book.publishedYear} />
              {/* <BookMeta label="ISBN" value={metadata.isbn} /> */}
              <BookMeta
                label="পৃষ্ঠা সংখ্যা"
                value={`${metadata.pages} পৃষ্ঠা`}
              />
            </dl>

            <p className="mt-2 font-heading text-2xl font-bold text-primary-hover">
              {formatCurrency(book.price)}
            </p>
            <p className=" max-w-2xl text-sm leading-8 text-dark-muted">
              {book.description?.bn || book.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="hidden md:flex items-center rounded-md border border-dark/10 bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(value => value - 1)}
                  className="p-3 text-dark disabled:opacity-30"
                  aria-label="সংখ্যা কমান"
                >
                  <FiMinus />
                </button>
                <span className="min-w-10 text-center font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={outOfStock || quantity >= stockedBook.stock}
                  onClick={() => setQuantity(value => value + 1)}
                  className="p-3 text-dark disabled:opacity-30"
                  aria-label="সংখ্যা বাড়ান"
                >
                  <FiPlus />
                </button>
              </div>
              <button
                type="button"
                onClick={handleCart}
                disabled={outOfStock}
                className="inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3.5 font-semibold text-white transition hover:bg-dark-gray disabled:cursor-not-allowed disabled:bg-dark/30"
              >
                <FiShoppingBag /> {outOfStock ? 'স্টকে নেই' : 'কার্টে যোগ করুন'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-md border border-dark/10 p-3 text-dark transition hover:scale-105"
                aria-label="শেয়ার করুন"
              >
                <FiShare2 />
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                className={`rounded-md border p-3 transition hover:scale-105 ${isInWishlist(book.id) ? 'border-red-200 text-red-500' : 'border-dark/10 text-dark'}`}
                aria-label="উইশলিস্টে যোগ করুন"
              >
                <FiHeart
                  className={isInWishlist(book.id) ? 'fill-current' : ''}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="  pt-6" id="reviews">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-xl font-bold text-dark">
              পাঠকের রিভিউ
            </h2>
            {ownReview?.status === 'pending' && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                আপনার রিভিউ অপেক্ষমাণ
              </span>
            )}
          </div>
          <div className="mt-2">
            <RatingSummary
              stats={ratingStats}
              selectedRating={selectedRating}
              onSelectRating={setSelectedRating}
              canWriteReview={canWriteReview}
              hasOwnReview={Boolean(ownReview)}
              isAuthenticated={Boolean(currentUser)}
              onWriteReview={() => setIsReviewFormOpen(true)}
            />
            {ownReview?.status === 'pending' && !isReviewFormOpen && (
              <p className="mt-4 text-sm text-dark-muted">
                আপনার রিভিউ অনুমোদনের অপেক্ষায় আছে।
              </p>
            )}
            <div className="mt-8">
              {isReviewLoading ? (
                <ReviewListSkeleton />
              ) : (
                <ReviewList
                  key={selectedRating}
                  bookId={book.id}
                  initialRating={selectedRating}
                  onEdit={review => {
                    setEditingReview(review);
                    setIsReviewFormOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-dark/10 pt-5">
          <div className="flex items-center gap-3">
            <FiBookOpen className="text-xl text-primary-hover" />
            <h2 className="font-heading text-base font-semibold text-slate-950 md:text-xl">
              একই লেখকের আরও বই
            </h2>
          </div>
          {authorBooks.length > 0 ? (
            <BookRow items={authorBooks} />
          ) : (
            <p className="mt-2 text-dark-muted">
              এই লেখকের অন্য কোনো বই এখনো নেই।
            </p>
          )}
        </section>

        {relatedBooks.length > 0 && (
          <section className="mt-4 border-t border-dark/10 pt-4">
            <h2 className="font-heading text-base font-semibold text-slate-950 md:text-xl">
              সম্পর্কিত বই
            </h2>
            <BookRow items={relatedBooks} />
          </section>
        )}
      </main>
      {isReviewFormOpen && (canWriteReview || editingReview) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setEditingReview(null);
              setIsReviewFormOpen(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark/10 px-5 py-4">
              <h2
                id="review-modal-title"
                className="font-heading text-2xl font-bold text-dark"
              >
                {editingReview ? 'রিভিউ সম্পাদনা করুন' : 'আপনার রিভিউ লিখুন'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setIsReviewFormOpen(false);
                }}
                className="rounded-md p-2 text-dark-muted hover:bg-dark/5"
                aria-label="মডাল বন্ধ করুন"
              >
                <FiX />
              </button>
            </div>
            <ReviewForm
              key={editingReview?.id ?? 'new-review'}
              bookId={book.id}
              review={editingReview}
              onCancel={() => {
                setEditingReview(null);
                setIsReviewFormOpen(false);
              }}
              onSubmitted={() => {
                setEditingReview(null);
                setIsReviewFormOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}



function BookMeta({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-dark-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-dark">{value}</dd>
    </div>
  );
}

function BookNotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 py-20 text-center">
      <div>
        <FiBookOpen className="mx-auto text-5xl text-primary-hover" />
        <h1 className="mt-5 font-heading text-4xl font-bold text-dark">
          বই পাওয়া যায়নি
        </h1>
        <p className="mt-3 text-lg text-dark-muted">
          বইটির লিংকটি সঠিক নয় অথবা বইটি আর প্রকাশিত নেই।
        </p>
        <Link
          to="/books"
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3 font-semibold text-white transition hover:bg-dark-gray"
        >
          <FiArrowLeft /> বইয়ের তালিকায় ফিরুন
        </Link>
      </div>
    </main>
  );
}

export default BookDetails;
