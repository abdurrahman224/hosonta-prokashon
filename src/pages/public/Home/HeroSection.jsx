import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import desktop from '../../../assets/desktop.jpg';
import mobile from '../../../assets/mobile.jpg';
import extraDesktop from '../../../assets/extra-des.webp';
import premiumDesktop from '../../../assets/premium-desktop.jpg';

const AUTOPLAY_MS = 5000;

// দ্রষ্টব্য: ডেস্কটপ ছবিগুলো 1840x370 রেশিওতে এক্সপোর্ট করুন
// স্লাইড ২-এর জন্য একটি আলাদা ডেস্কটপ ছবি দিন (এখন mobile ছবিই ব্যবহার হচ্ছে)
const slides = [
  { src: desktop, mobileSrc: mobile, alt: 'Slide 1' },
  { src: mobile, mobileSrc: mobile, alt: 'Slide 2' },
  { src: extraDesktop, mobileSrc: mobile, alt: 'Slide 3' },
  { src: premiumDesktop, mobileSrc: mobile, alt: 'Slide 4' },
];

function HeroSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const total = slides.length;

  const goTo = useCallback(
    index => setActive((index + total) % total),
    [total],
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused) return undefined;

    const id = setTimeout(() => {
      setActive(i => (i + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearTimeout(id);
  }, [active, paused, total]);

  const handleKeyDown = e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  const handleTouchStart = e => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = e => {
    if (touchStartX.current === null) return;

    const diff = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(diff) > 50) {
      diff < 0 ? next() : prev();
    }

    touchStartX.current = null;
  };

  return (
    <section
      className="relative  mx-auto w-full max-w-7xl overflow-hidden px-3.5 pb-1 pt-1 text-white sm:px-0 sm:pb-0 sm:pt-4"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider */}
      <div className="relative  overflow-hidden rounded-md ">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={`${slide.alt}-${i}`}
              // মোবাইল: 1190/500 (আগের মতোই)  |  ডেস্কটপ (sm+): 1840/370
              className="relative aspect-[1190/500] w-full shrink-0 bg-dark sm:aspect-[1840/370]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              aria-hidden={i !== active}
            >
              <picture>
                {slide.mobileSrc && (
                  <source media="(max-width: 639px)" srcSet={slide.mobileSrc} />
                )}

                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="h-full w-full object-cover object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
              </picture>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="পূর্বের স্লাইড"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 p-2 text-white/70 drop-shadow transition hover:text-primary focus:outline-none focus-visible:text-primary md:left-5"
        >
          <FiChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="পরবর্তী স্লাইড"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-2 text-white/70 drop-shadow transition hover:text-primary focus:outline-none focus-visible:text-primary md:right-5"
        >
          <FiChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* মোবাইলে স্লাইডারের ঠিক নিচে ছোট Manuscript CTA */}
      <div className="mt-2 flex justify-start gap-2 py-2 sm:hidden">
        <Link
          to="/dashboard/manuscripts/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-dark shadow-sm transition hover:bg-primary-hover active:scale-[0.98]"
        >
          পাণ্ডুলিপি জমা দিন
          <FiArrowRight />
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-primary bg-white px-4 py-2 text-xs font-semibold text-dark shadow-sm transition hover:border-primary-hover hover:bg-primary/10 active:scale-[0.98]"
        >
          পাঠক হোন
          <FiArrowRight />
        </Link>
      </div>

      {/* ডেস্কটপে ব্যানারের উপর বাটন: ব্যানারে নিজস্ব ডিজাইন থাকলে এই ব্লক পুরোটা মুছে দিন */}

      <div className="absolute inset-x-0 bottom-3 z-10 hidden sm:flex md:bottom-5">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-start gap-4 px-12 md:px-20">
          <Link
            to="/dashboard/manuscripts/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-dark transition hover:bg-primary-hover md:px-5 md:py-2.5"
          >
            পাণ্ডুলিপি জমা দিন
            <FiArrowRight />
          </Link>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [aria-roledescription="carousel"] * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;