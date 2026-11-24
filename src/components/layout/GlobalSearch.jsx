import { useEffect, useState } from 'react'
import { FiBookOpen, FiSearch, FiUser, FiX } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import SearchBar from '../common/SearchBar'
import authors from '../../data/authors'
import magazines from '../../data/magazines'
import books from '../../data/books'
import useSearch from '../../hooks/useSearch'
import useFormat from '../../hooks/useFormat'

function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const { formatCurrency } = useFormat()
  const { query, setQuery, results: bookResults } = useSearch(books, [
    'title',
    'author',
    'category',
    'publisher',
    'subject',
    'description',
  ])
  const { results: authorResults } = useSearch(authors, ['name', 'bio'], query)
  const { results: magazineResults } = useSearch(
    magazines,
    ['title', 'excerpt', 'category'],
    query,
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const closeSearch = () => {
    setIsOpen(false)
    setQuery('')
  }

  const hasQuery = query.trim().length > 0
  const hasResults = bookResults.length || authorResults.length || magazineResults.length

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md p-2 text-xl text-white/80 transition hover:bg-white/10 hover:text-primary"
        aria-label="সার্চ খুলুন"
      >
        <FiSearch />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-dark/70 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-12"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSearch()
            }
          }}
        >
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-cream shadow-2xl">
            <div className="flex items-center gap-3 border-b border-dark/10 bg-white p-4">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="বই, লেখক বা ব্লগ খুঁজুন..."
                className="flex-1"
                autoFocus
              />
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-md p-2 text-xl text-dark-muted transition hover:bg-dark/10 hover:text-dark"
                aria-label="সার্চ বন্ধ করুন"
              >
                <FiX />
              </button>
            </div>

            {hasQuery && (
              <div className="max-h-[65vh] overflow-y-auto p-4">
                {!hasResults && (
                  <p className="py-10 text-center text-dark-muted">
                    কিছু পাওয়া যায়নি
                  </p>
                )}
                {bookResults.length > 0 && (
                  <ResultGroup
                    title="বই"
                    icon={<FiBookOpen />}
                    items={bookResults.slice(0, 4).map((book) => {
                      const bookTitle = book.title?.bn || book.title
                      return {
                        id: book.id,
                        title: bookTitle,
                        subtitle: `লেখক: ${book.author?.bn || book.author} • ${formatCurrency(book.offerPrice || book.price)}`,
                        to: `/books?q=${encodeURIComponent(bookTitle)}`,
                      }
                    })}
                    onSelect={closeSearch}
                  />
                )}
                {authorResults.length > 0 && (
                  <ResultGroup
                    title="লেখক"
                    icon={<FiUser />}
                    items={authorResults.slice(0, 4).map((author) => {
                      const authorName = author.name?.bn || author.name
                      return {
                        id: author.id,
                        title: authorName,
                        subtitle: author.bio?.bn || author.bio,
                        to: `/authors?q=${encodeURIComponent(authorName)}`,
                      }
                    })}
                    onSelect={closeSearch}
                  />
                )}
                {magazineResults.length > 0 && (
                  <ResultGroup
                    title="Magazine"
                    icon={<FiSearch />}
                    items={magazineResults.slice(0, 4).map((magazine) => {
                      const magazineTitle = magazine.title?.bn || magazine.title
                      return {
                        id: magazine.id,
                        title: magazineTitle,
                        subtitle: magazine.category?.bn || magazine.category,
                        to: `/magazine?q=${encodeURIComponent(magazineTitle)}`,
                      }
                    })}
                    onSelect={closeSearch}
                  />
                )}
              </div>
            )}
            {!hasQuery && (
              <p className="px-5 py-8 text-center text-sm text-dark-muted">
                বই, লেখক অথবা Magazine-এর নাম লিখে খুঁজুন
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ResultGroup({ title, icon, items, onSelect }) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="mb-2 flex items-center gap-2 font-heading font-semibold text-dark">
        <span className="text-primary-hover">{icon}</span>
        {title}
      </h2>
      <div className="divide-y divide-dark/10 rounded-lg border border-dark/10 bg-white">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            onClick={onSelect}
            className="block px-4 py-3 transition hover:bg-primary/10"
          >
            <p className="font-semibold text-dark">{item.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-dark-muted">{item.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default GlobalSearch
