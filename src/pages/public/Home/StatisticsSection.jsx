import { useEffect, useRef, useState } from 'react';
import { FiBookOpen, FiCheckCircle, FiPenTool, FiUsers } from 'react-icons/fi';

const bn = new Intl.NumberFormat('bn-BD');

// সেকশন স্ক্রিনে এলে একবারই true হবে
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ০ থেকে end পর্যন্ত কাউন্ট করে
function CountUp({ end, suffix = '', start, duration = 2000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) {
      setCount(end);
      return;
    }

    let frame;
    const startTime = performance.now();

    const tick = now => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, end, duration]);

  return (
    <>
      {bn.format(count)}
      {suffix}
    </>
  );
}

function StatisticsSection() {
  const [sectionRef, inView] = useInView(0.3);

  const statistics = [
    { icon: FiBookOpen, end: 80, suffix: '+', label: 'প্রকাশিত বই' },
    { icon: FiPenTool, end: 45, suffix: '+', label: 'নিবেদিত লেখক' },
    { icon: FiUsers, end: 12, suffix: ' হাজার+', label: 'আনন্দিত পাঠক' },
    { icon: FiCheckCircle, end: 4, suffix: '', label: 'বছরের যাত্রা' },
  ];

  return (
    <section ref={sectionRef} className="bg-dark px-5 py-16 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
        {statistics.map((stat, index) => (
          <div
            key={stat.label}
            style={{ transitionDelay: `${index * 150}ms` }}
            className={`text-center transition-all duration-700 ease-out ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl text-primary transition-transform duration-300 hover:scale-110">
              <stat.icon />
            </span>
            <p className="mt-4 font-heading text-3xl font-bold text-white md:text-4xl">
              <CountUp end={stat.end} suffix={stat.suffix} start={inView} />
            </p>
            <p className="mt-1 text-sm text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatisticsSection;
