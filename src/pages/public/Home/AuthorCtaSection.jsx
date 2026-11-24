import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function AuthorCtaSection() {
  return (
    <section className="bg-primary px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-dark/60">
            আপনার গল্পের অপেক্ষায়
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-dark md:text-4xl">
            আপনিও লেখক হোন
          </h2>
          <p className="mt-2 max-w-xl text-dark/70">
            আপনার সৃষ্টিকে পাঠকের কাছে পৌঁছে দিতে আমরা আছি পাশে।
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3.5 font-semibold text-white transition hover:bg-dark-gray"
        >
          পাণ্ডুলিপি পাঠান <FiArrowRight />
        </Link>
      </div>
    </section>
  )
}

export default AuthorCtaSection
