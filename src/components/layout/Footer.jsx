import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiYoutube } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const quickLinks = [
  { key: 'home', to: '/', label: 'হোম' },
  { key: 'books', to: '/books', label: 'বই' },
  { key: 'authors', to: '/authors', label: 'লেখক' },
  { key: 'about', to: '/about', label: 'আমাদের সম্পর্কে' },
]

function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="inline-block">
            <span className="block font-heading text-3xl font-bold text-primary">
              হসন্ত
            </span>
            <span className="block text-sm tracking-[0.25em] text-white/70">
              প্রকাশন
            </span>
          </Link>
          <p className="mt-5 max-w-md leading-8 text-white/65">
            বাংলা সাহিত্য, জ্ঞান ও সৃজনশীলতার সমৃদ্ধ প্রকাশনা। পাঠকের হাতে মানসম্মত বই পৌঁছে দেওয়াই আমাদের অঙ্গীকার।
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-white">দ্রুত লিংক</h2>
          <ul className="mt-4 space-y-3">
            {quickLinks.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-white/65 transition hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-white">যোগাযোগ</h2>
          <ul className="mt-4 space-y-3 text-white/65">
            <li className="flex items-start gap-3">
              <FiMapPin className="mt-1 shrink-0 text-primary" />
              <span>ঢাকা, বাংলাদেশ</span>
            </li>
            <li className="flex items-center gap-3">
              <FiPhone className="shrink-0 text-primary" />
              <span>+৮৮০ ১৭১১-০০০০০০</span>
            </li>
            <li className="flex items-center gap-3">
              <FiMail className="shrink-0 text-primary" />
              <span>info@hosontoprokashon.com</span>
            </li>
          </ul>
          <div className="mt-6 flex gap-3">
            <a
              href="https://www.facebook.com/hosontoprokashoni/"
              target="_blank"
              rel="noreferrer"
              aria-label="ফেসবুক"
              className="rounded-full border border-white/15 p-2.5 text-white/70 transition hover:border-primary hover:text-primary"
            >
              <FiFacebook />
            </a>
            <a
              href="#instagram"
              aria-label="ইনস্টাগ্রাম"
              className="rounded-full border border-white/15 p-2.5 text-white/70 transition hover:border-primary hover:text-primary"
            >
              <FiInstagram />
            </a>
            <a
              href="#youtube"
              aria-label="ইউটিউব"
              className="rounded-full border border-white/15 p-2.5 text-white/70 transition hover:border-primary hover:text-primary"
            >
              <FiYoutube />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-center text-sm text-white/50 md:px-8">
          © {new Date().getFullYear()} হসন্ত প্রকাশন। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </footer>
  )
}

export default Footer
