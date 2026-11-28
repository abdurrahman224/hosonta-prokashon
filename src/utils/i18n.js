export const DEFAULT_LANGUAGE = 'en';

export function getLocalizedValue(value, lang = DEFAULT_LANGUAGE) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => getLocalizedValue(item, lang));
  if (typeof value === 'object') {
    if (value[lang]) return getLocalizedValue(value[lang], lang);
    if (value.en) return getLocalizedValue(value.en, lang);
    if (value.bn) return getLocalizedValue(value.bn, lang);
    if (value.title) return getLocalizedValue(value.title, lang);
    if (value.name) return getLocalizedValue(value.name, lang);
    if (value.label) return getLocalizedValue(value.label, lang);
  }
  return '';
}

export const MAGAZINE_CATEGORIES = [
  { id: 'literature', en: 'Literature', bn: 'সাহিত্য' },
  { id: 'reading', en: 'Reading Habits', bn: 'পাঠাভ্যাস' },
  { id: 'writing', en: 'Writing', bn: 'লেখালেখি' },
  { id: 'publishing', en: 'Publishing', bn: 'প্রকাশনা' },
  { id: 'children', en: 'Children & Youth', bn: 'শিশু-কিশোর' },
  { id: 'other', en: 'Other', bn: 'অন্যান্য' },
];

export function getMagazineCategoryLabel(category, lang = DEFAULT_LANGUAGE) {
  if (!category) return '';
  if (typeof category === 'object') return getLocalizedValue(category, lang);
  const raw = String(category).trim();
  const matched = MAGAZINE_CATEGORIES.find(
    c =>
      c.id.toLowerCase() === raw.toLowerCase() ||
      c.en.toLowerCase() === raw.toLowerCase() ||
      c.bn === raw,
  );
  if (matched) return lang === 'bn' ? matched.bn : matched.en;
  return raw;
}

export const BOOK_CATEGORY_TRANSLATIONS = {
  'বিয়ে ও সংসার': 'Marriage & Family',
  'সমকালীন উপন্যাস': 'Contemporary Fiction',
  'আত্মশুদ্ধি ও অনুপ্রেরণা': 'Self-Purification & Inspiration',
  'জীবনগঠন': 'Life Building',
  'শিক্ষা ও দীক্ষা': 'Education & Tarbiyah',
  'শিক্ষা ও পড়াশোনা': 'Education & Study',
  'সাহিত্য ও প্রবন্ধ': 'Literature & Essays',
  'সাহিত্য ও কবিতা': 'Literature & Poetry',
  'প্যারেন্টিং': 'Parenting',
  'তারুণ্য ও অনুপ্রেরণা': 'Youth & Inspiration',
  'তাফসীর ও কুরআন শিক্ষা': 'Tafsir & Quran Study',
  'হাদীস শরীফ': 'Hadith',
  'মৃত্যু ও পরকাল': 'Death & Hereafter',
  'আখলাক ও চরিত্র': 'Character & Ethics',
  'দোয়া ও যিকির': 'Dua & Dhikr',
  'সীরাতুন নবী': 'Seerah',
  'ইতিহাস ও সীরাত': 'History & Seerah',
  'ইতিহাস': 'History',
  'ঈমান ও আকীদা': 'Faith & Aqeedah',
  'ইসলামিক উপন্যাস': 'Islamic Fiction',
  'ইসলামী অর্থনীতি': 'Islamic Economics',
  'ইসলামি কবিতা': 'Islamic Poetry',
  'ঐতিহাসিক উপন্যাস': 'Historical Fiction',
  'ঐতিহাসিক ব্যক্তিত্ব ও সাহিত্যিক': 'Historical Figures & Writers',
  'কবিতা': 'Poetry',
  'কাব্যগ্রন্থ': 'Poetry Collection',
  'অনুবাদ কবিতা': 'Translated Poetry',
  'আধ্যাত্মিক কবিতা': 'Spiritual Poetry',
  'জাগরণী কবিতা': 'Awakening Poetry',
  'বিদ্রোহ ও জাগরণের কবিতা': 'Rebel & Awakening Poetry',
  'প্রকৃতির কবিতা': 'Nature Poetry',
  'প্রেমের কবিতা': 'Romantic Poetry',
  'সমকালীন কবিতা': 'Contemporary Poetry',
  'গল্প ও সাহিত্য': 'Stories & Literature',
  'অ্যাডভেঞ্চার উপন্যাস': 'Adventure Fiction',
  'রহস্য উপন্যাস': 'Mystery Fiction',
  'রাজনৈতিক উপন্যাস': 'Political Fiction',
  'রোমান্টিক উপন্যাস': 'Romantic Fiction',
  'মনস্তাত্ত্বিক উপন্যাস': 'Psychological Fiction',
  'সামাজিক উপন্যাস': 'Social Fiction',
  'সায়েন্স ফিকশন উপন্যাস': 'Science Fiction',
  'মনোবিজ্ঞান': 'Psychology',
  'দক্ষতা উন্নয়ন': 'Skill Development',
  'যোগাযোগ দক্ষতা': 'Communication Skills',
  'ব্যবসা ও ক্যারিয়ার': 'Business & Career',
  'ব্যবসা ও নেতৃত্ব': 'Business & Leadership',
  'নারীর অধিকার': 'Women Rights',
  'প্রযুক্তি': 'Technology',
  'প্রযুক্তি ও শিক্ষা': 'Technology & Education',
  'বিজ্ঞান': 'Science',
  'বিকল্প চিকিৎসা': 'Alternative Medicine',
  'স্বাস্থ্য ও চিকিৎসা': 'Health & Medicine',
  'ভাষা শিক্ষা': 'Language Learning',
  'ভ্রমণকাহিনী': 'Travelogue',
  'শিশু-কিশোর': 'Children & Youth',
  'সমকালীন চিন্তা': 'Contemporary Thought',
  General: 'General',
};

const REVERSE_BOOK_CATEGORY_TRANSLATIONS = Object.fromEntries(
  Object.entries(BOOK_CATEGORY_TRANSLATIONS).map(([bn, en]) => [
    en.toLowerCase(),
    bn,
  ]),
);

export function getCategoryLabel(category, lang = DEFAULT_LANGUAGE) {
  if (!category) return '';
  if (typeof category === 'object') return getLocalizedValue(category, lang);
  const raw = String(category).trim();
  if (lang === 'bn') {
    return REVERSE_BOOK_CATEGORY_TRANSLATIONS[raw.toLowerCase()] || raw;
  }
  return BOOK_CATEGORY_TRANSLATIONS[raw] || raw;
}
