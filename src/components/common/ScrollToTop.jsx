import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.setTimeout(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
