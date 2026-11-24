import { useMemo, useState } from 'react';
import { FiBookOpen } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import BookCard from '../../../components/books/BookCard';
import useFormat from '../../../hooks/useFormat';
import FilterSidebar from '../../../components/filters/FilterSidebar';
import {
  FilterButton,
  FilterDrawer,
  FilterPanel,
} from '../../../components/filters/FilterComponents';
import { buildActiveChips } from '../../../components/filters/FilterUtils';

const toNumber = value => {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  const englishValue = String(value).replace(/[০-৯]/g, digit =>
    bengaliDigits.indexOf(digit).toString(),
  );
  return Number(englishValue.replace(/[^\d]/g, '')) || 0;
};

function AuthorProfileContent({ author, books: authorBooks }) {
  const { formatNumber } = useFormat();
  const [sort, setSort] = useState('new');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    price: [0, 0],
    category: '',
    author: '',
  });

  const priceMax = useMemo(() => {
    const max = Math.max(0, ...authorBooks.map(book => toNumber(book.price)));
    return (Math.ceil(max / 100) * 100) || 100;
  }, [authorBooks]);

  const priceRange = useMemo(
    () => [
      filters.price?.[0] ?? 0,
      filters.price?.[1] && filters.price[1] > 0
        ? filters.price[1]
        : priceMax,
    ],
    [filters.price, priceMax],
  );

  const categoryOptions = useMemo(() => {
    const counts = new Map();
    authorBooks.forEach(book => {
      if (!book.categoryId) return;
      counts.set(book.categoryId, (counts.get(book.categoryId) ?? 0) + 1);
    });
    return [...counts.entries()].map(([id, count]) => ({
      id,
      label: authorBooks.find(book => book.categoryId === id)?.category ?? id,
      count,
    }));
  }, [authorBooks]);

  const sections = [
    {
      key: 'price',
      type: 'range',
      title: 'Price Range',
      min: 0,
      max: priceMax,
      prefix: '৳',
    },
    {
      key: 'category',
      type: 'options',
      title: 'বিষয় সমূহ',
      options: categoryOptions,
    },
    {
      key: 'author',
      type: 'options',
      title: 'লেখক',
      options: [{
        id: String(author.id),
        label: author.name?.bn || author.name,
        count: authorBooks.length,
      }],
    },
  ];

  const setFilter = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ price: [0, priceMax], category: '', author: '' });
  };

  const visibleBooks = useMemo(() => {
    const filtered = authorBooks.filter(book => {
      const price = toNumber(book.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (filters.category && book.categoryId !== filters.category) return false;
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
      if (sort === 'price-low') {
        return Number(String(first.price).replace(/[^\d]/g, '')) -
          Number(String(second.price).replace(/[^\d]/g, ''));
      }
      if (sort === 'price-high') {
        return Number(String(second.price).replace(/[^\d]/g, '')) -
          Number(String(first.price).replace(/[^\d]/g, ''));
      }
      return Number(second.id) - Number(first.id);
    });
  }, [authorBooks, filters.category, filters.author, priceRange, sort]);

  const filterValues = { ...filters, price: priceRange };
  const chips = buildActiveChips(sections, filterValues, formatNumber);

  return (
    <div className="bg-cream">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-0">
        <nav
          className="flex md:hidden  items-center gap-2 text-sm text-dark-muted"
          aria-label="ব্রেডক্রাম্ব"
        >
          <Link to="/" className="transition hover:text-primary-hover">হোম</Link>
          <span>/</span>
          <Link to="/authors" className="transition hover:text-primary-hover">লেখক</Link>
          <span>/</span>
          <span className="truncate text-dark">{author.name?.bn || author.name}</span>
        </nav>

        <section className="mt-5 rounded-xl border border-dark/10 bg-white p-5 shadow-sm md:p-8">
          <div className="grid items-center gap-5 md:grid-cols-[112px_minmax(0,1fr)] md:gap-8">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-slate-100 md:h-28 md:w-28">
              <img
                src={author.photo}
                alt={author.name?.bn || author.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="font-heading text-xs font-semibold uppercase tracking-widest text-primary-hover">
                লেখক পরিচিতি
              </p>
              <h1 className="mt-2 font-heading text-2xl font-bold text-dark md:text-3xl">
                {author.name?.bn || author.name}
              </h1>
              <p className="mt-3 leading-7 text-dark-muted">
                {author.bio?.bn || author.bio}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-hover">
                <FiBookOpen />
                {formatNumber(authorBooks.length)}টি প্রকাশিত বই
              </span>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
          <FilterSidebar activeCount={chips.length} onReset={resetFilters}>
            <FilterPanel
              sections={sections}
              values={filterValues}
              onChange={setFilter}
            />
          </FilterSidebar>

          <section className="min-w-0">
            <div className="flex items-center justify-between gap-4 border-b border-dark/10 pb-4">
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

            <div className="mt-5">
              {visibleBooks.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleBooks.map(item => (
                    <BookCard key={item.id} book={item} compact />
                  ))}
                </div>
              ) : (
                <EmptyBooks
                  hasBooks={authorBooks.length > 0}
                  onReset={() => {
                    resetFilters();
                    setSort('new');
                  }}
                />
              )}
            </div>
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
        <FilterPanel
          sections={sections}
          values={filterValues}
          onChange={setFilter}
        />
      </FilterDrawer>
    </div>
  );
}

function EmptyBooks({ hasBooks, onReset }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-dark/20 bg-white px-6 py-14 text-center">
      <FiBookOpen className="mx-auto text-4xl text-primary-hover" />
      <h2 className="mt-4 font-heading text-2xl font-bold text-dark">
        {hasBooks ? 'এই সার্চে কোনো বই পাওয়া যায়নি' : 'এখনো কোনো published বই নেই'}
      </h2>
      {hasBooks && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-md bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray"
        >
          সব বই দেখুন
        </button>
      )}
    </div>
  );
}

export default AuthorProfileContent;
