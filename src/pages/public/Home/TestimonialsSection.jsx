import { FiStar } from 'react-icons/fi'

const testimonials = [
  {
    name: 'মাহমুদা রহমান',
    role: 'পাঠক',
    quote: 'হসন্ত প্রকাশনের বইগুলোতে গল্পের পাশাপাশি যত্নের ছাপও স্পষ্ট।',
  },
  {
    name: 'আরিফুল ইসলাম',
    role: 'লেখক',
    quote: 'নতুন লেখকদের জন্য এমন একটি আন্তরিক প্রকাশনা পরিবার সত্যিই অনুপ্রেরণার।',
  },
  {
    name: 'তাসনিম হক',
    role: 'বইপ্রেমী',
    quote: 'প্রচ্ছদ থেকে সম্পাদনা—প্রতিটি বইয়ের মান আমাকে মুগ্ধ করেছে।',
  },
]

function TestimonialsSection() {
  return (
    <section className="bg-cream px-3.5 py- md:px-6 ">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
            পাঠকের ভালোবাসা
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-dark md:text-4xl">
            যারা আমাদের সঙ্গে আছেন
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="flex flex-col justify-between rounded-xl border border-dark/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="flex gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="fill-current" />
                  ))}
                </div>
                <p className="mt-4 leading-7 text-dark-muted">“{item.quote}”</p>
              </div>
              <div className="mt-6 border-t border-dark/10 pt-4">
                <p className="font-heading font-bold text-dark">{item.name}</p>
                <p className="text-xs text-dark-muted">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
