import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import { useData } from '../../context/useData';
import { motion } from 'framer-motion';
import StarRating from '../reviews/StarRating';
import useFormat from '../../hooks/useFormat';

const styles = {
  default: {
    badge: 'left-3 top-3 px-3 py-1 text-xs',
    wish: 'right-3 top-3 p-2 text-lg',
    body: 'p-4',
    title: 'text-lg',
    author: 'mt-1 text-sm',
    rating: 'mt-2 flex text-sm',
    footer: 'pt-4',
    price: 'text-xl',
    cart: 'gap-2 px-3 py-2 text-sm',
    cartLabel: '',
  },
  compact: {
    badge:
      'left-1.5 top-1.5 px-1.5 py-0.5 text-[10px] sm:left-2 sm:top-2 sm:px-2 sm:text-xs',
    wish: 'right-1.5 top-1.5 p-1.5 text-sm sm:right-2 sm:top-2 sm:p-2 sm:text-base',
    body: 'p-2 sm:p-3',
    title: 'text-xs sm:text-sm',
    author: 'mt-0.5 text-[11px] sm:text-xs',
    rating: 'mt-1 hidden text-xs sm:flex',
    footer: 'pt-2 sm:pt-3',
    price: 'text-sm sm:text-base',
    cart: 'p-2 text-sm sm:p-2.5',
    cartLabel: 'hidden',
  },
};

function BookCard({ book, compact = false }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getBookRatingStats } = useData();
  const { formatCurrency } = useFormat();
  const ratingStats = getBookRatingStats(book.id);
  const outOfStock = Number(book.stock ?? 0) <= 0;
  const wished = isInWishlist(book.id);
  const s = compact ? styles.compact : styles.default;

  const handleCart = () => {
    const result = addToCart(book);
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

  return (
    <motion.article
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-gray">
        <img
          src={book.cover}
          alt={book.title?.bn || book.title}
          width="400"
          height="533"
          loading="lazy"
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
            outOfStock ? 'opacity-60 grayscale' : ''
          }`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />

        {outOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-dark/80 px-3 py-1 text-xs font-medium text-white">
            স্টকে নেই
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wished ? 'উইশলিস্ট থেকে সরান' : 'উইশলিস্টে যোগ করুন'}
          className={`absolute z-10 rounded-full bg-white/95 shadow-sm transition hover:scale-110 ${s.wish} ${
            wished ? 'text-red-500' : 'text-dark'
          }`}
        >
          <FiHeart className={wished ? 'fill-current' : ''} />
        </button>
      </div>

      <div className={`flex flex-1 flex-col ${s.body}`}>
        <h3
          className={`font-heading text-sm  leading-snug  truncate  ${s.title}`}
        >
          <Link
            to={`/books/${book.id}`}
            className="transition-colors hover:text-primary-hover after:absolute after:inset-0 after:content-['']"
          >
            {book.title?.bn || book.title}
          </Link>
        </h3>
        <p className={`text-dark-muted truncate  ${s.author}`}>
          {book.author?.bn || book.author}
        </p>
        {/* <div className={`items-center gap-2 ${s.rating}`}>
          {ratingStats.total > 0 ? (
            <>
              <StarRating value={ratingStats.average} size="text-sm" />
              <span className="text-dark-muted">({ratingStats.total})</span>
            </>
          ) : (
            <span className="text-dark-muted">নতুন</span>
          )}
        </div> */}

        <div
          className={`mt-auto flex items-center justify-between gap-1 ${s.footer}`}
        >
          <span className={`font-heading font-bold text-dark ${s.price}`}>
            {formatCurrency(book.price)}
          </span>

          <button
            type="button"
            onClick={handleCart}
            disabled={outOfStock}
            aria-label={outOfStock ? 'স্টকে নেই' : 'কার্টে যোগ করুন'}
            className={`relative z-10 inline-flex shrink-0 items-center rounded-lg bg-primary font-semibold text-dark transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-dark/10 disabled:text-dark-muted disabled:hover:scale-100 ${s.cart}`}
          >
            <FiShoppingCart />
            <span className={s.cartLabel}>কার্টে নিন</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default BookCard;
