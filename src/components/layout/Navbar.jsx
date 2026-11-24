import { useEffect, useState } from 'react';
import {
  FiHeart,
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import GlobalSearch from './GlobalSearch';
import { useCart } from '../../context/useCart';
import { useFormat } from '../../hooks/useFormat';
import { useData } from '../../context/useData';
import useSearch from '../../hooks/useSearch';

const navigation = [
  { key: 'home', to: '/', label: 'হোম' },
  { key: 'books', to: '/books', label: 'বই' },
  { key: 'authors', to: '/authors', label: 'লেখক' },
  { key: 'categories', to: '/categories', label: 'বিষয়' },
  { key: 'magazine', to: '/magazine', label: 'Magazine' },
  { key: 'about', to: '/about', label: 'আমাদের সম্পর্কে' },
  { key: 'contact', to: '/contact', label: 'যোগাযোগ' },
];

const roleBadgeClasses = {
  admin: 'bg-red-100 text-red-700',
  moderator: 'bg-purple-100 text-purple-700',
  author: 'bg-blue-100 text-blue-700',
  employee: 'bg-emerald-100 text-emerald-700',
  user: 'bg-amber-100 text-amber-800',
};

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const [isMobileSuggestionsOpen, setIsMobileSuggestionsOpen] = useState(false);
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart } =
    useCart();
  const { books } = useData();
  const navigate = useNavigate();
  const { formatCurrency } = useFormat();
  const { results: mobileBookResults } = useSearch(
    books.filter(book => book.status === 'published'),
    ['title', 'author', 'category', 'publisher', 'subject', 'description'],
    mobileQuery,
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsMobileSuggestionsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const linkClassName = ({ isActive }) =>
    `block whitespace-nowrap border-b-2 px-1 py-2 text-base font-medium transition ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-white/80 hover:border-primary/60 hover:text-primary'
    }`;

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleMobileSearch = e => {
    e.preventDefault();
    const query = mobileQuery.trim();
    if (!query) return;
    navigate(`/books?q=${encodeURIComponent(query)}`);
    setMobileQuery('');
    setIsMenuOpen(false);
    setIsMobileSuggestionsOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 bg-dark/95 text-white backdrop-blur-md transition-shadow ${
        isScrolled ? 'shadow-lg shadow-black/20' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-2xl text-white transition hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen(open => !open)}
            aria-label={
              isMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'
            }
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link
            to="/"
            className="leading-none"
            aria-label="হসন্ত প্রকাশন হোম"
          >
            <span className="block font-heading text-2xl font-bold text-primary">
              হসন্ত
            </span>
            <span className="mt-1 block text-xs tracking-[0.2em] text-white/70">
              প্রকাশন
            </span>
          </Link>
        </div>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="প্রধান নেভিগেশন"
        >
          {navigation.map(item => (
            <NavLink key={item.to} to={item.to} className={linkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <GlobalSearch />
          </div>
          <Link
            to="/dashboard/wishlist"
            className="rounded-lg p-2.5 text-xl text-white transition hover:bg-white/10 lg:hidden"
            aria-label="উইশলিস্ট"
          >
            <FiHeart />
          </Link>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-lg p-2.5 text-xl text-white transition hover:bg-white/10"
            aria-label="কার্ট খুলুন"
          >
            <FiShoppingCart />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-dark">
                {cartCount}
              </span>
            )}
          </button>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="rounded-lg p-2.5 text-xl text-white transition hover:bg-white/10 lg:hidden"
            aria-label={
              isAuthenticated ? 'ড্যাশবোর্ড' : 'লগইন'
            }
          >
            <FiUser />
          </Link>
          {isAuthenticated ? (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setIsProfileOpen(open => !open)}
                className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-white/10"
                aria-expanded={isProfileOpen}
                aria-label="প্রোফাইল মেনু"
              >
                <UserAvatar user={currentUser} />
                <span className="max-w-28 truncate text-sm font-medium">
                  {currentUser.name}
                </span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white p-3 text-dark shadow-xl">
                  <div className="border-b border-dark/10 px-2 pb-3">
                    <p className="truncate font-semibold">{currentUser.name}</p>
                    <RoleBadge role={currentUser.role} />
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="mt-2 block rounded-md px-2 py-2 text-sm transition hover:bg-cream"
                  >
                    ড্যাশবোর্ড
                  </Link>
                  {currentUser.role === 'user' && (
                    <>
                      <Link
                        to="/dashboard/my-orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="mt-1 block rounded-md px-2 py-2 text-sm transition hover:bg-cream"
                      >
                        আমার অর্ডার
                      </Link>
                      <Link
                        to="/dashboard/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="mt-1 block rounded-md px-2 py-2 text-sm transition hover:bg-cream"
                      >
                        উইশলিস্ট
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    লগআউট
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-md bg-primary px-5 py-2.5 font-semibold text-dark transition hover:bg-primary-hover lg:block"
            >
              লগইন
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleMobileSearch} className="relative px-4 pb-3 lg:hidden">
        <div className="flex items-center rounded-lg border border-white/15 bg-white/10 pl-4 pr-1 transition focus-within:border-primary">
          <input
            type="search"
            value={mobileQuery}
            onChange={e => {
              setMobileQuery(e.target.value);
              setIsMobileSuggestionsOpen(true);
            }}
            onFocus={() => setIsMobileSuggestionsOpen(true)}
            placeholder="বই, লেখক, প্রকাশনী বা বিষয় খুঁজুন..."
            aria-label="বই, লেখক, প্রকাশনী বা বিষয় খুঁজুন..."
            className="h-8 w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md p-2 text-xl text-white/70 transition hover:text-primary"
            aria-label="বই, লেখক বা Magazine খুঁজুন..."
          >
            <FiSearch />
          </button>
        </div>

        {isMobileSuggestionsOpen && mobileQuery.trim() && (
          <div className="absolute left-4 right-4 top-full z-[65] max-h-[65vh] -translate-y-2 overflow-y-auto rounded-xl border border-dark/10 bg-white p-2 text-dark shadow-2xl">
            {mobileBookResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-dark-muted">
                কোন বই পাওয়া যায়নি
              </p>
            ) : (
              mobileBookResults.slice(0, 6).map(book => {
                const title = book.title?.bn || book.title;
                const author = book.author?.bn || book.author;
                return (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    onClick={() => {
                      setMobileQuery('');
                      setIsMobileSuggestionsOpen(false);
                    }}
                    className="flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-cream"
                  >
                    <img
                      src={book.cover}
                      alt={title}
                      className="h-16 w-12 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-heading font-semibold text-dark">
                        {title}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-dark-muted">
                        লেখক: {author}
                      </p>
                      <p className="mt-1 font-heading text-sm font-bold text-primary-hover">
                        {formatCurrency(book.offerPrice || book.price)}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </form>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-dark/60 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="মোবাইল নেভিগেশন"
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 h-full w-full"
              aria-label="মেনু বন্ধ করুন"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="absolute left-0 top-0 h-dvh w-[80vw] max-w-[360px] overflow-y-auto bg-dark text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="font-heading text-xl font-bold text-primary">মেনু</span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md p-2 text-xl transition hover:bg-white/10"
                  aria-label="মেনু বন্ধ করুন"
                >
                  <FiX />
                </button>
              </div>
              <nav className="px-5 py-4" aria-label="মোবাইল নেভিগেশন">
                {navigation.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={linkClassName}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                {isAuthenticated ? (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={currentUser} />
                      <div>
                        <p className="font-semibold">{currentUser.name}</p>
                        <RoleBadge role={currentUser.role} />
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="mt-4 block rounded-md bg-primary px-5 py-2.5 text-center font-semibold text-dark transition hover:bg-primary-hover"
                    >
                      ড্যাশবোর্ড
                    </Link>
                    {currentUser.role === 'user' && (
                      <>
                        <Link
                          to="/dashboard/my-orders"
                          onClick={() => setIsMenuOpen(false)}
                          className="mt-2 block rounded-md border border-white/15 px-5 py-2.5 text-center font-semibold text-white"
                        >
                          আমার অর্ডার
                        </Link>
                        <Link
                          to="/dashboard/wishlist"
                          onClick={() => setIsMenuOpen(false)}
                          className="mt-2 block rounded-md border border-white/15 px-5 py-2.5 text-center font-semibold text-white"
                        >
                          উইশলিস্ট
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 w-full rounded-md border border-white/15 px-5 py-2.5 text-center font-semibold text-white transition hover:border-primary hover:text-primary"
                    >
                      লগআউট
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-3 block rounded-md bg-primary px-5 py-2.5 text-center font-semibold text-dark transition hover:bg-primary-hover"
                  >
                    লগইন
                  </Link>
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
        {isCartOpen && (
          <MiniCart
            onClose={() => setIsCartOpen(false)}
            items={items}
            cartCount={cartCount}
            cartTotal={cartTotal}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        )}
      </AnimatePresence>
    </header>
  );
}

function MiniCart({
  onClose,
  items,
  cartCount,
  cartTotal,
  updateQuantity,
  removeFromCart,
}) {
  const { formatCurrency } = useFormat();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-dark/50"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="কার্ট বন্ধ করুন"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="absolute right-0 top-0 flex h-screen w-full max-w-sm flex-col bg-white text-dark shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-dark/10 p-5">
          <h2 className="font-heading text-sm md:text-xl font-medium ">
            আমার কার্ট ({cartCount})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-xl text-dark-muted"
          >
            <FiX />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length ? (
            items.map(item => (
              <div
                key={item.book.id}
                className="group relative flex gap-3.5 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition-all hover:border-slate-200 hover:bg-slate-50 shadow-2xs"
              >
                <Link
                  to={`/books/${item.book.id}`}
                  onClick={onClose}
                  className="shrink-0 overflow-hidden rounded-lg self-start"
                >
                  <img
                    src={item.book.cover}
                    alt={item.book.title?.bn || item.book.title}
                    width="56"
                    height="80"
                    loading="lazy"
                    className="h-20 w-14 rounded-lg object-cover border border-slate-200/70 shadow-2xs transition-transform duration-200 hover:scale-105"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link
                      to={`/books/${item.book.id}`}
                      onClick={onClose}
                      className="line-clamp-1 font-heading text-sm font-semibold text-slate-800 transition-colors hover:text-primary-hover"
                    >
                      {item.book.title?.bn || item.book.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 font-medium">
                      {item.book.author?.bn || item.book.author || 'লেখক'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-900">
                      {formatCurrency(item.book.offerPrice || item.book.price)}
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.book.id, item.quantity - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-l-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all text-sm font-medium"
                        aria-label="পরিমাণ কমান"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-xs font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const result = updateQuantity(
                            item.book.id,
                            item.quantity + 1,
                          );
                          if (!result.success) toast.error(result.message);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-r-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all text-sm font-medium"
                        aria-label="পরিমাণ বাড়ান"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.book.id)}
                      title="আইটেম মুছুন"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all"
                      aria-label="আইটেম মুছুন"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FiShoppingCart size={22} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-600">আপনার কার্ট খালি।</p>
              <p className="mt-1 text-xs text-slate-400">বই যোগ করতে শপ ভিজিট করুন।</p>
            </div>
          )}
        </div>
        <div className="border-t border-dark/10 p-5">
          <div className="flex justify-between font-bold">
            <span>মোট</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
          <Link
            to="/cart"
            onClick={onClose}
            className="mt-4 block rounded-md bg-primary px-4 py-3 text-center font-semibold text-dark"
          >
            কার্ট দেখুন
          </Link>
          <Link
            to="/checkout"
            onClick={onClose}
            className="mt-2 block rounded-md bg-dark px-4 py-3 text-center font-semibold text-white"
          >
            চেকআউট
          </Link>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function UserAvatar({ user }) {
  return (
    <img
      src={user.avatar}
      alt={user.name}
      className="h-9 w-9 rounded-full object-cover ring-2 ring-primary"
    />
  );
}

function RoleBadge({ role }) {
  const roleLabels = {
    admin: 'প্রশাসক',
    moderator: 'মডারেটর',
    author: 'লেখক',
    employee: 'কর্মী',
    user: 'ব্যবহারকারী',
  };

  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        roleBadgeClasses[role] ?? 'bg-dark/10 text-dark'
      }`}
    >
      {roleLabels[role] || role}
    </span>
  );
}

export default Navbar;
