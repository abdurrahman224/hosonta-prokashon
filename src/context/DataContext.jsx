import { useState } from 'react'
import ordersSeed from '../data/orders'
import reviewsSeed from '../data/reviews'
import { initialPublishers } from '../data/publishers'
import { getStoredBooks, saveStoredBooks } from '../utils/authorStorage'
import { hasPermission, PERMISSIONS } from '../utils/roles'
import { addActivityLog } from '../utils/moderationStorage'
import DataContext from './DataContextValue'

const ORDERS_KEY = 'hosonta_orders'
const STOCK_HISTORY_KEY = 'hosonta_stock_history'
const REVIEWS_KEY = 'hosonta_reviews'
const NOTIFICATIONS_KEY = 'hosonta_notifications'
const PUBLISHERS_KEY = 'hosonta_publishers'
const statusOrder = ['new', 'processing', 'shipped', 'delivered']

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function getStockedBooks() {
  return getStoredBooks().map((book, idx) => ({
    ...book,
    publisher: book.publisher || (idx % 3 === 1 ? 'সেরা পাবলিকেশন' : 'হসন্ত প্রকাশন'),
    stock: Number.isFinite(Number(book.stock)) ? Number(book.stock) : 0,
    lowStockLimit: Number.isFinite(Number(book.lowStockLimit)) ? Number(book.lowStockLimit) : 5,
    isbn: book.isbn || book.sku || `HP-${String(book.id).padStart(4, '0')}`,
    sku: book.sku || book.isbn || `HP-${String(book.id).padStart(4, '0')}`,
  }))
}

function getStoredOrders() {
  const stored = readStorage(ORDERS_KEY, ordersSeed)
  const userIdsByName = Object.fromEntries(ordersSeed.filter((order) => order.userId).map((order) => [order.customerName, order.userId]))
  const merged = [
    ...stored,
    ...ordersSeed.filter(seed => !stored.some(order => String(order.id) === String(seed.id))),
  ]
  return merged.map((order) => ({
    ...order,
    orderType: order.orderType || (order.shopName ? 'counter' : 'online'),
    userId: order.userId ?? userIdsByName[order.customerName],
    paymentStatus: order.paymentStatus ?? (order.orderType === 'counter' ? 'paid' : 'cod'),
    paymentMethod: order.paymentMethod ?? (order.orderType === 'counter' ? 'cash' : 'cod'),
    statusHistory: order.statusHistory ?? [{ status: order.status, at: `${order.date}T00:00:00.000Z` }],
  }))
}

function getStoredReviews() {
  const stored = readStorage(REVIEWS_KEY, reviewsSeed)
  return stored.map((review) => ({
    ...review,
    helpfulBy: Array.isArray(review.helpfulBy) ? review.helpfulBy : [],
    reports: Array.isArray(review.reports) ? review.reports : [],
  }))
}

function containsSpam(text) {
  return /(https?:\/\/|www\.|(?:\+?৮৮)?০১[৩-৯]\d{8}|(?:\+?88)?01[3-9]\d{8})/i.test(text)
}

export function DataProvider({ children }) {
  const [orders, setOrders] = useState(getStoredOrders)
  const [books, setBooks] = useState(getStockedBooks)
  const [stockHistory, setStockHistory] = useState(() => readStorage(STOCK_HISTORY_KEY, []))
  const [reviews, setReviews] = useState(getStoredReviews)
  const [notifications, setNotifications] = useState(() => readStorage(NOTIFICATIONS_KEY, []))
  const [publishers, setPublishers] = useState(() => {
    const stored = readStorage(PUBLISHERS_KEY, initialPublishers)
    const missing = initialPublishers.filter(
      (init) => !stored.some((item) => item.name === init.name || item.id === init.id)
    )
    return [...stored, ...missing]
  })

  const savePublishers = (nextPublishers) => {
    setPublishers(nextPublishers)
    try {
      localStorage.setItem(PUBLISHERS_KEY, JSON.stringify(nextPublishers))
    } catch (err) {
      console.error('Failed to save publishers', err)
    }
  }

  const addPublisher = (input) => {
    const id = input.id || `pub-${Date.now()}`
    const newPublisher = {
      ...input,
      id,
      name: (input.name || '').trim(),
      status: input.status || 'active',
      createdAt: new Date().toISOString(),
    }
    const nextList = [...publishers, newPublisher]
    savePublishers(nextList)
    return { success: true, publisher: newPublisher }
  }

  const updatePublisher = (id, updates) => {
    const nextList = publishers.map((pub) =>
      pub.id === id || pub.name === id
        ? { ...pub, ...updates, updatedAt: new Date().toISOString() }
        : pub
    )
    savePublishers(nextList)
    return { success: true }
  }

  const deletePublisher = (id) => {
    const nextList = publishers.filter((pub) => pub.id !== id && pub.name !== id)
    savePublishers(nextList)
    return { success: true }
  }

  const saveReviews = (nextReviews) => {
    setReviews(nextReviews)
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(nextReviews))
  }

  const createNotifications = (entries) => {
    const nextNotifications = [
      ...entries.map((entry) => ({
        id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        read: false,
        ...entry,
      })),
      ...notifications,
    ]
    setNotifications(nextNotifications)
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(nextNotifications))
  }

  const markNotificationRead = (notificationId) => {
    const nextNotifications = notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item,
    )
    setNotifications(nextNotifications)
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(nextNotifications))
  }

  const getBookReviews = (bookId) =>
    reviews.filter((review) => String(review.bookId) === String(bookId) && review.status === 'approved')

  const getBookRatingStats = (bookId) => {
    const approvedReviews = getBookReviews(bookId)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    approvedReviews.forEach((review) => { distribution[review.rating] += 1 })
    const total = approvedReviews.length
    const average = total ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / total : 0
    return { average, total, distribution }
  }

  const addReview = (input, user) => {
    if (!user || user.role !== 'user' || !hasPermission(user.role, PERMISSIONS.REVIEW_WRITE)) {
      return { success: false, message: 'শুধু লগইন করা পাঠক রিভিউ লিখতে পারবেন।' }
    }
    const book = books.find((item) => String(item.id) === String(input.bookId))
    if (!book) return { success: false, message: 'বইটি পাওয়া যায়নি।' }
    if (String(book.authorId) === String(user.id)) {
      return { success: false, message: 'নিজের বইয়ে রিভিউ দেওয়া যাবে না।' }
    }
    if (!Number.isInteger(Number(input.rating)) || Number(input.rating) < 1 || Number(input.rating) > 5) {
      return { success: false, message: '১ থেকে ৫ স্টারের মধ্যে রেটিং দিন।' }
    }
    if (typeof input.comment !== 'string' || input.comment.trim().length < 20 || input.comment.trim().length > 1000) {
      return { success: false, message: 'মন্তব্য ২০ থেকে ১০০০ অক্ষরের মধ্যে হতে হবে।' }
    }
    if (String(input.title ?? '').trim().length > 80) {
      return { success: false, message: 'শিরোনাম সর্বোচ্চ ৮০ অক্ষর হতে পারবে।' }
    }
    if (reviews.some((review) => String(review.bookId) === String(input.bookId) && review.userId === user.id)) {
      return { success: false, message: 'এই বইয়ে আপনার একটি রিভিউ ইতিমধ্যে আছে।' }
    }
    const now = new Date().toISOString()
    const lastSubmitKey = `hosonta_review_last_submit_${user.id}_${input.bookId}`
    if (Date.now() - Number(localStorage.getItem(lastSubmitKey) || 0) < 30000) {
      return { success: false, message: 'দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।' }
    }
    if (containsSpam(`${input.title ?? ''} ${input.comment ?? ''}`)) {
      return { success: false, message: 'রিভিউতে লিংক বা ফোন নম্বর ব্যবহার করা যাবে না।' }
    }
    const verifiedPurchase = orders.some((order) =>
      order.userId === user.id &&
      order.status === 'delivered' &&
      order.items?.some((item) => String(item.bookId) === String(input.bookId)),
    )
    const review = {
      id: `review-${Date.now()}`,
      bookId: input.bookId,
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      rating: Number(input.rating),
      title: (input.title ?? '').trim(),
      comment: input.comment.trim(),
      images: Array.isArray(input.images) ? input.images.slice(0, 3) : [],
      status: 'pending',
      verifiedPurchase,
      helpfulCount: 0,
      helpfulBy: [],
      reports: [],
      createdAt: now,
      updatedAt: now,
      moderatorNote: '',
    }
    saveReviews([review, ...reviews])
    createNotifications([
      { userId: book.authorId, role: 'author', type: 'new-review', title: 'আপনার বইয়ে নতুন রিভিউ এসেছে।', link: `/books/${book.id}#reviews` },
      { role: 'moderator', type: 'pending-review', title: 'নতুন রিভিউ অনুমোদনের অপেক্ষায় আছে।', link: '/dashboard/review-moderation' },
      { role: 'admin', type: 'pending-review', title: 'নতুন রিভিউ অনুমোদনের অপেক্ষায় আছে।', link: '/dashboard/review-moderation' },
    ])
    localStorage.setItem(lastSubmitKey, String(Date.now()))
    return { success: true, review }
  }

  const updateReview = (reviewId, input, user) => {
    const existing = reviews.find((review) => review.id === reviewId)
    if (!existing) return { success: false, message: 'রিভিউটি পাওয়া যায়নি।' }
    const canModerate = user && hasPermission(user.role, PERMISSIONS.REVIEW_MODERATE)
    const canEditOwn = user && existing.userId === user.id && hasPermission(user.role, PERMISSIONS.REVIEW_EDIT_OWN)
    if (!user || (!canEditOwn && !canModerate)) return { success: false, message: 'এই রিভিউ সম্পাদনার অনুমতি নেই।' }
    if (!canModerate && containsSpam(`${input.title ?? ''} ${input.comment ?? ''}`)) {
      return { success: false, message: 'রিভিউতে লিংক বা ফোন নম্বর ব্যবহার করা যাবে না।' }
    }
    if (!canModerate && (!Number.isInteger(Number(input.rating)) || Number(input.rating) < 1 || Number(input.rating) > 5 || typeof input.comment !== 'string' || input.comment.trim().length < 20 || input.comment.trim().length > 1000 || String(input.title ?? '').trim().length > 80)) {
      return { success: false, message: 'রিভিউয়ের তথ্য সঠিকভাবে পূরণ করুন।' }
    }
    const nextReviews = reviews.map((review) =>
      review.id === reviewId
        ? { ...review, ...(canModerate ? input : { ...input, status: 'pending', moderatorNote: '' }), updatedAt: new Date().toISOString() }
        : review,
    )
    saveReviews(nextReviews)
    if (canEditOwn) {
      createNotifications([
        { role: 'moderator', type: 'pending-review', title: 'একটি রিভিউ আবার অনুমোদনের অপেক্ষায় আছে।', link: '/dashboard/review-moderation' },
        { role: 'admin', type: 'pending-review', title: 'একটি রিভিউ আবার অনুমোদনের অপেক্ষায় আছে।', link: '/dashboard/review-moderation' },
      ])
    }
    if (canModerate && input.status && input.status !== existing.status) {
      const activityAction = input.status === 'approved' ? 'approve' : input.status === 'rejected' ? 'reject' : 'hide'
      addActivityLog({ actorId: user.id, actorRole: user.role, action: activityAction, entity: 'review', entityId: reviewId, comment: input.moderatorNote ?? '' })
      createNotifications([{
        userId: existing.userId,
        type: 'review-decision',
        title: input.status === 'approved' ? 'আপনার রিভিউ অনুমোদিত হয়েছে।' : `আপনার রিভিউ ${input.status === 'rejected' ? 'প্রত্যাখ্যান' : 'লুকানো'} হয়েছে।`,
        message: input.moderatorNote ?? '',
        link: `/books/${existing.bookId}#reviews`,
      }])
    }
    return { success: true }
  }

  const deleteReview = (reviewId, user) => {
    const existing = reviews.find((review) => review.id === reviewId)
    const canDeleteOwn = user && existing?.userId === user.id && hasPermission(user.role, PERMISSIONS.REVIEW_DELETE_OWN)
    const canDeleteAny = user && hasPermission(user.role, PERMISSIONS.REVIEW_DELETE_ANY)
    if (!existing || !user || (!canDeleteOwn && !canDeleteAny)) {
      return { success: false, message: 'এই রিভিউ মুছে ফেলার অনুমতি নেই।' }
    }
    saveReviews(reviews.filter((review) => review.id !== reviewId))
    return { success: true }
  }

  const toggleHelpful = (reviewId, userId) => {
    if (!userId) return { success: false, message: 'সহায়ক ভোট দিতে লগইন করুন।' }
    const existing = reviews.find((review) => review.id === reviewId)
    if (!existing || existing.userId === userId) return { success: false, message: 'নিজের রিভিউতে ভোট দেওয়া যাবে না।' }
    const hasVoted = existing.helpfulBy.includes(userId)
    const nextReviews = reviews.map((review) => review.id === reviewId ? {
      ...review,
      helpfulBy: hasVoted ? review.helpfulBy.filter((id) => id !== userId) : [...review.helpfulBy, userId],
      helpfulCount: Math.max(0, review.helpfulCount + (hasVoted ? -1 : 1)),
    } : review)
    saveReviews(nextReviews)
    return { success: true, added: !hasVoted }
  }

  const reportReview = (reviewId, userId, reason, user) => {
    if (!userId || !user || !hasPermission(user.role, PERMISSIONS.REVIEW_REPORT)) return { success: false, message: 'রিভিউ রিপোর্ট করার অনুমতি নেই।' }
    const existing = reviews.find((review) => review.id === reviewId)
    if (!existing || existing.reports.some((report) => report.userId === userId)) {
      return { success: false, message: 'আপনি এই রিভিউটি ইতিমধ্যে রিপোর্ট করেছেন।' }
    }
    const nextReviews = reviews.map((review) => review.id === reviewId ? {
      ...review,
      reports: [...review.reports, { userId, reason, createdAt: new Date().toISOString() }],
    } : review)
    saveReviews(nextReviews)
    createNotifications([
      { role: 'moderator', type: 'review-report', title: 'একটি রিভিউ রিপোর্ট করা হয়েছে।', link: '/dashboard/review-moderation' },
      { role: 'admin', type: 'review-report', title: 'একটি রিভিউ রিপোর্ট করা হয়েছে।', link: '/dashboard/review-moderation' },
    ])
    return { success: true }
  }

  const updateOrderStatus = (orderId, nextStatus) => {
    const current = orders.find((order) => order.id === orderId)
    if (!current || current.status === 'cancelled') return { success: false, message: 'এই অর্ডারের স্ট্যাটাস পরিবর্তন করা যাবে না।' }
    const currentIndex = statusOrder.indexOf(current.status)
    const nextIndex = statusOrder.indexOf(nextStatus)
    if (nextStatus !== 'cancelled' && nextIndex !== currentIndex + 1) {
      return { success: false, message: 'শুধু পরবর্তী ধাপের স্ট্যাটাস নির্বাচন করা যাবে।' }
    }
    const now = new Date().toISOString()
    const nextBooks = nextStatus === 'cancelled'
      ? books.map((book) => {
        const item = current.items?.find((entry) => String(entry.bookId) === String(book.id))
        return item ? { ...book, stock: Number(book.stock) + Number(item.quantity) } : book
      })
      : books
    const nextOrders = orders.map((order) => order.id === orderId ? { ...order, status: nextStatus, updatedAt: now, statusHistory: [...(order.statusHistory ?? []), { status: nextStatus, at: now }] } : order)
    if (nextStatus === 'cancelled') {
      setBooks(nextBooks)
      saveStoredBooks(nextBooks)
    }
    setOrders(nextOrders)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders))
    return { success: true }
  }

  const createOrder = (orderInput) => {
    const requestedItems = orderInput.items ?? []
    const checkedItems = requestedItems.map((item) => {
      const book = books.find((entry) => String(entry.id) === String(item.bookId))
      return { item, book }
    })
    const unavailable = checkedItems.find(({ item, book }) => !book || Number(book.stock) < Number(item.quantity))
    if (unavailable) {
      const itemTitle = typeof unavailable.item.title === 'object' ? (unavailable.item.title?.bn || unavailable.item.title?.en) : unavailable.item.title
      return { success: false, message: `${itemTitle || 'বই'}টির পর্যাপ্ত স্টক নেই।` }
    }
    const nextBooks = books.map((book) => {
      const item = requestedItems.find((entry) => String(entry.bookId) === String(book.id))
      return item ? { ...book, stock: Number(book.stock) - Number(item.quantity) } : book
    })
    const now = new Date()
    const isCounter = orderInput.orderType === 'counter'
    const order = {
      ...orderInput,
      id: orderInput.id || (isCounter
        ? `CNT-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`
        : `ORD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-5)}`),
      date: orderInput.date || now.toISOString().slice(0, 10),
      orderType: orderInput.orderType || 'online',
      status: orderInput.status || (isCounter ? 'delivered' : 'new'),
      paymentStatus: orderInput.paymentStatus || (orderInput.paymentMethod === 'cod' ? 'cod' : isCounter ? 'paid' : 'pending'),
      paymentMethod: orderInput.paymentMethod || (isCounter ? 'cash' : 'cod'),
      statusHistory: [{ status: orderInput.status || (isCounter ? 'delivered' : 'new'), at: now.toISOString() }],
    }
    const nextOrders = [order, ...orders]
    setBooks(nextBooks)
    setOrders(nextOrders)
    saveStoredBooks(nextBooks)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders))
    return { success: true, order }
  }

  const cancelOrder = (orderId, userId) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order || order.userId !== userId || order.status !== 'new') {
      return { success: false, message: 'এই অর্ডারটি এখন বাতিল করা যাবে না।' }
    }
    const restoredBooks = books.map((book) => {
      const item = order.items.find((entry) => String(entry.bookId) === String(book.id))
      return item ? { ...book, stock: Number(book.stock) + Number(item.quantity) } : book
    })
    const now = new Date().toISOString()
    const nextOrders = orders.map((item) => item.id === orderId ? { ...item, status: 'cancelled', updatedAt: now, statusHistory: [...(item.statusHistory ?? []), { status: 'cancelled', at: now }] } : item)
    setBooks(restoredBooks)
    setOrders(nextOrders)
    saveStoredBooks(restoredBooks)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders))
    return { success: true }
  }

  const markPaymentVerified = (orderId) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order || order.paymentMethod === 'cod') return { success: false, message: 'এই অর্ডারের ম্যানুয়াল পেমেন্ট নেই।' }
    const nextOrders = orders.map((item) => item.id === orderId ? { ...item, paymentStatus: 'verified', paymentVerifiedAt: new Date().toISOString() } : item)
    setOrders(nextOrders)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders))
    return { success: true }
  }

  const updateBookStock = (bookId, delta, reason, userId) => {
    const amount = Number(delta)
    if (!Number.isInteger(amount) || amount === 0 || !reason.trim()) return { success: false, message: 'পরিমাণ ও কারণ সঠিকভাবে দিন।' }
    const book = books.find((item) => String(item.id) === String(bookId))
    if (!book || Number(book.stock) + amount < 0) return { success: false, message: 'স্টক শূন্যের নিচে যেতে পারে না।' }
    const nextBooks = books.map((item) => item.id === book.id ? { ...item, stock: Number(item.stock) + amount } : item)
    const historyEntry = { id: `stock-${Date.now()}`, bookId: book.id, bookTitle: book.title, delta: amount, reason: reason.trim(), userId, createdAt: new Date().toISOString() }
    const nextHistory = [historyEntry, ...stockHistory]
    setBooks(nextBooks)
    setStockHistory(nextHistory)
    saveStoredBooks(nextBooks)
    localStorage.setItem(STOCK_HISTORY_KEY, JSON.stringify(nextHistory))
    return { success: true }
  }

  const addBook = (bookInput) => {
    const maxId = books.reduce((max, book) => Math.max(max, Number(book.id) || 0), 0)
    const id = bookInput.id || maxId + 1
    const sku = String(bookInput.sku || bookInput.isbn || '').trim() || `HP-${String(id).padStart(4, '0')}`
    const now = new Date().toISOString()
    const book = {
      ...bookInput,
      id,
      publisher: bookInput.publisher || 'হসন্ত প্রকাশন',
      sku,
      isbn: String(bookInput.isbn || sku).trim(),
      stock: Number(bookInput.stock || 0),
      lowStockLimit: Number(bookInput.lowStockLimit || 5),
      createdAt: bookInput.createdAt || now,
      updatedAt: now,
    }
    const nextBooks = [book, ...books]
    setBooks(nextBooks)
    saveStoredBooks(nextBooks)
    return { success: true, book }
  }

  const updateBook = (bookId, updates) => {
    const nextBooks = books.map((b) =>
      String(b.id) === String(bookId)
        ? {
            ...b,
            ...updates,
            id: b.id,
            updatedAt: new Date().toISOString(),
          }
        : b
    )
    setBooks(nextBooks)
    saveStoredBooks(nextBooks)
    return { success: true }
  }

  const deleteBook = (bookId) => {
    const nextBooks = books.filter((b) => String(b.id) !== String(bookId))
    setBooks(nextBooks)
    saveStoredBooks(nextBooks)
    return { success: true }
  }

  return <DataContext.Provider value={{ orders, books, stockHistory, reviews, notifications, publishers, addPublisher, updatePublisher, deletePublisher, updateOrderStatus, updateBookStock, addBook, updateBook, deleteBook, createOrder, cancelOrder, markPaymentVerified, addReview, updateReview, deleteReview, toggleHelpful, reportReview, getBookReviews, getBookRatingStats, markNotificationRead }}>{children}</DataContext.Provider>
}

export default DataContext
