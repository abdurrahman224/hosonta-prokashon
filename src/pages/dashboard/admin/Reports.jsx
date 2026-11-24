import PageHeader from '../../../components/dashboard/PageHeader'
import { useData } from '../../../context/useData'
import booksSeed from '../../../data/books'

function Reports() {
  const { reviews } = useData()
  const approved = reviews.filter((review) => review.status === 'approved')
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: approved.filter((review) => review.rating === rating).length }))
  const books = booksSeed.map((book) => ({ ...book, count: approved.filter((review) => String(review.bookId) === String(book.id)).length })).sort((first, second) => second.count - first.count).slice(0, 5)
  const maxRating = Math.max(1, ...distribution.map((item) => item.count))
  const maxBooks = Math.max(1, ...books.map((book) => book.count))
  return (
    <>
      <PageHeader title="রিপোর্ট" description="রিভিউ ও রেটিংয়ের সামগ্রিক পরিসংখ্যান দেখুন।" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="রেটিং বিতরণ">
          <div className="space-y-4">{distribution.map((item) => <div key={item.rating} className="flex items-center gap-3"><span className="w-12 text-sm text-dark">{item.rating} স্টার</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-dark/10"><div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxRating) * 100}%` }} /></div><span className="w-8 text-right text-sm text-dark-muted">{item.count}</span></div>)}</div>
        </ChartCard>
        <ChartCard title="সবচেয়ে বেশি রিভিউ পাওয়া বই">
          <div className="space-y-4">{books.map((book) => <div key={book.id} className="flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-sm text-dark">{book.title}</span><div className="h-3 w-32 overflow-hidden rounded-full bg-dark/10"><div className="h-full rounded-full bg-primary" style={{ width: `${(book.count / maxBooks) * 100}%` }} /></div><span className="w-6 text-right text-sm text-dark-muted">{book.count}</span></div>)}</div>
        </ChartCard>
      </div>
    </>
  )
}

function ChartCard({ title, children }) {
  return <section className="rounded-xl border border-dark/10 bg-white p-6"><h2 className="mb-6 font-heading text-xl font-bold text-dark">{title}</h2>{children}</section>
}

export default Reports
