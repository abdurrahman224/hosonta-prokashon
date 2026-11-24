import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiHeart,
  FiLock,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiTrash2,
  FiTruck,
  FiX,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';
import useFormat from '../../hooks/useFormat';

const COUPON_CODE = 'HASANTA10';
const COUPON_RATE = 0.1;
const DELIVERY_FEE = 60;
const LOW_STOCK_LIMIT = 5;
const REMOVE_ANIMATION_MS = 200;

function Cart() {
  const { currentUser } = useAuth();
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist } = useWishlist();
  const { formatCurrency, formatNumber } = useFormat();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);
  const timeouts = useRef([]);

  useEffect(() => {
    const pending = timeouts.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount =
    appliedCoupon === COUPON_CODE ? Math.round(cartTotal * COUPON_RATE) : 0;
  const delivery = cartTotal ? DELIVERY_FEE : 0;
  const total = cartTotal - discount + delivery;

  const animateRemove = (bookId, onDone) => {
    setRemovingIds(prev => [...prev, bookId]);
    const id = setTimeout(() => {
      onDone();
      setRemovingIds(prev => prev.filter(item => item !== bookId));
    }, REMOVE_ANIMATION_MS);
    timeouts.current.push(id);
  };

  const handleRemove = bookId => {
    animateRemove(bookId, () => removeFromCart(bookId));
  };

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() !== COUPON_CODE) {
      setAppliedCoupon('');
      toast.error('অবৈধ কুপন কোড।');
      return;
    }
    setAppliedCoupon(COUPON_CODE);
    setCoupon('');
    toast.success('১০% ছাড় প্রয়োগ করা হয়েছে।');
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    toast.success('কুপন সরানো হয়েছে।');
  };

  const moveToWishlist = bookId => {
    if (!currentUser) {
      toast.error('উইশলিস্টে বই সংরক্ষণ করতে লগইন করুন।');
      return;
    }
    const result = toggleWishlist(bookId);
    if (result.success) {
      animateRemove(bookId, () => removeFromCart(bookId));
      toast.success('উইশলিস্টে যোগ হয়েছে।');
    }
  };

  const changeQuantity = (item, nextQuantity) => {
    const result = updateQuantity(item.book.id, nextQuantity);
    if (result && !result.success && result.message)
      toast.error(result.message);
  };

  if (!items.length) return <EmptyCart />;

  return (
    <main className=" px-3 py-6  sm:px-5 md:px-8 md:py-14 lg:pb-14">
      <div className="mx-auto max-w-5xl">
        {/* <PageHeader
          title="আমার কার্ট"
          description="অর্ডার দেওয়ার আগে আপনার নির্বাচিত বইগুলো পর্যালোচনা করুন।"
        /> */}

        <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.5fr)] lg:gap-8">
          {/* Cart items */}
          <section className="overflow-hidden rounded-2xl border border-dark/5 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-dark/10 px-4 py-3.5 sm:px-6 sm:py-4">
              <h2 className="flex items-center gap-2  text-sm  md:text-base font-semibold text-dark ">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-base">
                  <FiShoppingCart />
                </span>
                কার্টের বই
              </h2>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-dark-muted">
                {formatNumber(itemCount)} টি বই
              </span>
            </div>

            <ul className="divide-y divide-dark/10">
              {items.map(item => (
                <CartItem
                  key={item.book.id}
                  item={item}
                  isRemoving={removingIds.includes(item.book.id)}
                  formatCurrency={formatCurrency}
                  onChangeQuantity={changeQuantity}
                  onWishlist={moveToWishlist}
                  onRemove={handleRemove}
                />
              ))}
            </ul>

            <div className="border-t border-dark/10 bg-cream/60 px-4 py-3.5 sm:px-6">
              <Link
                to="/books"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark transition-colors hover:text-primary-hover"
              >
                <FiArrowLeft /> শপিং চালিয়ে যান
              </Link>
            </div>
          </section>

          {/* Order summary */}
          <aside className="w-full rounded-2xl border border-dark/5 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-dark sm:text-lg">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-base text-dark">
                <FiShoppingBag />
              </span>
              অর্ডার সারসংক্ষেপ
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-dark-muted">
                  সাবটোটাল ({formatNumber(itemCount)} আইটেম)
                </dt>
                <dd className="font-medium text-dark">
                  {formatCurrency(cartTotal)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-dark-muted">
                  <FiTruck className="shrink-0" /> ডেলিভারি (আনুমানিক)
                </dt>
                <dd className="font-medium text-dark">
                  {formatCurrency(delivery)}
                </dd>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50/70 px-2.5 py-1.5 text-emerald-700">
                  <dt className="flex items-center gap-1.5 font-medium">
                    <FiCheckCircle className="shrink-0" /> কুপন ছাড়
                  </dt>
                  <dd className="font-semibold">−{formatCurrency(discount)}</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs leading-5 text-dark-muted">
              <FiTruck className="mt-0.5 shrink-0 text-dark/70" />
              <span>
                ঢাকা শহরের মধ্যে ৬০ টাকা, ঢাকার বাইরে ১২০ টাকা। ঠিকানা দেওয়ার
                পর সঠিক চার্জ হিসাব করা হবে।
              </span>
            </p>

            {/* উন্নত ও রেসপন্সিভ কুপন সেকশন */}
            <div className="mt-5 overflow-hidden rounded-xl border border-dashed border-dark/20 bg-cream/40 transition-colors focus-within:border-primary">
              <button
                type="button"
                onClick={() => setCouponOpen(open => !open)}
                aria-expanded={couponOpen}
                aria-controls="coupon-panel"
                className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left lg:pointer-events-none"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-dark">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 text-dark">
                    <FiTag className="text-xs" />
                  </span>
                  {appliedCoupon ? 'কুপন প্রয়োগ করা হয়েছে' : 'কুপন কোড আছে?'}
                </span>
                <FiChevronDown
                  className={`shrink-0 text-dark-muted transition-transform duration-200 lg:hidden ${
                    couponOpen || appliedCoupon ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                id="coupon-panel"
                className={`${
                  couponOpen || appliedCoupon ? 'block' : 'hidden'
                } px-3.5 pb-3.5 lg:block`}
              >
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm shadow-2xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <FiCheckCircle className="shrink-0 text-emerald-600" />
                      <div className="truncate">
                        <span className="font-bold tracking-wide text-emerald-800">
                          {appliedCoupon}
                        </span>
                        <p className="text-[11px] text-emerald-600">
                          সফলভাবে ছাড় যুক্ত হয়েছে
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="কুপন সরান"
                      title="কুপন সরান"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition-colors hover:bg-emerald-200/60 active:scale-95"
                    >
                      <FiX className="text-base" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        id="coupon"
                        type="text"
                        value={coupon}
                        onChange={event =>
                          setCoupon(event.target.value.toUpperCase())
                        }
                        onKeyDown={event => {
                          if (event.key === 'Enter' && coupon.trim()) {
                            event.preventDefault();
                            applyCoupon();
                          }
                        }}
                        placeholder="কুপন কোড লিখুন"
                        autoCapitalize="characters"
                        className="w-full rounded-lg border border-dark/15 bg-white px-3 py-2.5 text-sm font-medium uppercase tracking-wider text-dark placeholder:font-normal placeholder:tracking-normal placeholder:text-dark-muted/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                      />
                      {coupon && (
                        <button
                          type="button"
                          onClick={() => setCoupon('')}
                          aria-label="ইনপুট মুছুন"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark"
                        >
                          <FiX className="text-sm" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!coupon.trim()}
                      className="shrink-0 whitespace-nowrap rounded-lg bg-dark px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-dark/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      প্রয়োগ করুন
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* মোট মূল্য */}
            <div className="mt-5 flex items-baseline justify-between gap-2 border-t border-dashed border-dark/15 pt-4">
              <span className="text-base font-semibold text-dark">সর্বমোট</span>
              <span className="font-heading text-xl font-bold text-dark sm:text-2xl">
                {formatCurrency(total)}
              </span>
            </div>

            {/* চেকআউট বাটন (মোবাইল ও ডেস্কটপ উভয় ডিভাইসের জন্য) */}
            <Link
              to="/checkout"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-semibold text-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:text-base"
            >
              চেকআউটের দিকে যান <FiArrowRight className="shrink-0" />
            </Link>

            {/* ট্রাস্ট ব্যাজ */}
            <ul className="mt-5 grid grid-cols-1 gap-2 text-xs text-dark-muted min-[360px]:grid-cols-2 lg:grid-cols-1">
              <li className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2.5">
                <FiLock className="shrink-0 text-dark" />
                <span className="truncate">নিরাপদ চেকআউট</span>
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2.5">
                <FiShield className="shrink-0 text-dark" />
                <span className="truncate">গুণগত মানের বই</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-dark/10 bg-white/95 px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-dark-muted">
              মোট · {formatNumber(itemCount)} টি বই
            </p>
            <p className="truncate font-heading text-xl font-bold leading-tight text-dark">
              {formatCurrency(total)}
            </p>
          </div>
          <Link
            to="/checkout"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-dark shadow-sm active:scale-95"
          >
            চেকআউট <FiArrowRight />
          </Link>
        </div>
      </div>
    </main>
  );
}

function CartItem({
  item,
  isRemoving,
  formatCurrency,
  onChangeQuantity,
  onWishlist,
  onRemove,
}) {
  const { book, quantity, lineTotal } = item;
  const title = book.title?.bn || book.title;
  const author = book.author?.bn || book.author;
  const lowStock = book.stock > 0 && book.stock <= LOW_STOCK_LIMIT;
  const atMax = quantity >= book.stock;

  return (
    <li
      className={`flex gap-3 px-3 py-2.5 transition-all duration-200 sm:gap-3 sm:px-4 sm:py-3 ${
        isRemoving ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <Link
        to={`/books/${book.id}`}
        className="shrink-0 self-start overflow-hidden rounded-md bg-cream shadow-sm"
      >
        <img
          src={book.cover}
          alt={title}
          className="h-24 w-[4.5rem] object-cover transition-transform duration-300 hover:scale-105 sm:h-32 sm:w-24"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to={`/books/${book.id}`}
          className="line-clamp-2 font-heading text-sm font-bold leading-snug text-dark transition-colors hover:text-primary-hover sm:text-base"
        >
          {title}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-dark-muted font-medium sm:text-sm">
          {author || 'লেখক'}
        </p>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <p className="text-xs text-dark-muted sm:text-sm">
            {formatCurrency(book.price)} প্রতিটি
          </p>
          <p className="text-base font-bold text-dark sm:text-base">
            {formatCurrency(lineTotal)}
          </p>
        </div>

        {lowStock && (
          <p className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 sm:text-xs">
            <FiAlertCircle /> শুধু {book.stock}টি স্টকে আছে
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-dark/10 bg-white">
            <button
              type="button"
              aria-label="সংখ্যা কমান"
              disabled={quantity <= 1}
              onClick={() => onChangeQuantity(item, quantity - 1)}
              className="flex h-8 w-10 items-center justify-center text-dark transition-colors hover:bg-cream active:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FiMinus />
            </button>
            <span
              className="min-w-8 text-center text-sm font-semibold"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="সংখ্যা বাড়ান"
              disabled={atMax}
              onClick={() => onChangeQuantity(item, quantity + 1)}
              className="flex h-8 w-6 items-center justify-center text-dark transition-colors hover:bg-cream active:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FiPlus />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-0.5">
            <button
              type="button"
              onClick={() => onWishlist(book.id)}
              aria-label="পরে সংরক্ষণ করুন"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg  px-2 text-sm font-medium text-dark-muted transition-colors hover:border-primary hover:text-primary-hover active:bg-cream"
            >
              <FiHeart className="text-base" />
              {/* <span className="hidden sm:inline">পরে সংরক্ষণ করুন</span> */}
            </button>
            <button
              type="button"
              onClick={() => onRemove(book.id)}
              aria-label="কার্ট থেকে সরান"
              className="inline-flex h-10 items-center justify-center gap-1 rounded-lg   px-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 "
            >
              <FiTrash2 className="text-base" />
              {/* <span className="hidden sm:inline">সরান</span> */}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function EmptyCart() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 py-16 text-center sm:py-20">
      <div className="max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
          <FiShoppingBag className="text-4xl text-primary-hover" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-dark sm:text-3xl md:text-4xl">
          আপনার কার্ট খালি
        </h1>
        <p className="mt-3 text-sm text-dark-muted sm:text-base">
          আপনার প্রিয় বইগুলো কার্টে যোগ করুন, এখানে সেগুলো দেখাবে।
        </p>
        <Link
          to="/books"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-dark px-6 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          <FiArrowLeft /> বই ব্রাউজ করুন
        </Link>
      </div>
    </main>
  );
}

export default Cart;
