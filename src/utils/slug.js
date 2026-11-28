const VOWELS = {
  'অ': 'o',
  'আ': 'a',
  'ই': 'i',
  'ঈ': 'i',
  'উ': 'u',
  'ঊ': 'u',
  'ঋ': 'ri',
  'এ': 'e',
  'ঐ': 'oi',
  'ও': 'o',
  'ঔ': 'ou',
}

const VOWEL_SIGNS = {
  'া': 'a',
  'ি': 'i',
  'ী': 'i',
  'ু': 'u',
  'ূ': 'u',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou',
}

const CONSONANTS = {
  'ক': 'k',
  'খ': 'kh',
  'গ': 'g',
  'ঘ': 'gh',
  'ঙ': 'ng',
  'চ': 'ch',
  'ছ': 'chh',
  'জ': 'j',
  'ঝ': 'jh',
  'ঞ': 'n',
  'ট': 't',
  'ঠ': 'th',
  'ড': 'd',
  'ঢ': 'dh',
  'ণ': 'n',
  'ত': 't',
  'থ': 'th',
  'দ': 'd',
  'ধ': 'dh',
  'ন': 'n',
  'প': 'p',
  'ফ': 'f',
  'ব': 'b',
  'ভ': 'bh',
  'ম': 'm',
  'য': 'j',
  'র': 'r',
  'ল': 'l',
  'শ': 'sh',
  'ষ': 'sh',
  'স': 's',
  'হ': 'h',
  'ড়': 'r',
  'ঢ়': 'rh',
  'য়': 'y',
  'ড়': 'r',
  'ঢ়': 'rh',
  'য়': 'y',
  'ৎ': 't',
}

const SIGNS = {
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': '',
}

const BN_DIGITS = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
}

/**
 * Transliterates Bengali text (plus ASCII) into clean romanized kebab-case URL slugs.
 * Example: "আপনার স্বামীকে আগলে রাখুন" -> "apnar-shamike-agle-rakhun"
 */
export function transliterateBengaliToSlug(text = '') {
  const normalized = String(text ?? '')
    .normalize('NFC')
    .replace(/য\u09BC/g, 'য়')
    .replace(/ড\u09BC/g, 'ড়')
    .replace(/ঢ\u09BC/g, 'ঢ়')
    .trim()
  if (!normalized) return ''

  let out = ''
  const chars = Array.from(normalized)

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]
    const next = chars[i + 1]
    const prev = chars[i - 1]

    if (BN_DIGITS[ch] !== undefined) {
      out += BN_DIGITS[ch]
      continue
    }

    if (VOWELS[ch] !== undefined) {
      out += VOWELS[ch]
      continue
    }

    if (VOWEL_SIGNS[ch] !== undefined) {
      out += VOWEL_SIGNS[ch]
      continue
    }

    if (SIGNS[ch] !== undefined) {
      out += SIGNS[ch]
      continue
    }

    if (ch === '্') {
      continue
    }

    if (CONSONANTS[ch] !== undefined) {
      // Special conjuncts: ক্ষ (k+sh), জ্ঞ (g+y), স্ব (sh/sw)
      if (ch === 'ক' && next === '্' && chars[i + 2] === 'ষ') {
        const isStart = i === 0 || !/[অ-হৎড়ঢ়য়]/.test(prev || '')
        out += isStart ? 'kh' : 'kkh'
        i += 2
        continue
      }
      if (ch === 'জ' && next === '্' && chars[i + 2] === 'ঞ') {
        out += 'gg'
        i += 2
        continue
      }
      if (ch === 'স' && next === '্' && chars[i + 2] === 'ব') {
        const isStart = i === 0 || !/[অ-হৎড়ঢ়য়]/.test(prev || '')
        out += isStart ? 'sh' : 'shb'
        i += 2
        continue
      }
      // Handle য-ফলা (e.g. শূন্য -> shunno)
      if (next === '্' && chars[i + 2] === 'য') {
        const isStart = i === 0 || !/[অ-হৎড়ঢ়য়]/.test(prev || '')
        out += isStart ? `${CONSONANTS[ch]}y` : `${CONSONANTS[ch]}${CONSONANTS[ch]}`
        i += 2
        continue
      }
      // Handle ব-ফলা after consonant (e.g. ত্ব -> tt / t)
      if (next === '্' && chars[i + 2] === 'ব') {
        const isStart = i === 0 || !/[অ-হৎড়ঢ়য়]/.test(prev || '')
        out += isStart ? CONSONANTS[ch] : `${CONSONANTS[ch]}${CONSONANTS[ch]}`
        i += 2
        continue
      }

      // Inherent vowel rule: insert 'o' at word start when followed by a bare consonant
      const mapped = CONSONANTS[ch]
      out += mapped

      if (
        next &&
        next !== '্' &&
        !VOWEL_SIGNS[next] &&
        CONSONANTS[next] !== undefined
      ) {
        const isWordStart = i === 0 || /\s|[-_/(:]/.test(prev || '')
        const nextNext = chars[i + 2]
        const nextIsWordEndOrBare =
          !nextNext ||
          /\s|[-_/():]/.test(nextNext) ||
          (nextNext !== '্' && !VOWEL_SIGNS[nextNext] && CONSONANTS[nextNext] !== undefined)
        if (isWordStart && nextIsWordEndOrBare) {
          out += 'o'
        }
      }
      continue
    }

    if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase()
    } else if (/[\s\-_/.,:;()[\]|&+]/.test(ch)) {
      out += '-'
    }
  }

  return out
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Creates deterministic, collision-safe slug/path/lookup helpers for an entity collection.
 */
export function createEntitySlugHelpers({
  defaultList,
  basePath,
  fallbackPrefix,
  getText,
}) {
  const getBaseSlug = (item) =>
    item.slug || transliterateBengaliToSlug(getText(item)) || `${fallbackPrefix}-${item.id}`

  const getSlug = (entityOrId, entityList = defaultList) => {
    const list = Array.isArray(entityList) && entityList.length > 0 ? entityList : defaultList
    const entity =
      typeof entityOrId === 'object' && entityOrId !== null
        ? entityOrId
        : list.find((item) => String(item.id) === String(entityOrId))

    if (!entity) {
      return encodeURIComponent(String(entityOrId ?? ''))
    }

    if (entity.slug) return String(entity.slug)

    const baseSlug = transliterateBengaliToSlug(getText(entity)) || `${fallbackPrefix}-${entity.id}`
    const matching = list.filter((item) => getBaseSlug(item) === baseSlug)
    if (matching.length > 1 && String(matching[0]?.id) !== String(entity.id)) {
      return `${baseSlug}-${entity.id}`
    }

    return baseSlug
  }

  const getPath = (entityOrId, entityList = defaultList) =>
    `${basePath}/${getSlug(entityOrId, entityList)}`

  const findBySlugOrId = (param, entityList = defaultList) => {
    if (!param) return null
    const list = Array.isArray(entityList) && entityList.length > 0 ? entityList : defaultList
    const decoded = decodeURIComponent(String(param)).trim()
    const normalized = decoded.toLowerCase()

    return (
      list.find((item) => getSlug(item, list).toLowerCase() === normalized) ||
      list.find((item) => String(item.id) === decoded) ||
      null
    )
  }

  return { getSlug, getPath, findBySlugOrId }
}
