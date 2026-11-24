import { useContext } from 'react'
import CartContext from './CartContextValue'

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart অবশ্যই CartProvider-এর ভেতরে ব্যবহার করতে হবে।')
  return context
}

export default useCart
