import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import BookRow from '../../../components/books/BookRow';

const BOOKS_PER_SECTION = 6;

function BookSection({ title, to, select }) {
  const items = select().slice(0, BOOKS_PER_SECTION);

  if (!items.length) return null;

  return (
    <section className="bg-cream px-3.5 py-2  md:px-6 ">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-5">
          <h2 className="mt-2 font-heading text-sm md:text-base font-semibold text-slate-950 ">
            {title}
          </h2>
          <Link
            to={to}
            className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-dark transition hover:text-primary-hover md:text-base"
          >
            <FiArrowRight />
          </Link>
        </div>
        <BookRow items={items} />
      </div>
    </section>
  );
}

export default BookSection;
