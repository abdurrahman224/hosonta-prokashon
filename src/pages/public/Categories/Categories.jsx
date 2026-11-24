import { FiBookOpen } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import books from '../../../data/books';
import categoryNames from '../../../data/categoryNames';

const toText = value =>
  (value && typeof value === 'object'
    ? Object.values(value).join(' ')
    : String(value ?? '')
  ).toLowerCase();

function Categories() {
  const items = categoryNames.map(name => {
    const count = books.filter(book =>
      toText(book.category).includes(name.toLowerCase()),
    ).length;

    return {
      name,
      count,
      to: `/categories/${encodeURIComponent(name)}`,
    };
  });

  return (
    <div className="bg-cream">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-hover">
            বিষয়ভিত্তিক বই
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-dark md:text-4xl">
            সব বিষয়
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {items.map(item => (
            <Link
              key={item.name}
              to={item.to}
              className="group flex min-h-36 flex-col items-center justify-center rounded-xl border border-dark/10 bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 text-primary-hover transition group-hover:bg-primary group-hover:text-dark">
                <FiBookOpen />
              </span>
              <h2 className="mt-3 min-h-10 font-heading text-sm font-semibold leading-5 text-dark sm:text-base">
                {item.name}
              </h2>
              <p className="mt-1 text-xs text-dark-muted">
                {item.count}টি বই
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Categories;
