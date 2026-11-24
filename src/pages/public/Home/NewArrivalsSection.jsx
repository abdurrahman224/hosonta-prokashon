import BookSection from './BookSection';
import books from '../../../data/books';

function NewArrivalsSection() {
  return (
    <BookSection
      title="নতুন বইয়ের সম্ভার"
      to="/books"
      select={() => {
        const flagged = books.filter(book => book.isNew || book.newArrival);
        if (flagged.length) return flagged;
        return [...books].sort(
          (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
        );
      }}
    />
  );
}

export default NewArrivalsSection;
