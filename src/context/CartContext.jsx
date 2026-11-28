import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { useData } from './useData'
import CartContext from './CartContextValue'
import { getBookPricing } from '../utils/bookHelpers'

const GUEST_CART_KEY = 'hosonta_cart_guest'

function toNumber(value) {
  const normalized = String(value).replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit))
  return Number(normalized) || 0
}

function readCart(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function cartKey(userId) {
  return userId ? `hosonta_cart_${userId}` : GUEST_CART_KEY
}

function mergeCart(first, second, books) {
  const merged = [...first]
  second.forEach((item) => {
    const existing = merged.find((entry) => String(entry.bookId) === String(item.bookId))
    const book = books.find((entry) => String(entry.id) === String(item.bookId))
    const max = Number(book?.stock ?? 0)
    if (existing) existing.quantity = Math.min(max, existing.quantity + item.quantity)
    else if (max > 0) merged.push({ bookId: item.bookId, quantity: Math.min(max, item.quantity) })
  })
  return merged.filter((item) => item.quantity > 0)
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth()
  const { books } = useData()
  const [lastAdded, setLastAdded] = useState(null)
  const userId = currentUser?.id
  const activeKey = cartKey(userId)
  const [cartState, setCartState] = useState(() => ({ key: GUEST_CART_KEY, items: readCart(GUEST_CART_KEY) }))
  const cartItems = useMemo(() => {
    if (cartState.key === activeKey) return cartState.items
    const savedCart = readCart(activeKey)
    return userId ? mergeCart(savedCart, readCart(GUEST_CART_KEY), books) : savedCart
  }, [activeKey, books, cartState, userId])

  useEffect(() => {
    localStorage.setItem(activeKey, JSON.stringify(cartItems))
    if (userId) localStorage.removeItem(GUEST_CART_KEY)
  }, [activeKey, cartItems, userId])

  const addToCart = (book, quantity = 1) => {
    const availableBook = books.find((item) => String(item.id) === String(book.id)) ?? book
    const stock = Number(availableBook.stock ?? 0)
    if (stock <= 0) return { success: false, message: 'স্টকে নেই।' }
    const existing = cartItems.find((item) => String(item.bookId) === String(book.id))
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > stock) return { success: false, message: `সর্বোচ্চ ${stock}টি যোগ করা যাবে।` }
    setCartState({ key: activeKey, items: existing
      ? cartItems.map((item) => String(item.bookId) === String(book.id) ? { ...item, quantity: nextQuantity } : item)
      : [...cartItems, { bookId: book.id, quantity }] })
    setLastAdded({
      book: availableBook,
      quantity,
      cartQuantity: nextQuantity,
    })
    return { success: true }
  }

  const closeLastAdded = () => setLastAdded(null)

  const removeFromCart = (bookId) => setCartState({ key: activeKey, items: cartItems.filter((item) => String(item.bookId) !== String(bookId)) })

  const updateQuantity = (bookId, quantity) => {
    const book = books.find((item) => String(item.id) === String(bookId))
    const nextQuantity = Math.max(0, Math.min(Number(quantity), Number(book?.stock ?? 0)))
    if (nextQuantity === 0) removeFromCart(bookId)
    else setCartState({ key: activeKey, items: cartItems.map((item) => String(item.bookId) === String(bookId) ? { ...item, quantity: nextQuantity } : item) })
    return nextQuantity > 0 || !book?.stock ? { success: false, message: 'স্টকে নেই।' } : { success: true }
  }

  const clearCart = () => setCartState({ key: activeKey, items: [] })
  const items = useMemo(() => cartItems.map((item) => {
    const book = books.find((entry) => String(entry.id) === String(item.bookId))
    return book ? { ...item, book, lineTotal: getBookPricing(book).sellingPrice * item.quantity } : null
  }).filter(Boolean), [books, cartItems])
  const cartTotal = items.reduce((total, item) => total + item.lineTotal, 0)
  const cartCount = items.reduce((total, item) => total + item.quantity, 0)

  return <CartContext.Provider value={{ cartItems, items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, lastAdded, closeLastAdded }}>{children}</CartContext.Provider>
}

export default CartContext
