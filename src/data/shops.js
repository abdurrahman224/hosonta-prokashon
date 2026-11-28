/**
 * shops.js - Hosonta Prokashon Bookshop & Counter Customer Database
 * Holds profile information, contact details, trade licensing, and notes for physical bookstores
 * and wholesale counter clients.
 */

export const initialShops = [
  {
    id: 'shop-batighar',
    shopName: 'Batighar Bookshop',
    ownerName: 'Zafar Iqbal (Manager)',
    representative: 'Zafar Iqbal',
    phone: '01711234567',
    altPhone: '02-9667788',
    email: 'batighar.dhaka@gmail.com',
    address: 'Bishwo Shahitto Kendro (2nd Floor), Banglamotor, Dhaka-1000',
    district: 'Dhaka',
    established: '2012',
    tradeLicense: 'TRD-DHK-48291',
    category: 'Wholesale & Retail Bookshop',
    defaultCommission: 35,
    status: 'vip',
    notes: 'Banglamotor branch, regular wholesale supplier and premium partner.',
    bannerColor: 'from-amber-600 to-amber-800',
    initialDue: 0,
  },
  {
    id: 'shop-bookpoint',
    shopName: 'Book Point, Banglabazar',
    ownerName: 'Rafiq Ullah (Owner)',
    representative: 'Rafiq Ullah',
    phone: '01822234567',
    altPhone: '02-7115544',
    email: 'bookpoint.banglabazar@gmail.com',
    address: '38/1 Mannan Market (Ground Floor), Banglabazar, Dhaka-1100',
    district: 'Dhaka',
    established: '2015',
    tradeLicense: 'TRD-BB-91024',
    category: 'Wholesale Dealer',
    defaultCommission: 40,
    status: 'vip',
    notes: 'Major Banglabazar distributor. Regular cash and invoice settlement.',
    bannerColor: 'from-blue-600 to-blue-800',
    initialDue: 0,
  },
  {
    id: 'shop-bidyaniketan',
    shopName: 'Bidyaniketan Library',
    ownerName: 'Abdul Hamid (Proprietor)',
    representative: 'Abdul Hamid',
    phone: '01933345678',
    altPhone: '031-612345',
    email: 'bidyaniketan.ctg@gmail.com',
    address: 'Shop No 15, Anderkilla Crossing, Kotwali, Chattogram',
    district: 'Chattogram',
    established: '2018',
    tradeLicense: 'TRD-CTG-77215',
    category: 'Regional Distributor',
    defaultCommission: 35,
    status: 'regular',
    notes: 'Main distributor in Chattogram region via Sundarban & SA Paribahan.',
    bannerColor: 'from-emerald-600 to-emerald-800',
    initialDue: 0,
  },
  {
    id: 'shop-azizsuper',
    shopName: 'Aziz Super Book Corner',
    ownerName: 'Sumon Ahmed',
    representative: 'Sumon Ahmed',
    phone: '01644456789',
    altPhone: '01677-889900',
    email: 'azizbookcorner@yahoo.com',
    address: 'Shop No 42, Aziz Super Market (2nd Floor), Shahbagh, Dhaka',
    district: 'Dhaka',
    established: '2014',
    tradeLicense: 'TRD-SB-33019',
    category: 'Literature & Research Store',
    defaultCommission: 30,
    status: 'regular',
    notes: 'Trusted Shahbagh store for creative and thoughtful literature.',
    bannerColor: 'from-rose-600 to-rose-800',
    initialDue: 320,
  },
  {
    id: 'shop-pathakshamabesh',
    shopName: 'Pathak Shamabesh Center',
    ownerName: 'Mahbub Alam (Branch In-Charge)',
    representative: 'Mahbub Alam',
    phone: '01555678901',
    altPhone: '02-9662211',
    email: 'psk.shahbag@pathakshamabesh.com',
    address: 'National Museum Plaza, Shahbagh Crossing, Dhaka-1000',
    district: 'Dhaka',
    established: '2010',
    tradeLicense: 'TRD-DHK-11092',
    category: 'Premium Book Cafe & Showroom',
    defaultCommission: 35,
    status: 'vip',
    notes: 'Premium retail partner featuring all new titles upon release.',
    bannerColor: 'from-purple-600 to-purple-800',
    initialDue: 0,
  },
  {
    id: 'shop-islamicsyndicate',
    shopName: 'Islamic Book Syndicate',
    ownerName: 'Kamrul Islam',
    representative: 'Kamrul Islam',
    phone: '01766789012',
    altPhone: '02-7118899',
    email: 'islamicbooksyndicate@gmail.com',
    address: 'Islamia Market (3rd Floor), Banglabazar, Dhaka-1100',
    district: 'Dhaka',
    established: '2016',
    tradeLicense: 'TRD-BB-60291',
    category: 'Islamic & Lifestyle Books',
    defaultCommission: 40,
    status: 'vip',
    notes: 'High-volume wholesale orders settled via bank transfer.',
    bannerColor: 'from-teal-600 to-teal-800',
    initialDue: 0,
  },
  {
    id: 'shop-cheragipahar',
    shopName: 'Cheragi Pahar Book Center',
    ownerName: 'Shafiul Bashar',
    representative: 'Shafiul Bashar',
    phone: '01877890123',
    altPhone: '01819-112233',
    email: 'cheragibooks.ctg@gmail.com',
    address: 'Cheragi Pahar Crossing, Jamal Khan Road, Chattogram',
    district: 'Chattogram',
    established: '2019',
    tradeLicense: 'TRD-CTG-44910',
    category: 'Literature & Distribution',
    defaultCommission: 35,
    status: 'regular',
    notes: 'Key Chattogram literary center; settles via cash and digital payments.',
    bannerColor: 'from-cyan-600 to-cyan-800',
    initialDue: 0,
  },
  {
    id: 'shop-gyankosh',
    shopName: 'Gyankosh Publishers & Bookstall',
    ownerName: 'M. A. Razzak',
    representative: 'M. A. Razzak',
    phone: '01722987654',
    altPhone: '02-8615544',
    email: 'gyankosh.katabon@gmail.com',
    address: 'Shop No 8, Concord Emporium, Katabon, Dhaka',
    district: 'Dhaka',
    established: '2017',
    tradeLicense: 'TRD-KTB-55102',
    category: 'Wholesale & Retail',
    defaultCommission: 35,
    status: 'regular',
    notes: 'Reliable bookstall serving Katabon and New Market.',
    bannerColor: 'from-indigo-600 to-indigo-800',
    initialDue: 0,
  },
  {
    id: 'shop-boibicitra',
    shopName: 'Boibicitra Library',
    ownerName: 'Saiful Islam',
    representative: 'Saiful Islam',
    phone: '01911876543',
    altPhone: '0821-721234',
    email: 'boibicitra.sylhet@yahoo.com',
    address: 'Al-Hamra Shopping City (Ground Floor), Zindabazar, Sylhet',
    district: 'Sylhet',
    established: '2020',
    tradeLicense: 'TRD-SYL-33418',
    category: 'Regional Retail Shop',
    defaultCommission: 30,
    status: 'regular',
    notes: 'Leading bookshop in Sylhet division; regular courier shipments.',
    bannerColor: 'from-violet-600 to-violet-800',
    initialDue: 0,
  },
  {
    id: 'shop-walkincounter',
    shopName: 'Walk-in Retail Customer',
    ownerName: 'Counter Cashier Desk',
    representative: 'Showroom Staff',
    phone: '01988901234',
    altPhone: '01628-037591',
    email: 'counter@hosontoprokashon.com',
    address: '38/2 Mannan Bazar (2nd Floor), Banglabazar, Dhaka-1100',
    district: 'Dhaka',
    established: '2022',
    tradeLicense: 'INTERNAL-COUNTER',
    category: 'Direct Showroom Retail',
    defaultCommission: 0,
    status: 'active',
    notes: 'Default profile for direct walk-in readers at the showroom counter.',
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
    category: newShop.category || 'Bookshop & Retail Customer',
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
