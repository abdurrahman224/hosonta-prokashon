import { useMemo, useState } from 'react'
import { FiFileText, FiSearch } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import MagazineCard from '../../../components/common/MagazineCard'
import SearchBar from '../../../components/common/SearchBar'
import { getStoredMagazines } from '../../../utils/moderationStorage'
import useSearch from '../../../hooks/useSearch'

function Magazine() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [magazines] = useState(getStoredMagazines)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? 'all'
  const categoryName = (value) =>
    typeof value === 'object' ? (value?.bn || value?.name || '') : String(value ?? '')
  const categories = [{ id: 'all', name: 'সব' }, ...[...new Map(
    magazines.map((post) => [categoryName(post.category), categoryName(post.category)]),
  ).values()].map((name) => ({ id: name, name }))]
  const { results } = useSearch(
    magazines.filter((magazine) => magazine.status === 'published'),
    ['title', 'excerpt', 'category'],
    query,
  )

  const visiblePosts = useMemo(
    () =>
      results.filter((post) =>
        category === 'all' || categoryName(post.category) === category,
      ),
    [category, results],
  )

  const updateParam = (name, value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      nextParams.set(name, value)
    } else {
      nextParams.delete(name)
    }
    setSearchParams(nextParams)
  }

  return (
    <div className="bg-cream">
      <section className="bg-dark px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            হসন্ত প্রকাশন
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold md:text-5xl">
            আমাদের Magazine
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/65">
            বই, লেখা ও প্রকাশনার জগতের নানা ভাবনা ও নির্বাচিত লেখা পড়ুন।
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <SearchBar
          key={query}
          value={query}
          onChange={(value) => updateParam('q', value)}
          placeholder="Magazine খুঁজুন..."
          className="w-full md:max-w-md"
        />
        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => updateParam('category', item.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                category === item.id
                  ? 'bg-primary text-dark'
                  : 'border border-dark/10 bg-white text-dark-muted hover:border-primary hover:text-dark'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        {visiblePosts.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <MagazineCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyMagazineState onReset={() => setSearchParams({})} />
        )}
      </main>
    </div>
  )
}

function EmptyMagazineState({ onReset }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-xl border border-dashed border-dark/20 bg-white px-6 py-16 text-center">
      <FiFileText className="mx-auto text-5xl text-primary-hover" />
      <h2 className="mt-5 font-heading text-2xl font-bold text-dark">
        কোনো Magazine পাওয়া যায়নি
      </h2>
      <p className="mt-3 leading-7 text-dark-muted">
        অন্য কোনো শব্দ বা ক্যাটাগরি দিয়ে আবার চেষ্টা করুন।
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray"
      >
        <FiSearch /> সব Magazine দেখুন
      </button>
    </div>
  )
}

export default Magazine
