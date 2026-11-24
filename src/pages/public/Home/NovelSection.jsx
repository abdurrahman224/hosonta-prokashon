import BookSection from './BookSection';
import books from '../../../data/books';

function NovelSection() {
  return (
    <BookSection
      title="উপন্যাস"
      to="/books"
      select={() =>
        books.filter(book => {
          const category = String(book.category ?? '').toLowerCase();
          return category.includes('উপন্যাস') || category.includes('novel');
        })
      }
    />
  );
}

export default NovelSection;
