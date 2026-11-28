const PROFILES_KEY = 'hosonta_expense_profiles_v1'
const VENDORS_KEY = 'hosonta_expense_vendors_v1'
const LEDGER_KEY = 'hosonta_expense_ledger_v1'

export const EXPENSE_PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Bank']

export const PROFILE_COLORS = [
  { id: 'indigo', label: 'Indigo' },
  { id: 'purple', label: 'Purple' },
  { id: 'amber', label: 'Amber' },
  { id: 'sky', label: 'Sky' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'rose', label: 'Rose' },
]

export function toProfileSlug(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `profile-${Date.now()}`
}

export function resolveProfileIdFromCategory(category = '', explicitProfileId = '') {
  if (explicitProfileId) return explicitProfileId
  const c = String(category).trim().toLowerCase()
  if (c.includes('bind') || c.includes('বাইন্ডিং')) return 'prof-binding'
  if (c.includes('cover') || c.includes('design') || c.includes('প্রচ্ছদ')) return 'prof-cover'
  if (c.includes('manuscript') || c.includes('edit') || c.includes('পান্ডুলিপি') || c.includes('পাণ্ডুলিপি')) {
    return 'prof-manuscript'
  }
  if (c.includes('transport') || c.includes('courier') || c.includes('পরিবহন')) return 'prof-transport'
  return 'prof-other'
}

function daysAgoIso(days, hour = 11, minute = 30) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const DEFAULT_PROFILES = [
  {
    id: 'prof-manuscript',
    slug: 'manuscript',
    name: 'Manuscript',
    subtitle: 'Author advances, editing, proof-reading & composing',
    color: 'indigo',
    isDefault: true,
    createdAt: daysAgoIso(45),
  },
  {
    id: 'prof-cover',
    slug: 'cover-design',
    name: 'Cover & Design',
    subtitle: 'Cover artwork, inner page layout & plate setup',
    color: 'purple',
    isDefault: true,
    createdAt: daysAgoIso(45),
  },
  {
    id: 'prof-binding',
    slug: 'binding',
    name: 'Binding',
    subtitle: 'Bindery houses, stitching, hardbound & lamination',
    color: 'amber',
    isDefault: true,
    createdAt: daysAgoIso(45),
  },
  {
    id: 'prof-transport',
    slug: 'transport',
    name: 'Transport',
    subtitle: 'Van rental, courier dispatch, press pickup & book fair',
    color: 'sky',
    isDefault: true,
    createdAt: daysAgoIso(45),
  },
  {
    id: 'prof-other',
    slug: 'other',
    name: 'Other',
    subtitle: 'Packaging supplies, office tea, utilities & misc',
    color: 'emerald',
    isDefault: true,
    createdAt: daysAgoIso(45),
  },
]

const DEFAULT_VENDORS = [
  {
    id: 'vend-ms-1',
    profileId: 'prof-manuscript',
    name: 'Tariqul Editorial & Proofing',
    phone: '01711-402210',
    notes: 'Proof-reading & Bangla editing',
    createdAt: daysAgoIso(30),
  },
  {
    id: 'vend-ms-2',
    profileId: 'prof-manuscript',
    name: 'Sajib Composing & Typesetting',
    phone: '01819-773301',
    notes: 'InDesign & Unicode composing',
    createdAt: daysAgoIso(28),
  },
  {
    id: 'vend-cv-1',
    profileId: 'prof-cover',
    name: 'Kamrul Design Studio',
    phone: '01722-894412',
    notes: 'Book cover illustrations & 3D mockups',
    createdAt: daysAgoIso(25),
  },
  {
    id: 'vend-cv-2',
    profileId: 'prof-cover',
    name: 'Banglabazar Plate & CTF',
    phone: '01911-552090',
    notes: 'Cover CTP plate processing',
    createdAt: daysAgoIso(22),
  },
  {
    id: 'vend-bd-1',
    profileId: 'prof-binding',
    name: 'Dhaka Hardbound & Binding House',
    phone: '01715-663201',
    notes: 'Primary hardbound & section-sewn bindery',
    createdAt: daysAgoIso(35),
  },
  {
    id: 'vend-bd-2',
    profileId: 'prof-binding',
    name: 'Al-Fatah Lamination & Finishing',
    phone: '01674-118820',
    notes: 'Matte & spot-UV cover lamination',
    createdAt: daysAgoIso(20),
  },
  {
    id: 'vend-tr-1',
    profileId: 'prof-transport',
    name: 'Karim Pickup & Van Service',
    phone: '01812-304455',
    notes: 'Press to warehouse bulk book transport',
    createdAt: daysAgoIso(18),
  },
  {
    id: 'vend-tr-2',
    profileId: 'prof-transport',
    name: 'Sundarban Parcel Dispatch',
    phone: '01713-909871',
    notes: 'Outside Dhaka dealer parcels',
    createdAt: daysAgoIso(15),
  },
  {
    id: 'vend-ot-1',
    profileId: 'prof-other',
    name: 'Noyapaltan Packaging & Tape',
    phone: '01920-450112',
    notes: 'Bubble wrap, cartons & courier tape',
    createdAt: daysAgoIso(12),
  },
]

const DEFAULT_LEDGER = [
  {
    id: 'exp-1001',
    refNo: 'EXP-1001',
    profileId: 'prof-binding',
    vendorId: 'vend-bd-1',
    vendorName: 'Dhaka Hardbound & Binding House',
    bookTitle: 'Apnar Swamike Agle Rakhun',
    description: '1,000 copies hardbound stitching & casing bill',
    billAmount: 24000,
    paidAmount: 15000,
    method: 'Bank',
    recordedById: 'admin-1',
    recordedByName: 'Abdur Rahman',
    recordedByRole: 'admin',
    authorizedBy: 'Self (Admin)',
    createdAt: daysAgoIso(9, 14, 15),
  },
  {
    id: 'exp-1002',
    refNo: 'EXP-1002',
    profileId: 'prof-binding',
    vendorId: 'vend-bd-1',
    vendorName: 'Dhaka Hardbound & Binding House',
    bookTitle: 'Apnar Swamike Agle Rakhun',
    description: 'Partial cash payment handed to bindery collector at office',
    billAmount: 0,
    paidAmount: 5000,
    method: 'Cash',
    recordedById: 'emp-1',
    recordedByName: 'Imran Hossain',
    recordedByRole: 'employee',
    authorizedBy: 'Phone approval from Admin',
    createdAt: daysAgoIso(2, 16, 40),
  },
  {
    id: 'exp-1003',
    refNo: 'EXP-1003',
    profileId: 'prof-binding',
    vendorId: 'vend-bd-2',
    vendorName: 'Al-Fatah Lamination & Finishing',
    bookTitle: 'Nekkar Songir Khoje',
    description: 'Matte cover lamination batch #14',
    billAmount: 6500,
    paidAmount: 6500,
    method: 'bKash',
    recordedById: 'admin-1',
    recordedByName: 'Abdur Rahman',
    recordedByRole: 'admin',
    authorizedBy: 'Self (Admin)',
    createdAt: daysAgoIso(6, 12, 10),
  },
  {
    id: 'exp-1004',
    refNo: 'EXP-1004',
    profileId: 'prof-manuscript',
    vendorId: 'vend-ms-1',
    vendorName: 'Tariqul Editorial & Proofing',
    bookTitle: 'Buker Vetor Ek Fali Rod',
    description: '2nd proof & final editorial review (240 pages)',
    billAmount: 8500,
    paidAmount: 5000,
    method: 'bKash',
    recordedById: 'admin-1',
    recordedByName: 'Abdur Rahman',
    recordedByRole: 'admin',
    authorizedBy: 'Self (Admin)',
    createdAt: daysAgoIso(7, 15, 20),
  },
  {
    id: 'exp-1005',
    refNo: 'EXP-1005',
    profileId: 'prof-manuscript',
    vendorId: 'vend-ms-2',
    vendorName: 'Sajib Composing & Typesetting',
    bookTitle: 'Chintar Khorak',
    description: 'Full inner makeup & print-ready PDF',
    billAmount: 4200,
    paidAmount: 4200,
    method: 'Nagad',
    recordedById: 'emp-1',
    recordedByName: 'Imran Hossain',
    recordedByRole: 'employee',
    authorizedBy: 'Admin approved bill',
    createdAt: daysAgoIso(4, 13, 5),
  },
  {
    id: 'exp-1006',
    refNo: 'EXP-1006',
    profileId: 'prof-cover',
    vendorId: 'vend-cv-1',
    vendorName: 'Kamrul Design Studio',
    bookTitle: 'Jiboner Vaje Vaje',
    description: 'Final cover artwork + social banner pack',
    billAmount: 9000,
    paidAmount: 6000,
    method: 'Bank',
    recordedById: 'admin-1',
    recordedByName: 'Abdur Rahman',
    recordedByRole: 'admin',
    authorizedBy: 'Self (Admin)',
    createdAt: daysAgoIso(5, 11, 45),
  },
  {
    id: 'exp-1007',
    refNo: 'EXP-1007',
    profileId: 'prof-cover',
    vendorId: 'vend-cv-2',
    vendorName: 'Banglabazar Plate & CTF',
    bookTitle: 'Jiboner Vaje Vaje',
    description: '4-color CTP plate set delivered to press',
    billAmount: 3200,
    paidAmount: 3200,
    method: 'Cash',
    recordedById: 'emp-1',
    recordedByName: 'Imran Hossain',
    recordedByRole: 'employee',
    authorizedBy: 'Counter petty cash',
    createdAt: daysAgoIso(3, 17, 10),
  },
  {
    id: 'exp-1008',
    refNo: 'EXP-1008',
    profileId: 'prof-transport',
    vendorId: 'vend-tr-1',
    vendorName: 'Karim Pickup & Van Service',
    bookTitle: '',
    description: 'Bindery to Motijheel warehouse 2 trips pickup',
    billAmount: 2800,
    paidAmount: 2800,
    method: 'Cash',
    recordedById: 'emp-1',
    recordedByName: 'Imran Hossain',
    recordedByRole: 'employee',
    authorizedBy: 'Counter petty cash',
    createdAt: daysAgoIso(1, 18, 20),
  },
  {
    id: 'exp-1009',
    refNo: 'EXP-1009',
    profileId: 'prof-transport',
    vendorId: 'vend-tr-2',
    vendorName: 'Sundarban Parcel Dispatch',
    bookTitle: '',
    description: 'Sylhet & Chattogram distributor carton freight',
    billAmount: 3600,
    paidAmount: 2000,
    method: 'bKash',
    recordedById: 'admin-1',
    recordedByName: 'Abdur Rahman',
    recordedByRole: 'admin',
    authorizedBy: 'Self (Admin)',
    createdAt: daysAgoIso(3, 14, 0),
  },
  {
    id: 'exp-1010',
    refNo: 'EXP-1010',
    profileId: 'prof-other',
    vendorId: 'vend-ot-1',
    vendorName: 'Noyapaltan Packaging & Tape',
    bookTitle: '',
    description: 'Corrugated parcel cartons (150 pcs) & tape rolls',
    billAmount: 3500,
    paidAmount: 3500,
    method: 'Cash',
    recordedById: 'emp-1',
    recordedByName: 'Imran Hossain',
    recordedByRole: 'employee',
    authorizedBy: 'Counter petty cash',
    createdAt: daysAgoIso(1, 12, 15),
  },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore storage quota failures
  }
}

export function getExpenseProfiles() {
  return readJson(PROFILES_KEY, DEFAULT_PROFILES)
}

export function addExpenseProfile({ name, subtitle = '', color = 'indigo' }) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return null
  const profiles = getExpenseProfiles()
  const baseSlug = toProfileSlug(trimmed)
  let slug = baseSlug
  let idx = 2
  while (profiles.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${idx}`
    idx += 1
  }
  const newProfile = {
    id: `prof-${Date.now()}`,
    slug,
    name: trimmed,
    subtitle: String(subtitle || '').trim() || 'Custom expense ledger profile',
    color,
    isDefault: false,
    createdAt: new Date().toISOString(),
  }
  const updated = [...profiles, newProfile]
  writeJson(PROFILES_KEY, updated)
  return newProfile
}

export function deleteExpenseProfile(profileId) {
  const profiles = getExpenseProfiles()
  const target = profiles.find((p) => p.id === profileId)
  if (!target || target.isDefault) return false
  writeJson(
    PROFILES_KEY,
    profiles.filter((p) => p.id !== profileId),
  )
  const vendors = getExpenseVendors().filter((v) => v.profileId !== profileId)
  writeJson(VENDORS_KEY, vendors)
  const ledger = getExpenseLedger().filter((e) => e.profileId !== profileId)
  writeJson(LEDGER_KEY, ledger)
  return true
}

export function getExpenseVendors() {
  return readJson(VENDORS_KEY, DEFAULT_VENDORS)
}

export function addExpenseVendor({ profileId, name, phone = '', notes = '' }) {
  const trimmedName = String(name || '').trim()
  if (!profileId || !trimmedName) return null
  const vendors = getExpenseVendors()
  const existing = vendors.find(
    (v) =>
      v.profileId === profileId &&
      v.name.toLowerCase() === trimmedName.toLowerCase(),
  )
  if (existing) return existing

  const newVendor = {
    id: `vend-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    profileId,
    name: trimmedName,
    phone: String(phone || '').trim(),
    notes: String(notes || '').trim(),
    createdAt: new Date().toISOString(),
  }
  writeJson(VENDORS_KEY, [...vendors, newVendor])
  return newVendor
}

export function getExpenseLedger() {
  const list = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function addExpenseEntry({
  profileId,
  vendorId = '',
  vendorName = '',
  vendorPhone = '',
  bookTitle = '',
  description = '',
  billAmount = 0,
  paidAmount = 0,
  method = 'Cash',
  recordedById = '',
  recordedByName = 'Staff',
  recordedByRole = 'employee',
  authorizedBy = '',
  createdAt = '',
  totalCostRefId = '',
  source = 'Direct Entry',
}) {
  if (!profileId) return null
  let resolvedVendorId = vendorId
  let resolvedVendorName = String(vendorName || '').trim()

  const vendors = getExpenseVendors()
  if (resolvedVendorId) {
    const found = vendors.find((v) => v.id === resolvedVendorId)
    if (found) resolvedVendorName = found.name
  } else if (resolvedVendorName) {
    const matchedOrCreated = addExpenseVendor({
      profileId,
      name: resolvedVendorName,
      phone: vendorPhone,
    })
    if (matchedOrCreated) {
      resolvedVendorId = matchedOrCreated.id
      resolvedVendorName = matchedOrCreated.name
    }
  }

  if (!resolvedVendorName) {
    resolvedVendorName = 'General Cash Expense'
  }

  const ledger = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  const numericRef = 1001 + ledger.length
  const newEntry = {
    id: `exp-${Date.now()}`,
    refNo: totalCostRefId || `EXP-${numericRef}`,
    totalCostRefId: totalCostRefId || '',
    source: source || 'Direct Entry',
    profileId,
    vendorId: resolvedVendorId || `adhoc-${profileId}`,
    vendorName: resolvedVendorName,
    bookTitle: String(bookTitle || '').trim(),
    description: String(description || '').trim(),
    billAmount: Math.max(0, Number(billAmount) || 0),
    paidAmount: Math.max(0, Number(paidAmount) || 0),
    method: method || 'Cash',
    recordedById: recordedById || 'unknown',
    recordedByName: recordedByName || 'Staff',
    recordedByRole: recordedByRole || 'employee',
    authorizedBy:
      String(authorizedBy || '').trim() ||
      (recordedByRole === 'admin' ? 'Self (Admin)' : 'Authorized by Admin'),
    createdAt: createdAt || new Date().toISOString(),
  }

  writeJson(LEDGER_KEY, [newEntry, ...ledger])
  return newEntry
}

export function syncCostToExpenseProfile({
  totalCostRefId,
  profileId = '',
  category = '',
  vendorName = '',
  bookTitle = '',
  description = '',
  paidAmount = 0,
  dueAmount = 0,
  method = 'Cash',
  date = '',
  recordedById = '',
  recordedByName = 'Admin',
  recordedByRole = 'admin',
}) {
  if (!totalCostRefId) return null
  const resolvedProfileId = resolveProfileIdFromCategory(category, profileId)
  const paid = Math.max(0, Number(paidAmount) || 0)
  const due = Math.max(0, Number(dueAmount) || 0)
  const billAmount = paid + due
  const resolvedDateIso = date
    ? new Date(`${date}T12:00:00`).toISOString()
    : new Date().toISOString()
  const resolvedVendor =
    String(vendorName || '').trim() ||
    (bookTitle ? `${category || 'Expense'} — ${bookTitle}` : `${category || 'Expense'} Account`)

  const ledger = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  const existing = ledger.find((e) => e.totalCostRefId === totalCostRefId)

  if (existing) {
    const matchedVendor = addExpenseVendor({
      profileId: resolvedProfileId,
      name: resolvedVendor,
    })
    return updateExpenseEntry(existing.id, {
      profileId: resolvedProfileId,
      vendorId: matchedVendor?.id || existing.vendorId,
      vendorName: matchedVendor?.name || resolvedVendor,
      bookTitle: String(bookTitle || '').trim(),
      description: String(description || '').trim(),
      billAmount,
      paidAmount: paid,
      method: method || existing.method || 'Cash',
      createdAt: resolvedDateIso,
    })
  }

  return addExpenseEntry({
    profileId: resolvedProfileId,
    vendorName: resolvedVendor,
    bookTitle,
    description,
    billAmount,
    paidAmount: paid,
    method: method || 'Cash',
    recordedById,
    recordedByName,
    recordedByRole,
    authorizedBy: 'Synced from Total Cost',
    createdAt: resolvedDateIso,
    totalCostRefId,
    source: 'Total Cost',
  })
}

export function removeSyncedCostFromProfile(totalCostRefId) {
  if (!totalCostRefId) return false
  const ledger = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  const filtered = ledger.filter((item) => item.totalCostRefId !== totalCostRefId)
  if (filtered.length === ledger.length) return false
  writeJson(LEDGER_KEY, filtered)
  return true
}

export function updateExpenseEntry(entryId, patch) {
  const ledger = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  let updatedItem = null
  const next = ledger.map((item) => {
    if (item.id !== entryId) return item
    updatedItem = {
      ...item,
      ...patch,
      billAmount:
        patch.billAmount !== undefined
          ? Math.max(0, Number(patch.billAmount) || 0)
          : item.billAmount,
      paidAmount:
        patch.paidAmount !== undefined
          ? Math.max(0, Number(patch.paidAmount) || 0)
          : item.paidAmount,
    }
    return updatedItem
  })
  writeJson(LEDGER_KEY, next)
  return updatedItem
}

export function deleteExpenseEntry(entryId) {
  const ledger = readJson(LEDGER_KEY, DEFAULT_LEDGER)
  const filtered = ledger.filter((item) => item.id !== entryId)
  if (filtered.length === ledger.length) return false
  writeJson(LEDGER_KEY, filtered)
  return true
}

export function summarizeProfiles(profiles, vendors, ledger) {
  const vendorAggByProfile = {}
  for (const entry of ledger) {
    const pid = entry.profileId
    if (!vendorAggByProfile[pid]) vendorAggByProfile[pid] = {}
    const vKey = entry.vendorId || entry.vendorName
    if (!vendorAggByProfile[pid][vKey]) {
      vendorAggByProfile[pid][vKey] = { payable: 0, paid: 0 }
    }
    vendorAggByProfile[pid][vKey].payable += Number(entry.billAmount) || 0
    vendorAggByProfile[pid][vKey].paid += Number(entry.paidAmount) || 0
  }

  const enrichedProfiles = profiles.map((profile) => {
    const entries = ledger.filter((e) => e.profileId === profile.id)
    const profileVendors = vendors.filter((v) => v.profileId === profile.id)
    const totalPayable = entries.reduce(
      (sum, e) => sum + (Number(e.billAmount) || 0),
      0,
    )
    const totalPaid = entries.reduce(
      (sum, e) => sum + (Number(e.paidAmount) || 0),
      0,
    )
    const netDue = Math.max(0, totalPayable - totalPaid)
    const unallocatedVendorDue = Object.values(
      vendorAggByProfile[profile.id] || {},
    ).reduce((sum, agg) => sum + Math.max(0, agg.payable - agg.paid), 0)

    return {
      ...profile,
      totalPayable,
      totalPaid,
      totalDue: Math.max(netDue, unallocatedVendorDue),
      vendorCount: profileVendors.length,
      entryCount: entries.length,
      latestEntry: entries[0] || null,
    }
  })

  const totals = enrichedProfiles.reduce(
    (acc, p) => {
      acc.totalPayable += p.totalPayable
      acc.totalPaid += p.totalPaid
      acc.totalDue += p.totalDue
      acc.entryCount += p.entryCount
      return acc
    },
    { totalPayable: 0, totalPaid: 0, totalDue: 0, entryCount: 0 },
  )

  return { profiles: enrichedProfiles, totals }
}

export function summarizeVendors(profileId, vendors, ledger) {
  const profileVendors = vendors.filter((v) => v.profileId === profileId)
  const profileLedger = ledger.filter((e) => e.profileId === profileId)

  const byKey = new Map()
  for (const vendor of profileVendors) {
    byKey.set(vendor.id, {
      id: vendor.id,
      name: vendor.name,
      phone: vendor.phone || '',
      notes: vendor.notes || '',
      totalPayable: 0,
      totalPaid: 0,
      totalDue: 0,
      entryCount: 0,
      lastTransactionAt: null,
    })
  }

  for (const entry of profileLedger) {
    const key = entry.vendorId || entry.vendorName
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: key,
        name: entry.vendorName || 'General Payee',
        phone: '',
        notes: '',
        totalPayable: 0,
        totalPaid: 0,
        totalDue: 0,
        entryCount: 0,
        lastTransactionAt: null,
      })
    }
    const row = byKey.get(key)
    row.totalPayable += Number(entry.billAmount) || 0
    row.totalPaid += Number(entry.paidAmount) || 0
    row.entryCount += 1
    if (
      !row.lastTransactionAt ||
      new Date(entry.createdAt).getTime() > new Date(row.lastTransactionAt).getTime()
    ) {
      row.lastTransactionAt = entry.createdAt
    }
  }

  return Array.from(byKey.values())
    .map((row) => ({
      ...row,
      totalDue: Math.max(0, row.totalPayable - row.totalPaid),
    }))
    .sort((a, b) => b.totalDue - a.totalDue || b.totalPaid - a.totalPaid)
}
