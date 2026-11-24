import { forwardRef } from 'react';
import BookCard from './BookCard';

const BookRow = forwardRef(function BookRow(
  { items = [], className = '', scrollable = false },
  ref,
) {
  if (!items || items.length === 0) return null;

  if (scrollable) {
    return (
      <div
        ref={ref}
        className={`flex gap-3 overflow-x-auto pb-3 pt-1.5 snap-x scroll-smooth overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 ${className}`}
      >
        {items.map(book => (
          <div
            key={book.id}
            className="w-[145px] shrink-0 snap-start sm:w-[170px] md:w-[190px] lg:w-[205px]"
          >
            <BookCard book={book} compact />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`mt-3.5 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 ${className}`}
    >
      {items.map(book => (
        <div key={book.id} className="min-w-0">
          <BookCard book={book} compact />
        </div>
      ))}
    </div>
  );
});

export default BookRow;
