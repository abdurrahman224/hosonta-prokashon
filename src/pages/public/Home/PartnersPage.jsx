import { FiExternalLink } from 'react-icons/fi';

/* ---------- আপনার পার্টনারদের তালিকা (এখানে নিজের তথ্য বসান) ---------- */

const partners = [
  {
    name: 'পার্টনারের নাম ১',
    tagline: 'কুরিয়ার সার্ভিস',
    logo: '', // লোগোর লিংক দিলে দেখাবে, না দিলে প্রথম অক্ষর
    url: '#',
  },
  {
    name: 'পার্টনারের নাম ২',
    tagline: 'ডেলিভারি পার্টনার',
    logo: '',
    url: '#',
  },
  {
    name: 'পার্টনারের নাম ৩',
    tagline: 'পেমেন্ট পার্টনার',
    logo: '',
    url: '#',
  },
  {
    name: 'পার্টনারের নাম ৪',
    tagline: 'প্রকাশনী পার্টনার',
    logo: '',
    url: '#',
  },
  {
    name: 'পার্টনারের নাম ৫',
    tagline: 'বিতরণ ও সরবরাহ',
    logo: '',
    url: '#',
  },
];

/* ---------- অ্যানিমেশন ---------- */

const styles = `
@keyframes pt-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.pt-track {
  display: flex;
  width: max-content;
  animation: pt-marquee var(--pt-speed, 40s) linear infinite;
}
.pt-pause:hover .pt-track,
.pt-pause:focus-within .pt-track {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .pt-track { animation: none; }
  .pt-scroll { overflow-x: auto; }
}
`;

/* ---------- হেডলাইন স্ট্রিপ ---------- */

function HeadlineTicker() {
  const loop = [...partners, ...partners];

  return (
    <div className="flex items-stretch overflow-hidden rounded-md bg-slate-950 text-white">
      <div className="z-10 flex shrink-0 items-center bg-red-600 px-3 text-xs font-semibold md:px-5 md:text-base">
        আমাদের পার্টনার
      </div>

      <div className="pt-pause pt-scroll relative flex-1 overflow-hidden">
        <div className="pt-track" style={{ '--pt-speed': '30s' }}>
          {loop.map((item, i) => (
            <a
              key={`${item.name}-${i}`}
              href={item.url}
              aria-hidden={i >= partners.length}
              tabIndex={i >= partners.length ? -1 : 0}
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

/* ---------- কার্ডের সারি ---------- */

function PartnerCard({ item, hidden }) {
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

function PartnerMarquee() {
  const half = [...partners, ...partners];
  const loop = [...half, ...half];

  return (
    <div className="pt-pause pt-scroll overflow-hidden">
      <div className="pt-track" style={{ '--pt-speed': '45s' }}>
        {loop.map((item, i) => (
          <PartnerCard
            key={`${item.name}-${i}`}
            item={item}
            hidden={i >= partners.length}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- পেইজ ---------- */

function PartnersPage() {
  return (
    <main className="bg-cream px-4 py-6 md:px-6 md:py-10">
      <style>{styles}</style>

      <div className="mx-auto max-w-7xl space-y-5 md:space-y-8">
        <header>
          <h1 className="font-heading text-xl font-semibold text-slate-950 md:text-3xl">
            আমাদের পার্টনার
          </h1>
          <p className="mt-1 text-xs text-slate-600 md:text-base">
            যাঁদের সাথে কাজ করে আমরা বই পৌঁছে দিই পাঠকের হাতে।
          </p>
        </header>

        {/* <HeadlineTicker /> */}
        <PartnerMarquee />
      </div>
    </main>
  );
}

export default PartnersPage;
