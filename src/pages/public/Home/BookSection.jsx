import { useRef, useState, useEffect, useCallback } from 'react';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import BookRow from '../../../components/books/BookRow';

const BOOKS_PER_SECTION = 18;

function BookSection({ title, to, select }) {
  const scrollerRef = useRef(null);
  const items = select().slice(0, BOOKS_PER_SECTION);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(items.length > 4);

  const checkScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const timer1 = setTimeout(checkScroll, 100);
    const timer2 = setTimeout(checkScroll, 400);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [items, checkScroll]);

  const handleScroll = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!items.length) return null;

  return (
    <section className="bg-cream px-3.5 py-3 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-5">
          <h2 className="mt-2 font-heading text-sm md:text-base font-semibold text-slate-950">
            {title}
          </h2>
          <Link
            to={to}
            className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-dark transition hover:text-primary-hover md:text-base"
          >
            <FiArrowRight />
          </Link>
        </div>

        <div className="relative mt-3.5 group">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="পূর্ববর্তী বইগুলো দেখুন"
              className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white text-dark shadow-md ring-1 ring-dark/10 transition hover:bg-primary hover:text-dark hover:scale-105"
            >
              <FiChevronLeft className="text-xl" />
            </button>
          )}

          <BookRow ref={scrollerRef} scrollable items={items} />

          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="পরবর্তী বইগুলো দেখুন"
              className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-9 w-9 items-center justify-center rounded-full bg-white text-dark shadow-md ring-1 ring-dark/10 transition hover:bg-primary hover:text-dark hover:scale-105"
            >
              <FiChevronRight className="text-xl" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default BookSection;
