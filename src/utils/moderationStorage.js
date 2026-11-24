import initialMagazines from '../data/magazines'
import initialMessages from '../data/moderation'
import { getStoredManuscripts, getStoredBooks, saveStoredManuscripts, saveStoredBooks } from './authorStorage'

const MAGAZINES_KEY = 'hosonta_moderation_magazines'
const MESSAGES_KEY = 'hosonta_moderation_messages'
const ACTIVITY_KEY = 'hosonta_activity_log'

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function getStoredMagazines() {
  return readStorage(MAGAZINES_KEY, initialMagazines)
}

export function saveStoredMagazines(magazines) {
  localStorage.setItem(MAGAZINES_KEY, JSON.stringify(magazines))
}

export function getStoredMessages() {
  return readStorage(MESSAGES_KEY, initialMessages)
}

export function saveStoredMessages(messages) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
}

export function getActivityLog() {
  return readStorage(ACTIVITY_KEY, [])
}

export function addActivityLog(entry) {
  const nextLog = [
    ...getActivityLog(),
    { id: `activity-${Date.now()}`, createdAt: new Date().toISOString(), ...entry },
  ]
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(nextLog))
  return nextLog
}

export {
  getStoredBooks,
  saveStoredBooks,
  getStoredManuscripts,
  saveStoredManuscripts,
}
