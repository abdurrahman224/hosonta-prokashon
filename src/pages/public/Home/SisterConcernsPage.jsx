import { FiExternalLink } from 'react-icons/fi';

/* ---------- আপনার অঙ্গ প্রতিষ্ঠানের তালিকা (এখানে নিজের তথ্য বসান) ---------- */

const concerns = [
  {
    name: 'Sera Publication',
    tagline: 'প্রকাশনা ও বই বিক্রয়',
    logo: '/src/assets/sera-publication.jpg', // লোগোর লিংক দিলে দেখাবে, না দিলে প্রথম অক্ষর
    url: 'https://www.facebook.com/p/%E0%A6%B8%E0%A7%87%E0%A6%B0%E0%A6%BE-%E0%A6%AA%E0%A6%BE%E0%A6%AC%E0%A6%B2%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%B6%E0%A6%A8-61578343138400/',
  },
  {
    name: 'Bhrammoman Dukan',
    tagline: 'দোকান আমাদের ঠিকানা না… আমরা পথেই গল্প বিক্রি করি',
    logo: '/src/assets/bhrammomandukan.jpg',
    url: 'https://www.facebook.com/bhrammomandukan/?locale=bn_IN',
  },
  {
    name: 'হালাল উপার্জন',
    tagline: 'হালাল উপার্জন- এখন উপার্জন হবে ঘরে বসে।',
    logo: '/src/assets/Halal-earning.jpg',
    url: 'https://www.facebook.com/profile.php?id=61553194542584&locale=bn_IN',
  },
  {
    name: 'Karvan Publication',
    tagline: 'আসুন, পাঠ করি, জানি এবং নিজেকে গড়ি—এক সোনালী ভোরের প্রত্যাশায়।"',
    logo: '/src/assets/karvan-publication.jpg',
    url: 'https://www.facebook.com/karvan.publication/',
  },
  {
    name: 'হসন্ত প্রকাশন',
    tagline: 'হসন্ত প্রকাশনী – হৃদয়কে জাগায়, চিন্তাকে আলো দেয়।',
    logo: '/src/assets/hosonta-prokashon.jpg',
    url: '#',
  },
];

/* ---------- অ্যানিমেশন (ডুপ্লিকেট করা তালিকা ৫০% সরলেই লুপ মিলে যায়) ---------- */

const styles = `
@keyframes sc-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.sc-track {
  display: flex;
  width: max-content;
  animation: sc-marquee var(--sc-speed, 40s) linear infinite;
}
.sc-pause:hover .sc-track,
.sc-pause:focus-within .sc-track {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .sc-track { animation: none; }
  .sc-scroll { overflow-x: auto; }
}
`;

/* ---------- হেডলাইন স্ট্রিপ (সংবাদের মতো শুধু নাম চলবে) ---------- */

function HeadlineTicker() {
  const loop = [...concerns, ...concerns];

  return (
    <div className="flex items-stretch overflow-hidden rounded-md bg-slate-950 text-white">
      <div className="z-10 flex shrink-0 items-center bg-red-600 px-3 text-xs font-semibold md:px-5 md:text-base">
        আমাদের প্রতিষ্ঠান
      </div>

      <div className="sc-pause sc-scroll relative flex-1 overflow-hidden">
        <div className="sc-track" style={{ '--sc-speed': '30s' }}>
          {loop.map((item, i) => (
            <a
              key={`${item.name}-${i}`}
              href={item.url}
              aria-hidden={i >= concerns.length}
              tabIndex={i >= concerns.length ? -1 : 0}
              className="flex items-center gap-3 whitespace-nowrap px-5 py-3 text-xs hover:text-red-300 md:text-base"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="font-medium">{item.name}</span>
              <span className="text-slate-400">{item.tagline}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- কার্ডের সারি (এটাও থামবে না, হোভারে থামবে) ---------- */

function ConcernCard({ item, hidden }) {
  return (
    <a
      href={item.url}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      className="group mr-3 flex w-56 shrink-0 items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-red-400 md:mr-5 md:w-72 md:gap-4 md:p-4"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 md:h-16 md:w-16">
        {item.logo ? (
          <img
            src={item.logo}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-heading text-lg font-semibold text-slate-400 md:text-2xl">
            {item.name.charAt(0)}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-950 md:text-base">
          {item.name}
        </span>
        <span className="block truncate text-xs text-slate-500 md:text-sm">
          {item.tagline}
        </span>
      </span>

      <FiExternalLink className="shrink-0 text-slate-400 transition group-hover:text-red-600" />
    </a>
  );
}

function ConcernMarquee() {
  // কম আইটেম থাকলে ফাঁকা না থাকতে আগে ২ বার, তারপর পুরোটা আবার ডুপ্লিকেট
  const half = [...concerns, ...concerns];
  const loop = [...half, ...half];

  return (
    <div className="sc-pause sc-scroll overflow-hidden">
      <div className="sc-track" style={{ '--sc-speed': '45s' }}>
        {loop.map((item, i) => (
          <ConcernCard
            key={`${item.name}-${i}`}
            item={item}
            hidden={i >= concerns.length}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- পেইজ ---------- */

function SisterConcernsPage() {
  return (
    <main className="bg-cream px-4 py-6 md:px-6 md:py-10">
      <style>{styles}</style>

      <div className="mx-auto max-w-7xl space-y-5 md:space-y-8">
        <header>
          <h1 className="font-heading text-xl font-semibold text-slate-950 md:text-3xl">
            আমাদের অঙ্গ প্রতিষ্ঠান
          </h1>
          <p className="mt-1 text-xs text-slate-600 md:text-base">
            একই পরিবারের সবগুলো প্রতিষ্ঠান এক জায়গায়।
          </p>
        </header>

        {/* <HeadlineTicker /> */}
        <ConcernMarquee />
      </div>
    </main>
  );
}

export default SisterConcernsPage;
