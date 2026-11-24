import { useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiHeart } from 'react-icons/fi';
import PageHeader from '../../../components/dashboard/PageHeader';
import SearchBar from '../../../components/common/SearchBar';
import { useWishlist } from '../../../context/useWishlist';
import BookCard from '../../../components/books/BookCard';

const itemsPerPage = 12;

function textValue(value) {
  if (!value) return '';
  if (typeof value === 'object') return value.bn || value.name?.bn || value.name || '';
  return String(value);
}

function Wishlist() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { wishlistBooks } = useWishlist();
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return wishlistBooks;
    return wishlistBooks.filter(book =>
      `${textValue(book.title)} ${textValue(book.author)}`
        .toLower()
        .includes(normalizedQuery),
    );
  }, [query, wishlistBooks]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const visibleBooks = filtered.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const changePage = page => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader
        title="উইশলিস্ট"
        description="আপনার পছন্দের বইগুলো এক জায়গায় রাখুন।"
      />
      {/* <SearchBar
        value={query}
        onChange={value => {
          setQuery(value);
          setCurrentPage(1);
        }}
        placeholder="উইশলিস্টে খুঁজুন..."
        className="mb-6 max-w-md"
      /> */}
      {filtered.length ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibleBooks.map(book => (
              <BookCard key={book.id} book={book} compact />
            ))}
          </div>
          {totalPages > 1 && (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="উইশলিস্টের পৃষ্ঠা"
            >
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => changePage(safePage - 1)}
                className="rounded-md border border-dark/10 bg-white p-2 text-dark transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="আগের পৃষ্ঠা"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button
                  type="button"
                  key={page}
                  onClick={() => changePage(page)}
                  className={`h-10 w-10 rounded-md font-semibold transition ${
                    page === safePage
                      ? 'bg-primary text-dark'
                      : 'border border-dark/10 bg-white text-dark hover:border-primary'
                  }`}
                  aria-current={page === safePage ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => changePage(safePage + 1)}
                className="rounded-md border border-dark/10 bg-white p-2 text-dark transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="পরের পৃষ্ঠা"
              >
                <FiChevronRight />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-dark/20 bg-white px-6 py-20 text-center">
          <FiHeart className="mx-auto text-5xl text-primary-hover" />
          <h2 className="mt-4 font-heading text-2xl font-bold text-dark">
            উইশলিস্ট খালি
          </h2>
          <p className="mt-2 text-dark-muted">
            বই ব্রাউজ করে পছন্দের বই উইশলিস্টে যোগ করুন।
          </p>
        </div>
      )}
    </>
  );
}

export default Wishlist;
