import BookSection from './BookSection';
import books from '../../../data/books';

function PoetrySection() {
  return (
    <BookSection
      title="কবিতা"
      to="/books"
      select={() =>
        books.filter(book => {
          const category = String(book.category ?? '').toLowerCase();
          return category.includes('কবিতা') || category.includes('poetry');
        })
      }
    />
  );
}

export default PoetrySection;
