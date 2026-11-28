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
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import BookRow from '../../components/books/BookRow';
import books from '../../data/books';
import authors from '../../data/authors';
import { findBookBySlugOrId, getBookPath } from '../../utils/bookSlug';
import { getAuthorPath } from '../../utils/authorSlug';
import {
  bookHasCategory,
  getBookCategories,
  getBookPricing,
} from '../../utils/bookHelpers';
import BookPdfModal from '../../components/books/BookPdfModal';
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

const TYPING_PROMPT = 'বইটি একটু পড়ুন';

function TypingReadPrompt({ onClick }) {
  const [charCount, setCharCount] = useState(TYPING_PROMPT.length);

  useEffect(() => {
    let index = 0;
    let pausing = false;
    const interval = window.setInterval(() => {
      if (pausing) return;
      index += 1;
      if (index > TYPING_PROMPT.length) {
        pausing = true;
        window.setTimeout(() => {
          index = 0;
          pausing = false;
          setCharCount(0);
        }, 1600);
        return;
      }
      setCharCount(index);
    }, 95);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-white px-3.5 py-2 text-xs font-bold text-dark shadow-2xs transition hover:border-primary hover:bg-primary/15 sm:text-sm"
    >
      <FiBookOpen className="shrink-0 text-primary-hover" />
      <span className="min-h-[1.25rem]">
        {TYPING_PROMPT.slice(0, charCount)}
        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-primary-hover align-middle" />
      </span>
    </button>
  );
}

function BookDetails() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(
    () => new URLSearchParams(location.search).get('read') === '1',
  );
  const { books: stockedBooks, reviews, getBookRatingStats } = useData();
  const { currentUser, can } = useAuth();
  const { addToCart } = useCart();
  const { formatCurrency, formatNumber } = useFormat();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const catalogBooks = stockedBooks.length ? stockedBooks : books;
  const publishedBooks = catalogBooks.filter(item => item.status === 'published');
  const book = findBookBySlugOrId(slug, publishedBooks);
  const canonicalPath = book ? getBookPath(book, catalogBooks) : '';

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReviewLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (
      book &&
      slug &&
      String(book.id) === slug &&
      canonicalPath !== `/books/${slug}`
    ) {
      navigate(`${canonicalPath}${location.hash || ''}`, { replace: true });
    }
  }, [book, slug, canonicalPath, location.hash, navigate]);

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
  const bookCategories = getBookCategories(stockedBook);
  const { originalPrice, sellingPrice, discountPercent, hasDiscount } =
    getBookPricing(stockedBook);
  const relatedBooks = books
    .filter(
      item =>
        item.id !== book.id &&
        item.status === 'published' &&
        bookCategories.some(cat => bookHasCategory(item, cat)),
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
      <main className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-dark-muted sm:gap-2 sm:text-sm"
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
          <span className="max-w-[13rem] truncate font-medium text-dark sm:max-w-[18rem]">
            {book.title?.bn || book.title}
          </span>
        </nav>

        <section className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-8">
          <div className="mx-auto w-full max-w-[230px] sm:max-w-[270px] lg:max-w-[310px]">
            <TypingReadPrompt onClick={() => setIsPdfOpen(true)} />
            <div
              onClick={() => setIsPdfOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsPdfOpen(true);
                }
              }}
              aria-label="বইটি একটু পড়ুন প্রিভিউ খুলুন"
              className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg border border-dark/10 bg-dark-gray shadow-lg"
            >
              <img
                src={book.cover}
                alt={book.title?.bn || book.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {hasDiscount && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md sm:px-3 sm:text-xs">
                  {formatNumber(discountPercent)}% ডিসকাউন্ট
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="font-heading text-lg font-bold leading-snug text-dark sm:text-xl md:text-2xl">
              {book.title?.bn || book.title}
            </h1>
            <p className="mt-1 text-xs text-dark-muted sm:text-sm">
              লেখক:{' '}
              <Link
                to={getAuthorPath({ id: book.authorId, name: book.author?.bn || book.author }, authors)}
                className="font-semibold text-dark transition hover:text-primary-hover"
              >
                {book.author?.bn || book.author}
              </Link>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {bookCategories.map(cat => (
                <Link
                  key={cat}
                  to={`/categories/${encodeURIComponent(cat)}`}
                  className="w-fit rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-dark transition hover:border-primary hover:bg-primary"
                >
                  {cat}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {ratingStats.total > 0 ? (
                <>
                  <span className="font-heading text-base font-bold text-dark sm:text-lg">
                    {formatNumber(ratingStats.average.toFixed(1))}
                  </span>
                  <StarRating value={ratingStats.average} />
                  <span className="text-xs text-dark-muted sm:text-sm">
                    ({ratingStats.total}টি রিভিউ)
                  </span>
                </>
              ) : (
                <span className="text-xs text-dark-muted sm:text-sm">
                  এখনো কোনো রেটিং নেই
                </span>
              )}
            </div>

            <dl className="mt-3 grid max-w-md grid-cols-2 gap-4 border-y border-dark/10 py-2.5">
              <BookMeta label="প্রকাশের বছর" value={book.publishedYear} />
              {/* <BookMeta label="ISBN" value={metadata.isbn} /> */}
              <BookMeta
                label="পৃষ্ঠা সংখ্যা"
                value={`${metadata.pages} পৃষ্ঠা`}
              />
            </dl>

            <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
              <p className="font-heading text-xl font-bold text-dark sm:text-2xl">
                {formatCurrency(sellingPrice)}
              </p>
              {hasDiscount && (
                <>
                  <span className="text-sm font-medium text-dark-muted line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                  <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {formatNumber(discountPercent)}% ডিসকাউন্ট
                  </span>
                </>
              )}
            </div>
            <p className="mt-2.5 max-w-2xl text-[13.5px] leading-7 text-dark-muted sm:text-sm">
              {book.description?.bn || book.description}
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center justify-between gap-2 sm:contents">
                <div className="flex items-center rounded-lg border border-dark/15 bg-white">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(value => value - 1)}
                    className="flex h-10 w-9 items-center justify-center text-dark disabled:opacity-30 sm:h-11 sm:w-10"
                    aria-label="সংখ্যা কমান"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={outOfStock || quantity >= stockedBook.stock}
                    onClick={() => setQuantity(value => value + 1)}
                    className="flex h-10 w-9 items-center justify-center text-dark disabled:opacity-30 sm:h-11 sm:w-10"
                    aria-label="সংখ্যা বাড়ান"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:order-4">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-dark/15 bg-white text-dark transition hover:border-primary hover:bg-primary/10 sm:h-11 sm:w-11"
                    aria-label="শেয়ার করুন"
                  >
                    <FiShare2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleWishlist}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition hover:border-primary sm:h-11 sm:w-11 ${isInWishlist(book.id) ? 'border-red-200 text-red-500' : 'border-dark/15 text-dark'}`}
                    aria-label="উইশলিস্টে যোগ করুন"
                  >
                    <FiHeart
                      size={15}
                      className={isInWishlist(book.id) ? 'fill-current' : ''}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:order-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={handleCart}
                  disabled={outOfStock}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-dark shadow-xs transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-dark/15 disabled:text-dark-muted sm:px-6 sm:text-sm"
                >
                  <FiShoppingBag /> {outOfStock ? 'স্টকে নেই' : 'কার্টে যোগ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-dark px-4 text-xs font-semibold text-white transition hover:bg-dark-gray sm:px-5 sm:text-sm"
                >
                  <FiBookOpen /> একটু পড়ুন
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6" id="reviews">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-heading text-base font-bold text-dark sm:text-lg">
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
      {isPdfOpen && (
        <BookPdfModal
          book={stockedBook}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </div>
  );
}



function BookMeta({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-dark-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-dark">{value}</dd>
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
