import { useMemo, useState } from 'react';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import authors from '../../../data/authors';
import books from '../../../data/books';
import categoryNames from '../../../data/categoryNames';
import BookCard from '../../../components/books/BookCard';
import FilterSidebar from '../../../components/filters/FilterSidebar';
import {
  FilterButton,
  FilterDrawer,
  FilterPanel,
} from '../../../components/filters/FilterComponents';
import { buildActiveChips } from '../../../components/filters/FilterUtils';
import useFormat from '../../../hooks/useFormat';
import { bookHasCategory, getBookPricing } from '../../../utils/bookHelpers';

function CategoryProfile() {
  const { name } = useParams();
  const categoryName = decodeURIComponent(name ?? '');
  const { formatNumber } = useFormat();
  const [sort, setSort] = useState('new');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ price: [0, 0], category: categoryName, author: '' });

  const categoryBooks = useMemo(
    () => books.filter(book => bookHasCategory(book, categoryName)),
    [categoryName],
  );

  const priceMax = useMemo(() => {
    const max = Math.max(0, ...categoryBooks.map(book => getBookPricing(book).sellingPrice));
    return (Math.ceil(max / 100) * 100) || 100;
  }, [categoryBooks]);

  const priceRange = useMemo(
    () => [
      filters.price?.[0] ?? 0,
      filters.price?.[1] && filters.price[1] > 0
        ? filters.price[1]
        : priceMax,
    ],
    [filters.price, priceMax],
  );

  const categoryOptions = categoryNames.map(nameItem => {
    const count = books.filter(book => bookHasCategory(book, nameItem)).length;
    return { id: nameItem, label: nameItem, count };
  });

  const authorOptions = authors.map(author => {
    const count = categoryBooks.filter(book => String(book.authorId) === String(author.id)).length;
    return {
      id: String(author.id),
      label: author.name?.bn || author.name,
      count,
    };
  }).filter(item => item.count > 0);

  const sections = [
    { key: 'price', type: 'range', title: 'Price Range', min: 0, max: priceMax, prefix: '৳' },
    { key: 'category', type: 'options', title: 'বিষয় সমূহ', options: categoryOptions },
    { key: 'author', type: 'options', title: 'লেখক', options: authorOptions },
  ];

  const setFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ price: [0, priceMax], category: categoryName, author: '' });
  };

  const visibleBooks = useMemo(() => {
    const filtered = categoryBooks.filter(book => {
      const price = getBookPricing(book).sellingPrice;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (filters.category && !bookHasCategory(book, filters.category)) return false;
      if (filters.author && String(book.authorId) !== String(filters.author)) return false;
      return true;
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'title') {
        return String(first.title?.bn || first.title).localeCompare(
          String(second.title?.bn || second.title),
          'bn',
        );
      }
      if (sort === 'price-low') return getBookPricing(first).sellingPrice - getBookPricing(second).sellingPrice;
      if (sort === 'price-high') return getBookPricing(second).sellingPrice - getBookPricing(first).sellingPrice;
      return Number(second.id) - Number(first.id);
    });
  }, [categoryBooks, filters.author, filters.category, priceRange, sort]);

  const filterValues = { ...filters, price: priceRange };
  const chips = buildActiveChips(sections, filterValues, formatNumber);

  if (!categoryName) return <CategoryNotFound />;

  return (
    <div className="bg-cream">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <nav className="flex items-center gap-2 text-sm text-dark-muted" aria-label="ব্রেডক্রাম্ব">
          <Link to="/" className="hover:text-primary-hover">হোম</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary-hover">বিষয়</Link>
          <span>/</span>
          <span className="truncate text-dark">{categoryName}</span>
        </nav>

        <section className="mt-5 grid items-center gap-5 rounded-xl border border-dark/10 bg-white p-5 shadow-sm md:grid-cols-[auto_1fr] md:p-7">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-3xl text-primary-hover md:mx-0">
            <FiBookOpen />
          </span>
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-hover">বিষয়ভিত্তিক বই</p>
            <h1 className="mt-2 font-heading text-2xl font-bold text-dark md:text-3xl">{categoryName}</h1>
            <p className="mt-2 text-sm text-dark-muted">{formatNumber(categoryBooks.length)}টি প্রকাশিত বই</p>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
          <FilterSidebar activeCount={chips.length} onReset={resetFilters}>
            <FilterPanel sections={sections} values={filterValues} onChange={setFilter} />
          </FilterSidebar>

          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-dark/10 pb-4">
              <p className="text-sm text-dark-muted">
                {formatNumber(visibleBooks.length)}টি প্রকাশিত বই
              </p>
              <div className="flex items-center gap-2">
                <FilterButton
                  onClick={() => setDrawerOpen(true)}
                  activeCount={chips.length}
                />
                <select
                  aria-label="বই সাজান"
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                  className="rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-primary"
                >
                  <option value="new">নতুন বই আগে</option>
                  <option value="title">নাম অনুযায়ী</option>
                  <option value="price-low">দাম: কম থেকে বেশি</option>
                  <option value="price-high">দাম: বেশি থেকে কম</option>
                </select>
              </div>
            </div>

            {visibleBooks.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {visibleBooks.map(book => (
                  <BookCard key={book.id} book={book} compact />
                ))}
              </div>
            ) : (
              <EmptyBooks onReset={resetFilters} />
            )}
          </section>
        </div>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeCount={chips.length}
        onReset={resetFilters}
        resultLabel={`${formatNumber(visibleBooks.length)}টি বই দেখুন`}
      >
        <FilterPanel sections={sections} values={filterValues} onChange={setFilter} />
      </FilterDrawer>
    </div>
  );
}

function EmptyBooks({ onReset }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-dark/20 bg-white px-6 py-14 text-center">
      <FiBookOpen className="mx-auto text-4xl text-primary-hover" />
      <h2 className="mt-4 font-heading text-2xl font-bold text-dark">কোনো বই পাওয়া যায়নি</h2>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-md bg-dark px-5 py-3 font-semibold text-white"
      >
        সব ফিল্টার মুছুন
      </button>
    </div>
  );
}

function CategoryNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 text-center">
      <div>
        <h1 className="font-heading text-3xl font-bold text-dark">বিষয় পাওয়া যায়নি</h1>
        <Link to="/categories" className="mt-5 inline-flex items-center gap-2 font-semibold text-primary-hover">
          <FiArrowLeft /> সব বিষয়ে ফিরুন
        </Link>
      </div>
    </main>
  );
}

export default CategoryProfile;
