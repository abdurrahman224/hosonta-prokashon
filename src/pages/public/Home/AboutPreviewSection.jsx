import { useState, useEffect } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const images = [
  {
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80',
    alt: 'বই পড়ছেন একজন পাঠক',
  },
  {
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80',
    alt: 'সুন্দর বইয়ের সংগ্রহ',
  },
  {
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1000&q=80',
    alt: 'উন্মুক্ত বইয়ের পাতা ও সাহিত্যের ছোঁয়া',
  },
  {
    url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1000&q=80',
    alt: 'লাইব্রেরিতে সাজানো বইয়ের সারি',
  },
  {
    url: 'https://images.unsplash.com/photo-1507842229451-7f01be8610ce?auto=format&fit=crop&w=1000&q=80',
    alt: 'আলোকিত বুকস্টোর ও পাঠাগার',
  },
]

function AboutPreviewSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="bg-white px-3.5 md:px-8 py-6 md:py-10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div className="relative mx-auto w-full max-w-lg">
          <div className="relative h-80 w-full overflow-hidden rounded-xl shadow-md md:h-[26rem]">
            {images.map((image, index) => (
              <img
                key={image.url}
                src={image.url}
                alt={image.alt}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
                  index === currentIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            ))}

            {/* Indicator dots */}
            <div className="absolute bottom-3 left-3 z-10 flex gap-1.5 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur-sm">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`ছবি ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-5 bg-primary'
                      : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="absolute -bottom-5 -right-3 z-20 rounded-lg bg-primary px-5 py-4 shadow-lg md:-right-5">
            <p className="font-heading text-2xl font-bold text-dark">১২ বছর</p>
            <p className="text-sm text-dark/70">সাহিত্যের সঙ্গে</p>
          </div>
        </div>
        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
            আমাদের কথা
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-dark md:text-4xl">
            শব্দের ভেতর দিয়ে
            <span className="block">মানুষের কাছে পৌঁছাই</span>
          </h2>
          <p className="mt-5 leading-8 text-dark-muted">
            হসন্ত প্রকাশন বিশ্বাস করে, একটি ভালো বই মানুষের চিন্তা বদলাতে পারে। তাই আমরা যত্ন নিয়ে বেছে নিই প্রতিটি পাণ্ডুলিপি, আর ভালোবাসা দিয়ে পৌঁছে দিই পাঠকের হাতে।
          </p>
          <Link
            to="/about"
            className="mt-7 inline-flex items-center gap-2 font-semibold text-dark transition hover:text-primary-hover"
          >
            আমাদের সম্পর্কে জানুন <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AboutPreviewSection
