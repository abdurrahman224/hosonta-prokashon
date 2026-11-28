export const DEFAULT_DISCOUNT_PERCENT = 25

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯'

export function parseBookNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value ?? '')
    .replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)))
    .replace(/[^\d.]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Keeps the original regular price intact and calculates a uniform 25% discounted selling price
 * for the public storefront and cart.
 */
export function getBookPricing(book) {
  const originalPrice = parseBookNumber(book?.price ?? book?.regularPrice)
  const discountPercent = DEFAULT_DISCOUNT_PERCENT
  const sellingPrice =
    originalPrice > 0
      ? Math.round(originalPrice * (1 - discountPercent / 100))
      : 0

  return {
    originalPrice,
    sellingPrice,
    discountPercent,
    hasDiscount: originalPrice > 0 && sellingPrice < originalPrice,
  }
}

function readCategoryLabel(entry) {
  if (!entry) return ''
  if (typeof entry === 'object') {
    return String(entry.bn || entry.name?.bn || entry.name || entry.en || '').trim()
  }
  return String(entry).trim()
}

export function getBookCategories(book) {
  if (!book) return []
  const raw = []
  if (Array.isArray(book.categories)) {
    raw.push(...book.categories)
  }
  if (Array.isArray(book.category)) {
    raw.push(...book.category)
  } else if (book.category) {
    raw.push(book.category)
  }

  const seen = new Set()
  const list = []
  raw.forEach((item) => {
    const label = readCategoryLabel(item)
    if (label && !seen.has(label)) {
      seen.add(label)
      list.push(label)
    }
  })
  return list
}

export function toCategoryId(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09ff-]/g, '')
}

export function bookHasCategory(book, targetNameOrId) {
  if (!targetNameOrId) return true
  const needle = String(targetNameOrId).trim().toLowerCase()
  const needleId = toCategoryId(targetNameOrId)
  if (book?.categoryId && (String(book.categoryId).toLowerCase() === needle || String(book.categoryId) === needleId)) {
    return true
  }
  return getBookCategories(book).some((cat) => {
    const lower = cat.toLowerCase()
    return lower === needle || lower.includes(needle) || toCategoryId(cat) === needleId
  })
}
