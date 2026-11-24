import initialBooks from '../data/books'
import initialManuscripts from '../data/manuscripts'

const BOOKS_KEY = 'hosonta_author_books'
const MANUSCRIPTS_KEY = 'hosonta_author_manuscripts'

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function getStoredBooks() {
  return readStorage(BOOKS_KEY, initialBooks)
}

export function saveStoredBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
}

export function getStoredManuscripts() {
  return readStorage(MANUSCRIPTS_KEY, initialManuscripts)
}

export function saveStoredManuscripts(manuscripts) {
  localStorage.setItem(MANUSCRIPTS_KEY, JSON.stringify(manuscripts))
}
