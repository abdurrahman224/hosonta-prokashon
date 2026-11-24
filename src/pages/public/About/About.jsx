import { FiBookOpen, FiHeart, FiTarget } from 'react-icons/fi'
import authors from '../../../data/authors'

function About() {
  const team = [
    {
      name: 'মাহমুদা রহমান',
      role: 'প্রকাশক ও প্রতিষ্ঠাতা',
      photo: authors[0].photo,
    },
    {
      name: 'সামিরা হক',
      role: 'সম্পাদক',
      photo: authors[2].photo,
    },
    {
      name: 'আদনান কবীর',
      role: 'সৃজনশীল পরিচালক',
      photo: authors[3].photo,
    },
  ]

  return (
    <div className="bg-cream">
      <section className="bg-dark px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            হসন্ত প্রকাশন
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold md:text-5xl">
            আমাদের সম্পর্কে
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/65">
            শব্দ, মানুষ ও সাহিত্যের প্রতি ভালোবাসা থেকে আমাদের পথচলা।
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <img
            src="https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1000&q=80"
            alt="বই নিয়ে কাজ করছেন প্রকাশনা দলের সদস্যরা"
            className="h-80 w-full rounded-xl object-cover shadow-lg md:h-[28rem]"
          />
          <div>
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
              আমাদের গল্প
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-dark md:text-4xl">
              পাঠকের হাতে পৌঁছাক
              <span className="block">ভালো গল্প</span>
            </h2>
            <p className="mt-5 leading-8 text-dark-muted">
              হসন্ত প্রকাশনের যাত্রা শুরু হয়েছিল বাংলা ভাষা ও সাহিত্যের প্রতি গভীর ভালোবাসা থেকে। আমরা বিশ্বাস করি, একটি ভালো বই শুধু গল্প বলে না—পাঠকের চিন্তা, অনুভূতি ও পৃথিবী দেখার চোখও বদলে দেয়।
            </p>
            <p className="mt-4 leading-8 text-dark-muted">
              নতুন লেখকের কণ্ঠকে সামনে আনা এবং মানসম্মত বইকে সবার কাছে পৌঁছে দেওয়াই আমাদের প্রতিদিনের কাজ।
            </p>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          <ValueCard
            icon={<FiTarget />}
            title="আমাদের লক্ষ্য"
            description="বাংলা ভাষায় বৈচিত্র্যময়, চিন্তাশীল ও পাঠযোগ্য বই প্রকাশ করা।"
          />
          <ValueCard
            icon={<FiBookOpen />}
            title="আমাদের উদ্দেশ্য"
            description="লেখক ও পাঠকের মধ্যে একটি আন্তরিক, দীর্ঘস্থায়ী সেতু তৈরি করা।"
          />
          <ValueCard
            icon={<FiHeart />}
            title="আমাদের মূল্যবোধ"
            description="সততা, যত্ন ও সাহিত্যের প্রতি দায়বদ্ধতাকে প্রতিটি কাজে ধরে রাখা।"
          />
        </section>

        <section className="mt-24">
          <div className="text-center">
            <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary-hover">
              আমাদের মানুষ
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-dark md:text-4xl">
              যে দলটি গল্পকে পাঠকের কাছে পৌঁছে দেয়
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
            {team.map((member) => (
              <article key={member.name} className="rounded-xl bg-white p-5 text-center shadow-sm">
                <img
                  src={member.photo}
                  alt={`${member.name}-এর ছবি`}
                  className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-primary/20"
                  loading="lazy"
                />
                <h3 className="mt-5 font-heading text-xl font-bold text-dark">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-dark-muted">{member.role}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function ValueCard({ icon, title, description }) {
  return (
    <article className="rounded-xl border border-dark/10 bg-white p-7 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-2xl text-dark">
        {icon}
      </span>
      <h3 className="mt-5 font-heading text-xl font-bold text-dark">{title}</h3>
      <p className="mt-2 leading-7 text-dark-muted">{description}</p>
    </article>
  )
}

export default About
