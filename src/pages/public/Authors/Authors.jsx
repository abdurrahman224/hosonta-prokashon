import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiUsers } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import AuthorCard from '../../../components/authors/AuthorCard';
import SearchBar from '../../../components/common/SearchBar';
import authors from '../../../data/authors';
import useSearch from '../../../hooks/useSearch';
import { AuthorCardSkeleton } from '../../../components/common/Skeleton';

const gridClassName =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6';

function Authors() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'popular';
  const { results } = useSearch(authors, ['name', 'bio'], query);

  const sortedAuthors = useMemo(
    () =>
      [...results].sort((firstAuthor, secondAuthor) => {
        if (sort === 'name') {
          return String(firstAuthor.name?.bn || firstAuthor.name).localeCompare(
            String(secondAuthor.name?.bn || secondAuthor.name),
            'bn',
          );
        }
        return secondAuthor.booksCount - firstAuthor.booksCount;
      }),
    [results, sort],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, []);

  const updateParam = (name, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="bg-cream">
      <section className="bg-dark px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            হসন্ত প্রকাশন
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold md:text-5xl">
            আমাদের লেখক
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/65">
            যাঁদের শব্দে আমাদের বইগুলো প্রাণ পায়, তাঁদের সঙ্গে পরিচিত হোন।
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <SearchBar
            key={query}
            value={query}
            onChange={value => updateParam('q', value)}
            placeholder="লেখকের নাম বা বিষয় দিয়ে খুঁজুন..."
            className="w-full md:max-w-md"
          />
          <select
            value={sort}
            onChange={event => updateParam('sort', event.target.value)}
            aria-label="লেখক সাজান"
            className="rounded-lg border border-dark/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="popular">জনপ্রিয়তা অনুযায়ী</option>
            <option value="name">নাম অনুযায়ী</option>
          </select>
        </div>

        {isLoading ? (
          <div className={`mt-6 ${gridClassName}`}>
            {Array.from({ length: 12 }, (_, index) => (
              <AuthorCardSkeleton key={index} />
            ))}
          </div>
        ) : sortedAuthors.length > 0 ? (
          <div className={`mt-6 ${gridClassName}`}>
            {sortedAuthors.map(author => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        ) : (
          <EmptyAuthors onReset={() => setSearchParams({})} />
        )}
      </main>
    </div>
  );
}

function EmptyAuthors({ onReset }) {
  return (
    <div className="mx-auto mt-12 max-w-lg rounded-xl border border-dashed border-dark/20 bg-white px-6 py-16 text-center">
      <FiUsers className="mx-auto text-5xl text-primary-hover" />
      <h2 className="mt-5 font-heading text-2xl font-bold text-dark">
        কোনো লেখক পাওয়া যায়নি
      </h2>
      <p className="mt-3 leading-7 text-dark-muted">
        অন্য কোনো নাম বা বিষয় দিয়ে আবার চেষ্টা করুন।
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray"
      >
        <FiSearch /> সব লেখক দেখুন
      </button>
    </div>
  );
}

export default Authors;
