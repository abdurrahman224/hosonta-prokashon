import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function AboutPreviewSection() {
  return (
    <section className="bg-white px-3.5  md:px-8 py-6 md:py-10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 ">
        <div className="relative mx-auto w-full max-w-lg">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80"
            alt="বই পড়ছেন একজন পাঠক"
            className="h-80 w-full rounded-xl object-cover md:h-[26rem]"
            loading="lazy"
          />
          <div className="absolute -bottom-5 -right-3 rounded-lg bg-primary px-5 py-4 shadow-lg md:-right-5">
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
