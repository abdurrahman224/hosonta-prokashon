import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiSearch } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import BookRow from '../../../components/books/BookRow';
import Pagination, { paginateItems } from '../../../components/common/Pagination';
import { BookCardSkeleton } from '../../../components/common/Skeleton';
import FilterSidebar from '../../../components/filters/FilterSidebar';
import {
  ActiveFilterChips,
  FilterButton,
  FilterDrawer,
  FilterPanel,
} from '../../../components/filters/FilterComponents';
import {
  buildActiveChips,
  withCounts,
} from '../../../components/filters/FilterUtils';
import authors from '../../../data/authors';
import books from '../../../data/books';
import categories from '../../../data/categories';
import { useData } from '../../../context/useData';
import useFormat from '../../../hooks/useFormat';
import useSearch from '../../../hooks/useSearch';
import { bookHasCategory, getBookPricing } from '../../../utils/bookHelpers';
import { getCategoryLabel, getLocalizedValue } from '../../../utils/i18n';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function setOrDelete(params, name, value) {
  if (value === '' || value === null || value === undefined) {
    params.delete(name);
  } else {
    params.set(name, String(value));
  }
}

/**
 * ফিল্টারের মান ইউআরএলে রাখে (শেয়ার/রিফ্রেশে ঠিক থাকে)।
 *
 * schema (কম্পোনেন্টের বাইরে ধ্রুবক হিসেবে রাখুন):
 *   [{ key: 'category', type: 'options' },
 *    { key: 'price', type: 'range', min: 0, max: 1000 }]
 *
 * ইউআরএল: ?category=abc&priceMin=100&priceMax=400
 * ফিল্টার বদলালে ?page মুছে যায়; q, sort ইত্যাদি অন্য প্যারামিটার অক্ষত থাকে।
 */
function useUrlFilters(schema) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () =>
      Object.fromEntries(
        schema.map(item =>
          item.type === 'range'
            ? [
                item.key,
                [
                  clamp(
                    Number(searchParams.get(`${item.key}Min`)) || item.min,
                    item.min,
                    item.max,
                  ),
                  clamp(
                    Number(searchParams.get(`${item.key}Max`)) || item.max,
                    item.min,
                    item.max,
                  ),
                ],
              ]
            : [item.key, searchParams.get(item.key) ?? ''],
        ),
      ),
    [schema, searchParams],
  );

  const apply = useCallback(
    mutate => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const setValue = useCallback(
    (key, value) =>
      apply(next => {
        const item = schema.find(entry => entry.key === key);
        if (!item) return;
        if (item.type === 'range') {
          const [low, high] = value;
          setOrDelete(next, `${key}Min`, low > item.min ? low : '');
          setOrDelete(next, `${key}Max`, high < item.max ? high : '');
        } else {
          setOrDelete(next, key, value);
        }
      }),
    [apply, schema],
  );

  const clearValue = useCallback(
    key => {
      const item = schema.find(entry => entry.key === key);
      if (item)
        setValue(key, item.type === 'range' ? [item.min, item.max] : '');
    },
    [schema, setValue],
  );

  const reset = useCallback(
    () =>
      apply(next =>
        schema.forEach(item => {
          if (item.type === 'range') {
            next.delete(`${item.key}Min`);
            next.delete(`${item.key}Max`);
          } else {
            next.delete(item.key);
          }
        }),
      ),
    [apply, schema],
  );

  return { values, setValue, clearValue, reset, searchParams, setSearchParams };
}

// ২) Books পেইজ — শুধু এখানেই বইয়ের ডাটা ও নিয়ম আছে
// ==========================================================================

const booksPerPage = 12;
const searchKeys = [
  'title',
  'author',
  'category',
  'publisher',
  'subject',
  'description',
];

function toNumber(value) {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  const englishValue = String(value).replace(/[০-৯]/g, digit =>
    bengaliDigits.indexOf(digit).toString(),
  );
  return Number(englishValue);
}

// Supports plain string or { en, bn } objects
function publisherOf(book) {
  return getLocalizedValue(book.publisher);
}

const publishedBooks = books.filter(book => book.status === 'published');

const priceMax =
  Math.ceil(
    Math.max(0, ...publishedBooks.map(book => getBookPricing(book).sellingPrice || 0)) / 100,
  ) * 100 || 1000;

const availableCategories = [
  ...new Map(
    books.map(book => [
      book.categoryId,
      categories.find(item => item.id === book.categoryId) ?? {
        id: book.categoryId,
        name: book.category,
      },
    ]),
  ).values(),
].map(item => ({ id: item.id, label: getCategoryLabel(item.name) }));

const authorOptions = authors.map(item => ({
  id: String(item.id),
  label: getLocalizedValue(item.name),
}));

const publisherOptions = [
  ...new Set(publishedBooks.map(publisherOf).filter(Boolean)),
].map(name => ({ id: name, label: name }));

// কোন কোন ফিল্টার আছে (ধ্রুবক রাখতে হবে, কম্পোনেন্টের ভেতরে নয়)
const filterSchema = [
  { key: 'price', type: 'range', min: 0, max: priceMax },
  { key: 'publisher', type: 'options' },
  { key: 'category', type: 'options' },
  { key: 'author', type: 'options' },
  // { key: 'rating', type: 'options' }, // রেটিং ফিল্টার বন্ধ
];

function Books() {
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const { values, setValue, clearValue, reset, searchParams, setSearchParams } =
    useUrlFilters(filterSchema);
  const { formatNumber } = useFormat();
  const { getBookRatingStats } = useData();

  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'new';
  const requestedPage = Number(searchParams.get('page')) || 1;
  const { results: searchedBooks } = useSearch(
    publishedBooks,
    searchKeys,
    query,
  );

  // skip = যে ফিল্টার বাদ দিয়ে মেলাতে হবে (পাশের সংখ্যা বের করার জন্য)
  const matches = useCallback(
    (book, skip) => {
      if (
        skip !== 'category' &&
        values.category &&
        !bookHasCategory(book, values.category)
      )
        return false;
      if (
        skip !== 'author' &&
        values.author &&
        String(book.authorId) !== values.author
      )
        return false;
      if (
        skip !== 'publisher' &&
        values.publisher &&
        publisherOf(book) !== values.publisher
      )
        return false;
      if (skip !== 'price') {
        const price = getBookPricing(book).sellingPrice;
        if (price < values.price[0] || price > values.price[1]) return false;
      }
      // রেটিং ফিল্টার বন্ধ:
      // if (values.rating === '4plus' && getBookRatingStats(book.id).average < 4) return false
      return true;
    },
    [getBookRatingStats, values],
  );

  const filteredBooks = useMemo(() => {
    const filtered = searchedBooks.filter(book => matches(book));

    return [...filtered].sort((firstBook, secondBook) => {
      if (sort === 'price-low')
        return getBookPricing(firstBook).sellingPrice - getBookPricing(secondBook).sellingPrice;
      if (sort === 'price-high')
        return getBookPricing(secondBook).sellingPrice - getBookPricing(firstBook).sellingPrice;
      if (sort === 'rating-high') {
        return (
          getBookRatingStats(secondBook.id).average -
          getBookRatingStats(firstBook.id).average
        );
      }
      return String(secondBook.title?.bn || secondBook.title).localeCompare(
        String(firstBook.title?.bn || firstBook.title),
        'bn',
      );
    });
  }, [getBookRatingStats, matches, searchedBooks, sort]);

  // ফিল্টারের সেকশন কনফিগ — FilterPanel শুধু এটা দেখেই আঁকে
  const sections = useMemo(() => {
    const countBy = (skip, keyOf) => {
      const map = new Map();
      searchedBooks.forEach(book => {
        if (!matches(book, skip)) return;
        const key = keyOf(book);
        if (key) map.set(key, (map.get(key) ?? 0) + 1);
      });
      return map;
    };

    return [
      {
        key: 'price',
        type: 'range',
        title: 'Price Range',
        min: 0,
        max: priceMax,
        prefix: '৳',
      },
      {
        key: 'publisher',
        type: 'options',
        title: 'Publisher',
        options: withCounts(
          publisherOptions,
          countBy('publisher', publisherOf),
          values.publisher,
        ),
      },
      {
        key: 'category',
        type: 'options',
        title: 'Category',
        options: withCounts(
          availableCategories,
          countBy('category', book => book.categoryId),
          values.category,
        ),
      },
      {
        key: 'author',
        type: 'options',
        title: 'Author',
        options: withCounts(
          authorOptions,
          countBy('author', book => String(book.authorId)),
          values.author,
        ),
      },
      // রেটিং ফিল্টার বন্ধ:
      // {
      //   key: 'rating',
      //   type: 'options',
      //   title: 'রেটিং',
      //   defaultOpen: false,
      //   options: [{ id: '4plus', label: 'রেটিং ৪ ও তার বেশি' }],
      // },
    ];
  }, [
    matches,
    searchedBooks,
    values.author,
    values.category,
    values.publisher,
  ]);

  const chips = buildActiveChips(sections, values, formatNumber);

  const {
    items: visibleBooks,
    currentPage,
    totalPages,
  } = paginateItems(filteredBooks, requestedPage, booksPerPage);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, []);

  const updateParam = (name, value, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }
    if (resetPage) nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const panel = (
    <FilterPanel sections={sections} values={values} onChange={setValue} />
  );

  return (
    <div className="bg-cream">
      {/* <section className="bg-dark px-5 py-10 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            হসন্ত প্রকাশন
          </p>
          শিরোনাম — চাইলে আবার চালু করুন
          <h1 className="mt-2 font-heading text-3xl font-bold md:mt-3 md:text-5xl">
            আমাদের বই
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65 md:mt-3 md:text-lg">
            যত্নে বেছে নেওয়া গল্প, কবিতা, প্রবন্ধ ও জ্ঞানের বই।
          </p>
        </div>
      </section> */}

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
          <FilterSidebar activeCount={chips.length} onReset={reset}>
            {panel}
          </FilterSidebar>

          <section className="min-w-0">
            {/* উপরের সারি: বাম পাশে বইয়ের সংখ্যা, ডান পাশে ফিল্টার বাটন + সর্ট */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-dark-muted">
                {filteredBooks.length} published books
              </p>

              <div className="flex justify-center items-center gap-2">
                <FilterButton
                  onClick={() => setDrawerOpen(true)}
                  activeCount={chips.length}
                />
                <select
                  aria-label="Sort books"
                  value={sort}
                  onChange={event => updateParam('sort', event.target.value)}
                  className="min-w-0 rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-sm text-dark focus-visible:outline-none md:px-4"
                >
                  <option value="new">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating-high">Top Rated</option>
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ActiveFilterChips chips={chips} onRemove={clearValue} />
              </div>
            )}

            {isLoading ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: booksPerPage }, (_, index) => (
                  <BookCardSkeleton key={index} compact />
                ))}
              </div>
            ) : visibleBooks.length > 0 ? (
              <>
                <BookRow items={visibleBooks} />
                <Pagination
                  variant="minimal"
                  ariaLabel="Book pages"
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={page =>
                    updateParam('page', String(page), false)
                  }
                />
              </>
            ) : (
              <EmptyState onReset={() => setSearchParams({})} />
            )}
          </section>
        </div>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        activeCount={chips.length}
        onReset={reset}
        resultLabel={`View ${filteredBooks.length} books`}
      >
        {panel}
      </FilterDrawer>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="mx-auto mt-8 max-w-lg rounded-xl border border-dashed border-dark/20 bg-white px-6 py-16 text-center">
      <FiBookOpen className="mx-auto text-4xl text-primary-hover" />
      <h2 className="mt-5 font-heading text-2xl font-bold text-dark">
        No books found
      </h2>
      <p className="mt-3 leading-7 text-dark-muted">
        আপনার সার্চ বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray"
      >
        <FiSearch /> সব বই দেখুন
      </button>
    </div>
  );
}

export default Books;
