import BookSection from './BookSection';
import books from '../../../data/books';

const soldCount = book => Number(book.sold ?? book.sales ?? 0);

function BestSellersSection() {
  return (
    <BookSection
      title="বেস্ট সেলার বই"
      to="/books"
      select={() => {
        const flagged = books.filter(
          book => book.bestseller || book.bestSeller || book.isBestseller,
        );
        if (flagged.length) return flagged;
        return [...books].sort((a, b) => soldCount(b) - soldCount(a));
      }}
    />
  );
}

export default BestSellersSection;
