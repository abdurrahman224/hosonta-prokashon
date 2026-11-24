import { useContext } from 'react'
import DataContext from './DataContextValue'

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData অবশ্যই DataProvider-এর ভেতরে ব্যবহার করতে হবে।')
  }
  return context
}

export default useData
