import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import books from '../../data/books'
import { useData } from '../../context/useData'

const routeMeta = {
  '/': ['হসন্ত প্রকাশন | বাংলা বইয়ের প্রকাশনী', 'হসন্ত প্রকাশনের নির্বাচিত বাংলা বই, লেখক ও প্রকাশনার গল্প।'],
  '/books': ['বই | হসন্ত প্রকাশন', 'হসন্ত প্রকাশনের প্রকাশিত বাংলা বইগুলো খুঁজুন ও কিনুন।'],
  '/authors': ['লেখক | হসন্ত প্রকাশন', 'হসন্ত প্রকাশনের লেখকদের সঙ্গে পরিচিত হোন।'],
  '/magazine': ['Magazine | হসন্ত প্রকাশন', 'বই, সাহিত্য ও প্রকাশনা নিয়ে হসন্ত প্রকাশনের Magazine।'],
  '/about': ['আমাদের সম্পর্কে | হসন্ত প্রকাশন', 'হসন্ত প্রকাশনের গল্প, লক্ষ্য ও প্রকাশনা দর্শন।'],
  '/contact': ['যোগাযোগ | হসন্ত প্রকাশন', 'হসন্ত প্রকাশনের সঙ্গে যোগাযোগ করুন।'],
  '/cart': ['কার্ট | হসন্ত প্রকাশন', 'আপনার নির্বাচিত বইগুলোর কার্ট।'],
  '/track-order': ['অর্ডার ট্র্যাক করুন | হসন্ত প্রকাশন', 'অর্ডার নম্বর ও ফোন দিয়ে অর্ডারের অবস্থা দেখুন।'],
}

function SEO({ title, description, noIndex = false, image, structuredData }) {
  const location = useLocation()
  const { getBookRatingStats, getBookReviews } = useData()
  const book = location.pathname.startsWith('/books/')
    ? books.find((item) => String(item.id) === location.pathname.split('/')[2])
    : null
  const fallback = routeMeta[location.pathname] ?? ['হসন্ত প্রকাশন', 'হসন্ত প্রকাশন - বাংলা বই ও প্রকাশনার ঠিকানা।']
  const pageTitle = title ?? (book ? `${book.title?.bn || book.title} | হসন্ত প্রকাশন` : fallback[0])
  const pageDescription = description ?? (book ? (book.description?.bn || book.description) : fallback[1])
  const bookStats = book ? getBookRatingStats(book.id) : null
  const bookReviews = book ? getBookReviews(book.id).slice(0, 5) : []
  const canonical = `${window.location.origin}${location.pathname}`
  const privateRoute = ['/checkout', '/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/dashboard')
  const jsonLd = structuredData ?? (
    book
      ? {
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: book.title?.bn || book.title,
          author: { '@type': 'Person', name: book.author?.bn || book.author },
          image: book.cover,
          description: book.description?.bn || book.description,
          offers: { '@type': 'Offer', priceCurrency: 'BDT', price: String(book.price).replace(/[^\d.]/g, ''), availability: 'https://schema.org/InStock' },
          ...(bookStats?.total > 0 ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: bookStats.average.toFixed(1),
              reviewCount: bookStats.total,
              bestRating: 5,
              worstRating: 1,
            },
            review: bookReviews.map((review) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: review.userName },
              datePublished: review.createdAt,
              reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
              reviewBody: review.comment,
            })),
          } : {}),
        }
      : location.pathname === '/'
        ? { '@context': 'https://schema.org', '@type': 'Organization', name: 'হসন্ত প্রকাশন', url: window.location.origin, logo: `${window.location.origin}/favicon.svg` }
        : null
  )

  return (
    <Helmet>
      <html lang="bn" />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonical} />
      {(noIndex || privateRoute) && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content={book ? 'book' : 'website'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}
      {book && <meta property="og:image" content={book.cover} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}

export default SEO
