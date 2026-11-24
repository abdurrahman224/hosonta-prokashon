import { FiArrowLeft, FiCalendar, FiFileText } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import MagazineCard from '../../components/common/MagazineCard'
import { getStoredMagazines } from '../../utils/moderationStorage'
import useFormat from '../../hooks/useFormat'

function MagazinePost() {
  const { id } = useParams()
  const magazines = getStoredMagazines()
  const post = magazines.find((item) => String(item.id) === id && item.status === 'published')

  if (!post) {
    return <MagazinePostNotFound />
  }

  const relatedPosts = [
    ...magazines.filter((item) =>
      (item.category?.bn || item.category) === (post.category?.bn || post.category) &&
      item.id !== post.id,
    ),
    ...magazines.filter((item) =>
      (item.category?.bn || item.category) !== (post.category?.bn || post.category) &&
      item.id !== post.id,
    ),
  ].slice(0, 3)

  return <MagazinePostContent post={post} relatedPosts={relatedPosts} />
}

function MagazinePostContent({ post, relatedPosts }) {
  const { formatDate } = useFormat()
  const postCategory = post.category?.bn || post.category

  return (
    <div className="bg-cream">
      <main className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        <nav className="flex items-center gap-2 text-sm text-dark-muted" aria-label="ব্রেডক্রাম্ব">
          <Link to="/" className="transition hover:text-primary-hover">
            হোম
          </Link>
          <span>/</span>
          <Link to="/magazine" className="transition hover:text-primary-hover">
            Magazine
          </Link>
          <span>/</span>
          <span className="max-w-[14rem] truncate text-dark">{post.title?.bn || post.title}</span>
        </nav>

        <article className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-dark-muted">
            <span className="rounded-full bg-primary px-4 py-1.5 font-semibold text-dark">
              {postCategory}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiCalendar /> {formatDate(post.date)}
            </span>
          </div>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-dark md:text-6xl">
            {post.title?.bn || post.title}
          </h1>
          <p className="mt-5 text-xl leading-9 text-dark-muted">{post.excerpt?.bn || post.excerpt}</p>
          <img
            src={post.image}
            alt={post.title?.bn || post.title}
            className="mt-8 aspect-[16/8] w-full rounded-xl object-cover shadow-lg"
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-6 text-lg leading-9 text-dark-gray">
            {(post.content?.bn || post.content || []).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-20 border-t border-dark/10 pt-12">
            <h2 className="font-heading text-3xl font-bold text-dark">
              সম্পর্কিত Magazine
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <MagazineCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function MagazinePostNotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-cream px-5 py-20 text-center">
      <div>
        <FiFileText className="mx-auto text-5xl text-primary-hover" />
        <h1 className="mt-5 font-heading text-4xl font-bold text-dark">
          Magazine পাওয়া যায়নি
        </h1>
        <p className="mt-3 text-lg text-dark-muted">
          Magazine-এর লিংকটি সঠিক নয় অথবা এটি আর উপলব্ধ নেই।
        </p>
        <Link
          to="/magazine"
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-dark px-6 py-3 font-semibold text-white transition hover:bg-dark-gray"
        >
          <FiArrowLeft /> Magazine-এ ফিরুন
        </Link>
      </div>
    </main>
  )
}

export default MagazinePost
