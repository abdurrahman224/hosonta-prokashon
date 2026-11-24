import { useContext } from 'react'
import WishlistContext from './WishlistContextValue'

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist অবশ্যই WishlistProvider-এর ভেতরে ব্যবহার করতে হবে।')
  return context
}

export default useWishlist
