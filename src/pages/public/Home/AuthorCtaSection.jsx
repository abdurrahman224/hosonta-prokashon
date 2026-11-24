import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function AuthorCtaSection() {
  return (
    <section className="bg-primary px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div>
          <h2 className="font-heading text-xl font-bold text-dark md:text-2xl">
            আপনিও লেখক হোন
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-dark/70 md:text-base">
            আপনার সৃষ্টিকে পাঠকের কাছে পৌঁছে দিতে আমরা আছি পাশে।
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-dark-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
        >
          পাণ্ডুলিপি পাঠান <FiArrowRight className="text-base" />
        </Link>
      </div>
    </section>
  );
}

export default AuthorCtaSection;
