import { useRef, useState } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import books from '../../../data/books'
import categoryNames from '../../../data/categoryNames'

const toText = (value) =>
  (value && typeof value === 'object'
    ? Object.values(value).join(' ')
    : String(value ?? '')
  ).toLowerCase()

const coverOf = (book) =>
  book?.image ?? book?.cover ?? book?.coverImage ?? book?.img ?? null

const items = categoryNames.map((name) => {
  const match = books.find((book) => toText(book.category).includes(name.toLowerCase()))
  return {
    key: name,
    label: name,
    image: coverOf(match),
    to: `/categories/${encodeURIComponent(name)}`,
  }
})

function CircleItem({ item }) {
  const [failed, setFailed] = useState(false)

  return (
    <Link
      to={item.to}
      title={item.label}
      className="group flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 sm:w-24 lg:gap-3 py-1.5"
    >
      <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70 transition group-hover:ring-primary">
        {item.image && !failed ? (
          <img
            src={item.image}
            alt={item.label}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-heading text-xl font-semibold text-slate-400 sm:text-3xl">
            {item.label.charAt(0)}
          </span>
        )}
      </span>
      <span className="w-full truncate text-center text-[11px] text-slate-700 transition group-hover:text-primary-hover sm:text-sm">
        {item.label}
      </span>
    </Link>
  )
}

function CategorySection() {
  const scroller = useRef(null)

  const scrollNext = () => {
    scroller.current?.scrollBy({ left: scroller.current.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="bg-cream px-3.5 md:px-6 md:pt-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-5">
          <h2 className="font-heading text-base font-semibold text-slate-950 md:text-xl">ক্যাটাগরি</h2>
          <Link to="/categories" className="shrink-0 text-xs font-medium text-red-600 underline underline-offset-2 md:text-sm">
            সবগুলো দেখুন
          </Link>
        </div>
        <div className="relative mt-3">
          <div ref={scroller} className="flex snap-x gap-3 overflow-x-auto pb-1 sm:gap-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => <CircleItem key={item.key} item={item} />)}
          </div>
          <button type="button" onClick={scrollNext} aria-label="পরেরগুলো দেখুন" className="absolute right-0 top-8 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:text-primary-hover md:flex lg:top-14">
            <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  )
}

export default CategorySection
