import { useMemo, useState } from 'react';
import { FiHeart } from 'react-icons/fi';
import BookCard from '../../../components/books/BookCard';
import Pagination, { paginateItems } from '../../../components/common/Pagination';
import PageHeader from '../../../components/dashboard/PageHeader';
import { useWishlist } from '../../../context/useWishlist';
import { getLocalizedValue } from '../../../utils/i18n';

const itemsPerPage = 12;

function textValue(value) {
  return getLocalizedValue(value);
}

function Wishlist() {
  const [query] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { wishlistBooks } = useWishlist();
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return wishlistBooks;
    return wishlistBooks.filter(book =>
      `${textValue(book.title)} ${textValue(book.author)}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, wishlistBooks]);

  const {
    items: visibleBooks,
    currentPage: safePage,
    totalPages,
  } = paginateItems(filtered, currentPage, itemsPerPage);

  const changePage = page => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader
        title="Wishlist"
        description="Your saved books in one place."
      />
      {filtered.length ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibleBooks.map(book => (
              <BookCard key={book.id} book={book} compact />
            ))}
          </div>
          <Pagination
            variant="minimal"
            ariaLabel="Wishlist pages"
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-dark/20 bg-white px-6 py-20 text-center">
          <FiHeart className="mx-auto text-5xl text-primary-hover" />
          <h2 className="mt-4 font-heading text-2xl font-bold text-dark">
            Wishlist is empty
          </h2>
          <p className="mt-2 text-dark-muted">
            Browse books and add favorites to your wishlist.
          </p>
        </div>
      )}
    </>
  );
}

export default Wishlist;
