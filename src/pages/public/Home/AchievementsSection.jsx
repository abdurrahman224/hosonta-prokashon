import { useState, useEffect } from 'react';
import {
  FiAward,
  FiPlay,
  FiMaximize2,
  FiX,
  FiVideo,
  FiImage,
  FiCalendar,
  FiMapPin,
} from 'react-icons/fi';
import achievementsData from '../../../data/achievements';

const filterTabs = [
  { key: 'all', label: 'সবগুলো' },
  { key: 'awards', label: 'সম্মাননা ও পুরস্কার' },
  { key: 'videos', label: 'ভিডিও প্রতিবেদন' },
  { key: 'events', label: 'ইভেন্ট ও বইমেলা' },
];

function AchievementsSection() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedMedia(null);
    };
    if (selectedMedia) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMedia]);

  const filteredItems =
    activeTab === 'all'
      ? achievementsData
      : achievementsData.filter((item) => {
          if (activeTab === 'videos') return item.type === 'video';
          return item.category === activeTab;
        });

  return (
    <section className="bg-slate-50/60 px-3.5 py-8 md:px-8 md:py-14 border-y border-dark/5">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {/* <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-semibold text-dark">
            <FiAward className="text-amber-600" />
            <span>আমাদের প্রাপ্তি ও অর্জন</span>
          </div> */}

          <h2 className="mt-3 font-heading text-base font-bold text-dark sm:text-2xl ">
            আমাদের প্রাপ্তি ও অর্জন{' '}
          </h2>

          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed">
            পাঠকপ্রিয়তা ও গুণগত প্রকাশনার মেলবন্ধনে হসন্ত প্রকাশনের দীর্ঘ পথচলার
            বিভিন্ন জাতীয় সম্মাননা, বইমেলার স্মৃতি এবং ভিডিও প্রতিবেদন।
          </p>

          {/* Filter Tabs */}
          {/* <div className="mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {filterTabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-dark font-semibold shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-dark ring-1 ring-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div> */}
        </div>

        {/* Media Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => {
            const isVideo = item.type === 'video';
            const displayImage = isVideo ? item.thumbnail : item.image;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-dark/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
              >
                {/* Media Thumbnail Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={displayImage}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                      {isVideo ? (
                        <>
                          <FiVideo className="text-red-400" />
                          <span>ভিডিও</span>
                        </>
                      ) : (
                        <>
                          <FiImage className="text-amber-300" />
                          <span>ছবি</span>
                        </>
                      )}
                    </span>
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-800 backdrop-blur-sm">
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* Year Tag */}
                  <div className="absolute right-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-dark/70 px-2.5 py-0.5 text-[11px] font-semibold text-primary backdrop-blur-md">
                      <FiCalendar className="text-[10px]" />
                      <span>{item.year}</span>
                    </span>
                  </div>

                  {/* Center Play Button for Video or View Button for Photo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideo ? (
                      <div className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/95 text-dark shadow-lg ring-4 ring-white/40 transition-transform duration-300 group-hover:scale-110">
                        <FiPlay className="ml-1 text-xl sm:text-2xl" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-dark opacity-0 shadow-md backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
                        <FiMaximize2 className="text-lg" />
                      </div>
                    )}
                  </div>

                  {/* Video duration if applicable */}
                  {isVideo && item.duration && (
                    <span className="absolute bottom-2.5 right-3 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {item.duration}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  {item.subtitle && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                      <FiMapPin className="shrink-0 text-slate-400" />
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                  )}

                  <h3 className="mt-1.5 font-heading text-sm sm:text-base font-bold leading-snug text-dark group-hover:text-primary-hover transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-dark-muted line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {item.date}
                    </span>
                    <span className="text-xs font-semibold text-primary-hover group-hover:underline flex items-center gap-1">
                      {isVideo ? 'ভিডিও দেখুন' : 'ছবি বিস্তারিত'} &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox / Video Modal */}
      {selectedMedia && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-sm transition-opacity"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-dark">
                  {selectedMedia.categoryLabel}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedMedia.year}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                aria-label="বন্ধ করুন"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-dark"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Media Body */}
            <div className="relative overflow-y-auto">
              {selectedMedia.type === 'video' ? (
                <div className="relative aspect-video w-full bg-black">
                  <iframe
                    src={selectedMedia.videoUrl}
                    title={selectedMedia.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <div className="relative max-h-[60vh] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={selectedMedia.image}
                    alt={selectedMedia.title}
                    className="max-h-[60vh] w-full object-contain"
                  />
                </div>
              )}

              {/* Modal Description */}
              <div className="p-4 sm:p-6">
                {selectedMedia.subtitle && (
                  <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
                    <FiMapPin className="text-slate-400" />
                    <span>{selectedMedia.subtitle}</span>
                    <span className="mx-1">•</span>
                    <span>{selectedMedia.date}</span>
                  </p>
                )}
                <h3 className="mt-1 font-heading text-lg sm:text-xl font-bold text-dark">
                  {selectedMedia.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-dark-muted">
                  {selectedMedia.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AchievementsSection;
