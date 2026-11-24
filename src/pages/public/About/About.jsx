import { FiBookOpen, FiHeart, FiTarget } from 'react-icons/fi';
import authors from '../../../data/authors';

const values = [
  {
    icon: <FiTarget />,
    title: 'আমাদের লক্ষ্য',
    description:
      'বাংলা ভাষায় বৈচিত্র্যময়, চিন্তাশীল ও পাঠযোগ্য বই প্রকাশ করা।',
  },
  {
    icon: <FiBookOpen />,
    title: 'আমাদের উদ্দেশ্য',
    description:
      'লেখক ও পাঠকের মধ্যে একটি আন্তরিক, দীর্ঘস্থায়ী সেতু তৈরি করা।',
  },
  {
    icon: <FiHeart />,
    title: 'আমাদের মূল্যবোধ',
    description:
      'সততা, যত্ন ও সাহিত্যের প্রতি দায়বদ্ধতাকে প্রতিটি কাজে ধরে রাখা।',
  },
];

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
  ];

  return (
    <div className="bg-cream">
      {/* Header */}
      <section className="bg-dark px-5 py-10 text-white md:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <p className="font-heading text-xs font-semibold tracking-wide text-primary">
            হসন্ত প্রকাশনী
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold md:text-3xl">
            আমাদের সম্পর্কে
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/65 md:text-base">
            শব্দ, মানুষ ও সাহিত্যের প্রতি ভালোবাসা থেকে আমাদের পথচলা।
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-5 py-8 md:space-y-14 md:px-8 md:py-12">
        {/* Story */}
        <section className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <img
            src="https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1000&q=80"
            alt="বই নিয়ে কাজ করছেন প্রকাশনা দলের সদস্যরা"
            className="h-56 w-full rounded-lg object-cover sm:h-64 md:h-80"
          />
          <div>
            <h2 className="font-heading text-xl font-bold leading-snug text-dark md:text-2xl">
              পাঠকের হাতে পৌঁছাক ভালো গল্প
            </h2>
            <p className="mt-3 text-sm leading-7 text-dark-muted md:text-base md:leading-8">
              হসন্ত প্রকাশনীর যাত্রা শুরু হয়েছিল বাংলা ভাষা ও সাহিত্যের প্রতি
              গভীর ভালোবাসা থেকে। আমরা বিশ্বাস করি, একটি ভালো বই শুধু গল্প বলে
              না—পাঠকের চিন্তা, অনুভূতি ও পৃথিবী দেখার চোখও বদলে দেয়।
            </p>
            <p className="mt-3 text-sm leading-7 text-dark-muted md:text-base md:leading-8">
              নতুন লেখকের কণ্ঠকে সামনে আনা এবং মানসম্মত বইকে সবার কাছে পৌঁছে
              দেওয়াই আমাদের প্রতিদিনের কাজ।
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="grid gap-3 md:grid-cols-3 md:gap-4">
          {values.map(item => (
            <ValueCard key={item.title} {...item} />
          ))}
        </section>

        {/* Team */}
        <section>
          <h2 className="font-heading text-xl font-bold text-dark md:text-2xl">
            আমাদের দল
          </h2>
          <p className="mt-1 text-sm text-dark-muted">
            যাঁরা গল্পকে পাঠকের কাছে পৌঁছে দেন।
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 md:gap-4">
            {team.map(member => (
              <article
                key={member.name}
                className="flex items-center gap-4 rounded-lg border border-dark/10 bg-white p-4 sm:flex-col sm:gap-0 sm:p-5 sm:text-center"
              >
                <img
                  src={member.photo}
                  alt={`${member.name}-এর ছবি`}
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/30 sm:h-20 sm:w-20"
                  loading="lazy"
                />
                <div className="sm:mt-3">
                  <h3 className="font-heading text-base font-bold text-dark">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-dark-muted">
                    {member.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ValueCard({ icon, title, description }) {
  return (
    <article className="flex items-start gap-3.5 rounded-lg border border-dark/10 bg-white p-4 md:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-xl text-dark">
        {icon}
      </span>
      <div>
        <h3 className="font-heading text-base font-bold text-dark">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-dark-muted">{description}</p>
      </div>
    </article>
  );
}

export default About;
