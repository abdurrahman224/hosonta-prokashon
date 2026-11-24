import { FiArrowUpRight, FiCalendar } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import useFormat from '../../hooks/useFormat'

function MagazineCard({ post }) {
  const { formatDate } = useFormat()
  return (
    <article className="group overflow-hidden rounded-xl border border-dark/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/magazine/${post.id}`} className="block overflow-hidden">
        <img
          src={post.image}
          alt={post.title?.bn || post.title}
          className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-dark-muted">
          <span className="rounded-full bg-primary/20 px-3 py-1 font-semibold text-primary-hover">
            {post.category?.bn || post.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiCalendar /> {formatDate(post.date)}
          </span>
        </div>
        <h2 className="mt-4 font-heading text-xl font-bold leading-snug text-dark">
          <Link to={`/magazine/${post.id}`} className="transition hover:text-primary-hover">
            {post.title?.bn || post.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-dark-muted">
          {post.excerpt?.bn || post.excerpt}
        </p>
        <Link
          to={`/magazine/${post.id}`}
          className="mt-5 inline-flex items-center gap-1 font-semibold text-dark transition hover:text-primary-hover"
        >
          পুরো ম্যাগাজিন পড়ুন <FiArrowUpRight />
        </Link>
      </div>
    </article>
  )
}

export default MagazineCard
