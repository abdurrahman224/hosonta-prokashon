import { useContext } from 'react'
import AuthContext from './AuthContextValue'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth অবশ্যই AuthProvider-এর ভেতরে ব্যবহার করতে হবে।')
  }
  return context
}
