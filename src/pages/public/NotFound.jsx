import { FiArrowRight, FiCompass } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../../components/common/SearchBar'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-2xl text-center">
        <FiCompass className="mx-auto text-6xl text-primary-hover" />
        <p className="mt-5 font-heading text-7xl font-bold text-dark">৪০৪</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">পাতাটি পাওয়া যায়নি</h1>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-dark-muted">
          এই ঠিকানাটি হয়তো বদলে গেছে। নিচের সার্চ বা জনপ্রিয় লিংক থেকে খুঁজে নিন।
        </p>
        <SearchBar
          placeholder="বই, লেখক বা Magazine খুঁজুন..."
          onSubmit={(value) => navigate(`/books?q=${encodeURIComponent(value)}`)}
          className="mx-auto mt-7 max-w-md text-left"
        />
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {[
            ['হোম', '/'],
            ['বই', '/books'],
            ['লেখক', '/authors'],
            ['Magazine', '/magazine'],
          ].map(([label, path]) => (
            <Link key={path} to={path} className="inline-flex items-center gap-2 rounded-lg border border-dark/10 bg-white px-4 py-2.5 font-semibold text-dark transition hover:border-primary hover:bg-primary/10">
              {label} <FiArrowRight />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotFound
