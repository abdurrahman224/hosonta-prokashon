import initialApplications from '../data/authorApplications'
import initialReviews from '../data/reviews'

const APPLICATIONS_KEY = 'hosonta_author_applications'
const ADDRESSES_KEY = 'hosonta_user_addresses'
const REVIEWS_KEY = 'hosonta_user_reviews'

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function getAuthorApplications() {
  return readStorage(APPLICATIONS_KEY, initialApplications)
}

export function saveAuthorApplications(applications) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
}

export function getAddresses(userId) {
  return readStorage(ADDRESSES_KEY, {})[userId] ?? []
}

export function saveAddresses(userId, addresses) {
  const allAddresses = readStorage(ADDRESSES_KEY, {})
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify({ ...allAddresses, [userId]: addresses }))
}

export function getReviews() {
  return readStorage(REVIEWS_KEY, initialReviews)
}

export function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
}
