import { FiArrowLeft, FiLock } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function Unauthorized() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 py-20 text-center">
      <div>
        <FiLock className="mx-auto text-5xl text-primary-hover" />
        <h1 className="mt-5 font-heading text-4xl font-bold text-dark">
          অনুমতি নেই
        </h1>
        <p className="mt-3 max-w-md text-lg leading-8 text-dark-muted">
          এই পেজটি দেখার জন্য আপনার অ্যাকাউন্টে প্রয়োজনীয় অনুমতি নেই।
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3 font-semibold text-white transition hover:bg-dark-gray"
        >
          <FiArrowLeft /> হোমে ফিরুন
        </Link>
      </div>
    </main>
  )
}

export default Unauthorized
