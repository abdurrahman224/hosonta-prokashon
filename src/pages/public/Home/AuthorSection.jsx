import { useRef, useState } from 'react'
import { FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import books from '../../../data/books'

const authorNames = [
  'এনামুল হক ইবনে ইউসুফ',
  'হুমাইয়া ছালছাবিল ফাইজা',
  'সাদিয়া আফরোজ মীম',
  'সত্যেন সেন',
  'মুহাম্মদ আবু ইউসুফ',
  'আদিব সালেহ',
  'শাইখ ইয়াহইয়া আরেফি',
  "নজুর সা'দ",
  'আবু সালেহ সাদী',
  'আব্দুর রহমান আল আনসারী',
  'হাবীবুল্লাহ সিরাজ',
  'শায়খ আব্দুর রাজ্জাক ইবন আব্দুল মুহসিন আল বদর',
  'ড. মুহাম্মদ ইবনে আবদুর রহমান আরিফী',
  'আবু মারয়াম মাজদী ফাতহী সায়্যিদ',
  'আব্দুল্লাহ আল মামুন',
  'মুহাম্মদ নুরুল ইসলাম',
  'ফারহানা হোসেন রুমি',
  'শাইখ নিদা আবু আহমাদ',
  'আমান বিন সাইফ',
  'মুস্তাফিজ ইবনে আনির',
  'ডাঃ ইসরার আহমাদ রাহিমাহুল্লাহ',
]

const coverOf = (book) =>
  book?.image ?? book?.cover ?? book?.coverImage ?? book?.img ?? null

const items = authorNames.map((name) => {
  const match = books.find((book) =>
    String(book.author ?? book.writer ?? '').toLowerCase().includes(name.toLowerCase()),
  )
  return {
    key: name,
    label: name,
    image: coverOf(match),
    to: `/books?author=${encodeURIComponent(name)}`,
  }
})

function CircleItem({ item }) {
  const [failed, setFailed] = useState(false)

  return (
    <Link to={item.to} title={item.label} className="group flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 sm:w-24 lg:gap-3 py-1.5">
      <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/70 transition group-hover:ring-primary">
        {item.image && !failed ? (
          <img src={item.image} alt={item.label} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <span className="font-heading text-xl font-semibold text-slate-400 sm:text-3xl">{item.label.charAt(0)}</span>
        )}
      </span>
      <span className="w-full truncate text-center text-[11px] text-slate-700 transition group-hover:text-primary-hover sm:text-sm">{item.label}</span>
    </Link>
  )
}

function AuthorSection() {
  const scroller = useRef(null)

  const scrollNext = () => {
    scroller.current?.scrollBy({ left: scroller.current.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="bg-cream px-3.5  md:px-6 md:py-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-5">
          <h2 className="font-heading text-sm md:text-base font-semibold text-slate-950 ">লেখক</h2>
          <Link to="/authors" className="shrink-0 text-xs font-medium text-red-600 underline underline-offset-2 md:text-sm">সবগুলো দেখুন</Link>
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

export default AuthorSection
