import BookCard from './BookCard';

function BookRow({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`mt-3.5 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 ${className}`}
    >
      {items.map(book => (
        <div
          key={book.id}
          className="min-w-0"
        >
          <BookCard book={book} compact />
        </div>
      ))}
    </div>
  );
}

export default BookRow;
