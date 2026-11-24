import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import { useData } from './useData'
import WishlistContext from './WishlistContextValue'

function wishlistKey(userId) {
  return `hosonta_wishlist_${userId}`
}

function readWishlist(userId) {
  try {
    return JSON.parse(localStorage.getItem(wishlistKey(userId)) || '[]')
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth()
  const userId = currentUser?.id
  const { books } = useData()
  const [wishlistState, setWishlistState] = useState({ userId: null, items: [] })
  const wishlist = useMemo(
    () => wishlistState.userId === userId
      ? wishlistState.items
      : userId ? readWishlist(userId) : [],
    [userId, wishlistState],
  )

  useEffect(() => {
    if (userId && wishlistState.userId === userId) {
      localStorage.setItem(wishlistKey(userId), JSON.stringify(wishlist))
    }
  }, [userId, wishlist, wishlistState.userId])

  const toggleWishlist = (bookId) => {
    if (!currentUser) return { success: false, message: 'উইশলিস্ট ব্যবহার করতে লগইন করুন।' }
    const exists = wishlist.some((id) => String(id) === String(bookId))
    setWishlistState({ userId, items: exists ? wishlist.filter((id) => String(id) !== String(bookId)) : [...wishlist, bookId] })
    return { success: true, added: !exists }
  }
  const isInWishlist = (bookId) => wishlist.some((id) => String(id) === String(bookId))
  const wishlistBooks = books.filter((book) => wishlist.some((id) => String(id) === String(book.id)))

  return <WishlistContext.Provider value={{ wishlist, wishlistBooks, toggleWishlist, isInWishlist }}>{children}</WishlistContext.Provider>
}

export default WishlistContext
