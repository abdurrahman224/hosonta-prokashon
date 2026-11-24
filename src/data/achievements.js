const achievements = [
  {
    id: 1,
    type: 'image',
    category: 'awards',
    categoryLabel: 'সম্মাননা স্মারক',
    title: 'অমর একুশে বইমেলা সেরা প্রকাশনা পুরস্কার ২০২৫',
    subtitle: 'বাংলা একাডেমি প্রাঙ্গণ, ঢাকা',
    year: '২০২৫',
    date: 'ফেব্রুয়ারি ২০২৫',
    image:
      'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=1200&q=80',
    description:
      'সাহিত্য সাধনা, বিষয়বৈচিত্র্য ও দৃষ্টিনন্দন মুদ্রণমানের স্বীকৃতিস্বরূপ অমর একুশে বইমেলায় হসন্ত প্রকাশনকে প্রদান করা হয় বিশেষ প্রকাশনা সম্মাননা স্মারক।',
  },
  {
    id: 2,
    type: 'video',
    category: 'videos',
    categoryLabel: 'ভিডিও প্রতিবেদন',
    title: 'বইমেলা ২০২৫: হসন্ত প্রকাশন প্যাভিলিয়নের ঝলক ও পাঠকদের উচ্ছ্বাস',
    subtitle: 'বিশেষ মেলা পরিক্রমা ও প্রতিবেদন',
    year: '২০২৫',
    date: 'ফেব্রুয়ারি ২০২৫',
    duration: '০৩:২০',
    thumbnail:
      'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1',
    description:
      'অমর একুশে বইমেলায় হসন্ত প্রকাশনের প্যাভিলিয়নে পাঠকদের উপচে পড়া ভিড়, প্রিয় লেখকদের উপস্থিতি ও মেলা পরিবেশ নিয়ে বিশেষ ভিডিও প্রতিবেদন।',
  },
  {
    id: 3,
    type: 'image',
    category: 'awards',
    categoryLabel: 'সেরা প্রচ্ছদ',
    title: 'জাতীয় সাহিত্য ফোরামের শ্রেষ্ঠ প্রচ্ছদ ও মুদ্রণ স্মারক ২০২৪',
    subtitle: 'জাতীয় জাদুঘর মিলনায়তন',
    year: '২০২৪',
    date: 'ডিসেম্বর ২০২৪',
    image:
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1200&q=80',
    description:
      'সমকালীন উপন্যাস ও প্রবন্ধগ্রন্থের নান্দনিক প্রচ্ছদ পরিকল্পনা ও আন্তর্জাতিক মানের বাঁধাই-এর জন্য এই সম্মাননা লাভ করে হসন্ত প্রকাশন।',
  },
  {
    id: 4,
    type: 'video',
    category: 'events',
    categoryLabel: 'মোড়ক উন্মোচন',
    title: '১০টি নতুন বইয়ের জমকালো মোড়ক উন্মোচন ও সাহিত্য আড্ডা',
    subtitle: 'শীর্ষস্থানীয় লেখকদের মিলনমেলা',
    year: '২০২৪',
    date: 'অক্টোবর ২০২৪',
    duration: '০৪:১৫',
    thumbnail:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1',
    description:
      'দেশের প্রখ্যাত কবি, সাহিত্যিক ও গবেষকদের উপস্থিতিতে একযোগে হসন্ত প্রকাশনের ১০টি নতুন গ্রন্থের মোড়ক উন্মোচন ও অন্তরঙ্গ সাহিত্য আড্ডার বিশেষ মুহূর্তসমূহ।',
  },
  {
    id: 5,
    type: 'image',
    category: 'events',
    categoryLabel: 'আন্তর্জাতিক বইমেলা',
    title: 'আন্তর্জাতিক সাহিত্য উৎসবে হসন্ত প্রকাশনের বিশেষ অংশগ্রহণ',
    subtitle: 'আন্তর্জাতিক অঙ্গনে বাংলা সাহিত্য',
    year: '২০২৪',
    date: 'সেপ্টেম্বর ২০২৪',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    description:
      'আন্তর্জাতিক বইমেলায় বিশ্বদরবারে বাংলা ভাষার নির্বাচিত অনুবাদ গ্রন্থ ও ক্ল্যাসিক সাহিত্য উপস্থাপন এবং আয়োজক কমিটির বিশেষ সম্মাননা স্মারক অর্জন।',
  },
  {
    id: 6,
    type: 'video',
    category: 'videos',
    categoryLabel: 'লেখক সাক্ষাৎকার',
    title: 'একুশে পদকপ্রাপ্ত প্রবীণ সাহিত্যিকদের নিয়ে বিশেষ আলোচনা',
    subtitle: 'হসন্ত প্রকাশন স্টুডিও সেশন',
    year: '২০২৩',
    date: 'নভেম্বর ২০২৩',
    duration: '০৫:০৫',
    thumbnail:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1',
    description:
      'হসন্ত প্রকাশন থেকে প্রকাশিত গ্রন্থসমূহের সৃষ্টিপ্রক্রিয়া, সাহিত্যের ভবিষ্যৎ ও তরুণ পাঠকদের উদ্দেশে গুণী লেখকদের বিশেষ স্মৃতিচারণ ও অনুপ্রেরণামূলক কথামালা।',
  },
];

export default achievements;
