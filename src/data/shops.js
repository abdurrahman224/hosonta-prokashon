/**
 * shops.js - Hosonta Prokashon Bookshop & Counter Customer Database
 * Holds profile information, contact details, trade licensing, and notes for physical bookstores
 * and wholesale counter clients.
 */

export const initialShops = [
  {
    id: 'shop-batighar',
    shopName: 'বাতিঘর বুকশপ',
    ownerName: 'জাফর ইকবাল (ব্যবস্থাপক)',
    representative: 'জাফর ইকবাল',
    phone: '০১৭১১২৩৪৫৬৭',
    altPhone: '০২-৯৬৬৭৭৮৮',
    email: 'batighar.dhaka@gmail.com',
    address: 'বিশ্বসাহিত্য কেন্দ্র (২য় তলা), বাংলামোটর, ঢাকা-১০০০',
    district: 'ঢাকা',
    established: '২০১২',
    tradeLicense: 'TRD-DHK-48291',
    category: 'পাইকারি ও রিটেইল বুকশপ',
    defaultCommission: 35,
    status: 'vip',
    notes: 'বিশ্বসাহিত্য কেন্দ্র শাখা, নিয়মিত পাইকারি বই সরবরাহকারী ও প্রিমিয়াম পার্টনার।',
    bannerColor: 'from-amber-600 to-amber-800',
    initialDue: 0,
  },
  {
    id: 'shop-bookpoint',
    shopName: 'বুক পয়েন্ট, বাংলাবাজার',
    ownerName: 'রফিক উল্লাহ (মালিক)',
    representative: 'রফিক উল্লাহ',
    phone: '০১৮২২২৩৪৫৬৭',
    altPhone: '০২-৭১১৫৫৪৪',
    email: 'bookpoint.banglabazar@gmail.com',
    address: '৩৮/১ মান্নান মার্কেট (নিচতলা), বাংলাবাজার, ঢাকা-১১০০',
    district: 'ঢাকা',
    established: '২০১৫',
    tradeLicense: 'TRD-BB-91024',
    category: 'পাইকারি ডিলার',
    defaultCommission: 40,
    status: 'vip',
    notes: 'বাংলাবাজারের অন্যতম বৃহৎ পাইকারি ডিস্ট্রিবিউটর। নগদ ও ক্যাশ চালানে নিয়মিত লেনদেন।',
    bannerColor: 'from-blue-600 to-blue-800',
    initialDue: 0,
  },
  {
    id: 'shop-bidyaniketan',
    shopName: 'বিদ্যা নিকেতন লাইব্রেরি',
    ownerName: 'আব্দুল হামিদ (স্বত্বাধিকারী)',
    representative: 'আব্দুল হামিদ',
    phone: '০১৯৩৩৩৪৫৬৭৮',
    altPhone: '০৩১-৬১২৩৪৫',
    email: 'bidyaniketan.ctg@gmail.com',
    address: 'দোকান নং ১৫, আন্দরকিল্লা মোড়, কোতোয়ালি, চট্টগ্রাম',
    district: 'চট্টগ্রাম',
    established: '২০১৮',
    tradeLicense: 'TRD-CTG-77215',
    category: 'আঞ্চলিক পরিবেশক',
    defaultCommission: 35,
    status: 'regular',
    notes: 'চট্টগ্রাম অঞ্চলের প্রধান পরিবেশক। নিয়মিত সুন্দরবন ও এসএ পরিবহনে চালান বুকিং হয়।',
    bannerColor: 'from-emerald-600 to-emerald-800',
    initialDue: 0,
  },
  {
    id: 'shop-azizsuper',
    shopName: 'আজিজ সুপার বুক কর্নার',
    ownerName: 'সুমন আহমেদ',
    representative: 'সুমন আহমেদ',
    phone: '০১৬৪৪৪৫৬৭৮৯',
    altPhone: '০১৬৭৭-৮৮৯৯০০',
    email: 'azizbookcorner@yahoo.com',
    address: 'দোকান নং ৪২, আজিজ সুপার মার্কেট (২য় তলা), শাহবাগ, ঢাকা',
    district: 'ঢাকা',
    established: '২০১৪',
    tradeLicense: 'TRD-SB-33019',
    category: 'সাহিত্য ও গবেষণা গ্রন্থ বিপণি',
    defaultCommission: 30,
    status: 'regular',
    notes: 'শাহবাগের সৃজনশীল ও মননশীল সাহিত্যের নির্ভরযোগ্য বুক কর্নার। বকেয়া সমন্বয় চালু রয়েছে।',
    bannerColor: 'from-rose-600 to-rose-800',
    initialDue: 320,
  },
  {
    id: 'shop-pathakshamabesh',
    shopName: 'পাঠক সমাবেশ কেন্দ্র',
    ownerName: 'মাহবুব আলম (শাখা ইনচার্জ)',
    representative: 'মাহবুব আলম',
    phone: '০১৫৫৫৬৭৮৯০১',
    altPhone: '০২-৯৬৬২২১১',
    email: 'psk.shahbag@pathakshamabesh.com',
    address: 'জাতীয় জাদুঘর প্লাজা, শাহবাগ মোড়, ঢাকা-১০০০',
    district: 'ঢাকা',
    established: '২০১০',
    tradeLicense: 'TRD-DHK-11092',
    category: 'প্রিমিয়াম বুক ক্যাফে ও শোরুম',
    defaultCommission: 35,
    status: 'vip',
    notes: 'প্রিমিয়াম রিটেইল পার্টনার। সব নতুন বই প্রকাশের সাথে সাথে ডিসপ্লে করা হয়।',
    bannerColor: 'from-purple-600 to-purple-800',
    initialDue: 0,
  },
  {
    id: 'shop-islamicsyndicate',
    shopName: 'ইসলামিক বুক সিন্ডিকেট',
    ownerName: 'মাওলানা কামরুল ইসলাম',
    representative: 'মাওলানা কামরুল ইসলাম',
    phone: '০১৭৬৬৭৮৯০১২',
    altPhone: '০২-৭১১৮৮৯৯',
    email: 'islamicbooksyndicate@gmail.com',
    address: 'ইসলামিয়া মার্কেট (৩য় তলা), বাংলাবাজার, ঢাকা-১১০০',
    district: 'ঢাকা',
    established: '২০১৬',
    tradeLicense: 'TRD-BB-60291',
    category: 'ইসলামিক ও জীবনঘনিষ্ঠ গ্রন্থ বিপণি',
    defaultCommission: 40,
    status: 'vip',
    notes: 'এককালীন বড় চালানে পাইকারি অর্ডার গ্রহণকারী। ব্যাংক ট্রান্সফারে পেমেন্ট সম্পন্ন করে।',
    bannerColor: 'from-teal-600 to-teal-800',
    initialDue: 0,
  },
  {
    id: 'shop-cheragipahar',
    shopName: 'চেরাগী পাহাড় বুক সেন্টার',
    ownerName: 'শফিউল বশর',
    representative: 'শফিউল বশর',
    phone: '০১৮৭৭৮৯০১২৩',
    altPhone: '০১৮১৯-১১২২৩৩',
    email: 'cheragibooks.ctg@gmail.com',
    address: 'চেরাগী পাহাড় মোড়, জামাল খান রোড, চট্টগ্রাম',
    district: 'চট্টগ্রাম',
    established: '২০১৯',
    tradeLicense: 'TRD-CTG-44910',
    category: 'সাহিত্য বিপণি ও পরিবেশক',
    defaultCommission: 35,
    status: 'regular',
    notes: 'চট্টগ্রামের ঐতিহ্যবাহী সাহিত্য বলয়ের বই সরবরাহ কেন্দ্র। নগদ ও ডিজিটাল পেমেন্ট করে।',
    bannerColor: 'from-cyan-600 to-cyan-800',
    initialDue: 0,
  },
  {
    id: 'shop-gyankosh',
    shopName: 'জ্ঞানকোষ প্রকাশনী ও বুকস্টল',
    ownerName: 'এম. এ. রাজ্জাক',
    representative: 'এম. এ. রাজ্জাক',
    phone: '০১৭২২৯৮৭৬৫৪',
    altPhone: '০২-৮৬১৫৫৪৪',
    email: 'gyankosh.katabon@gmail.com',
    address: 'দোকান নং ৮, কনকর্ড এম্পোরিয়াম শপিং কমপ্লেক্স, কাঁটাবন, ঢাকা',
    district: 'ঢাকা',
    established: '২০১৭',
    tradeLicense: 'TRD-KTB-55102',
    category: 'পাইকারি ও খুচরা বিপণি',
    defaultCommission: 35,
    status: 'regular',
    notes: 'কাঁটাবন ও নিউমার্কেট অঞ্চলের নির্ভরযোগ্য বিক্রয়কেন্দ্র।',
    bannerColor: 'from-indigo-600 to-indigo-800',
    initialDue: 0,
  },
  {
    id: 'shop-boibicitra',
    shopName: 'বইবিচিত্রা লাইব্রেরি',
    ownerName: 'সাইফুল ইসলাম',
    representative: 'সাইফুল ইসলাম',
    phone: '০১৯১১৮৭৬৫৪৩',
    altPhone: '০৮২১-৭২১২৩৪',
    email: 'boibicitra.sylhet@yahoo.com',
    address: 'আল-হামরা শপিং সিটি (নিচতলা), জিন্দাবাজার, সিলেট',
    district: 'সিলেট',
    established: '২০২০',
    tradeLicense: 'TRD-SYL-33418',
    category: 'আঞ্চলিক রিটেইল শপ',
    defaultCommission: 30,
    status: 'regular',
    notes: 'সিলেট বিভাগের প্রধান বই বিপণি। নিয়মিত কুরিয়ারে বই পাঠানো হয়।',
    bannerColor: 'from-violet-600 to-violet-800',
    initialDue: 0,
  },
  {
    id: 'shop-walkincounter',
    shopName: 'খুচরা সাধারণ ক্রেতা',
    ownerName: 'কাউন্টার ক্যাশিয়ার ডেস্ক',
    representative: 'শোরুম প্রতিনিধি',
    phone: '০১৯৮৮৯০১২৩৪',
    altPhone: '০১৬২৮-০৩৭৫৯১',
    email: 'counter@hosontoprokashon.com',
    address: '৩৮/২ মান্নান বাজার (২য় তলা), বাংলাবাজার, ঢাকা-১১০০',
    district: 'ঢাকা',
    established: '২০২২',
    tradeLicense: 'INTERNAL-COUNTER',
    category: 'সরাসরি শোরুম খুচরা বিক্রি',
    defaultCommission: 0,
    status: 'active',
    notes: 'কাউন্টার থেকে সরাসরি সাধারণ ক্রেতা ও পাঠকদের তাত্ক্ষণিক কেনাকাটার জন্য সংরক্ষিত প্রোফাইল।',
    bannerColor: 'from-slate-600 to-slate-800',
    initialDue: 0,
  },
];

const SHOPS_STORAGE_KEY = 'hosonta_shops_data';

export function getStoredShops() {
  try {
    const raw = localStorage.getItem(SHOPS_STORAGE_KEY);
    if (!raw) return initialShops;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return initialShops;

    // Merge in any new default shops missing from storage
    const storedIds = new Set(parsed.map((s) => s.id));
    const missing = initialShops.filter((s) => !storedIds.has(s.id));
    return [...parsed, ...missing];
  } catch (err) {
    console.error('Failed to load shops from localStorage', err);
    return initialShops;
  }
}

export function saveStoredShops(shops) {
  try {
    localStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));
  } catch (err) {
    console.error('Failed to save shops to localStorage', err);
  }
}

export function addStoredShop(newShop) {
  const current = getStoredShops();
  const shopWithId = {
    ...newShop,
    id: newShop.id || `shop-${Date.now()}`,
    established: newShop.established || String(new Date().getFullYear()),
    category: newShop.category || 'বুকশপ ও রিটেইল গ্রাহক',
    status: newShop.status || 'active',
    defaultCommission: Number(newShop.defaultCommission || 30),
    initialDue: Number(newShop.initialDue || 0),
  };
  const updated = [shopWithId, ...current];
  saveStoredShops(updated);
  return shopWithId;
}

export function updateStoredShop(id, updates) {
  const current = getStoredShops();
  const updated = current.map((shop) =>
    String(shop.id) === String(id) ? { ...shop, ...updates } : shop
  );
  saveStoredShops(updated);
  return updated;
}
