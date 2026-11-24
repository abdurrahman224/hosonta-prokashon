import { FiStar } from 'react-icons/fi';

const testimonials = [
  {
    name: 'মাহমুদা রহমান',
    role: 'পাঠক',
    quote: 'হসন্ত প্রকাশনীর বইগুলোতে গল্পের পাশাপাশি যত্নের ছাপও স্পষ্ট।',
  },
  {
    name: 'আরিফুল ইসলাম',
    role: 'লেখক',
    quote:
      'নতুন লেখকদের জন্য এমন একটি আন্তরিক প্রকাশনা পরিবার সত্যিই অনুপ্রেরণার।',
  },
  {
    name: 'তাসনিম হক',
    role: 'বইপ্রেমী',
    quote: 'প্রচ্ছদ থেকে সম্পাদনা—প্রতিটি বইয়ের মান আমাকে মুগ্ধ করেছে।',
  },
  {
    name: 'সাদিয়া আফরিন',
    role: 'পাঠক',
    quote:
      'বইয়ের ছাপা ও কাগজের মান চমৎকার। হাতে নিলেই বোঝা যায় যত্ন নিয়ে বানানো।',
  },
  {
    name: 'রাকিবুল হাসান',
    role: 'লেখক',
    quote:
      'পাণ্ডুলিপি জমা দেওয়া থেকে প্রকাশ পর্যন্ত প্রতিটি ধাপে আন্তরিক সহযোগিতা পেয়েছি।',
  },
  {
    name: 'নুসরাত জাহান',
    role: 'বইপ্রেমী',
    quote: 'ভালো বইয়ের সন্ধানে এখন প্রথমেই হসন্ত প্রকাশনীর তালিকা দেখি।',
  },
  {
    name: 'ফাহিম আহমেদ',
    role: 'পাঠক',
    quote: 'অর্ডার করার পর দ্রুত বই হাতে পেয়েছি, প্যাকেজিংও ছিল খুব সুন্দর।',
  },
  {
    name: 'তানজিলা সুলতানা',
    role: 'লেখক',
    quote:
      'সম্পাদনার সময় লেখার মূল সুর অক্ষুণ্ণ রেখে যে পরামর্শ পেয়েছি, তা অমূল্য।',
  },
];

function TestimonialsSection() {
  return (
    <section className="bg-cream py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="px-5 md:px-8">
          <h2 className="font-heading text-xl font-bold text-dark md:text-2xl">
            পাঠকের ভালোবাসা
          </h2>
          <p className="mt-1 text-sm text-dark-muted">
            যাঁরা আমাদের সঙ্গে আছেন, তাঁদের কিছু কথা।
          </p>
        </div>

        {/* Mobile: horizontal scroll · md+: grid */}
        <div
          className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:snap-none md:grid-cols-2 md:gap-4 md:overflow-visible md:px-8 md:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          aria-label="পাঠকদের মতামত"
        >
          {testimonials.map(item => (
            <article
              key={item.name}
              className="flex w-[78%] shrink-0 snap-start flex-col justify-between rounded-lg border border-dark/10 bg-white p-4 sm:w-[46%] md:w-auto md:p-5"
            >
              <div>
                <div className="flex gap-0.5 text-sm text-primary">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="fill-current" />
                  ))}
                </div>
                <p className="mt-2.5 text-sm leading-6 text-dark-muted">
                  “{item.quote}”
                </p>
              </div>
              <div className="mt-4 border-t border-dark/10 pt-3">
                <p className="font-heading text-sm font-bold text-dark">
                  {item.name}
                </p>
                <p className="text-xs text-dark-muted">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
