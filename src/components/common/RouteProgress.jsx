import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

function RouteProgress() {
  const { pathname, search } = useLocation()

  return (
    <motion.div
      key={`${pathname}${search}`}
      className="fixed inset-x-0 top-0 z-[120] h-1 origin-left bg-primary"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: [0, 0.75, 1], opacity: [1, 1, 0] }}
      transition={{ duration: 0.45, times: [0, 0.65, 1], ease: 'easeOut' }}
      role="progressbar"
      aria-label="পেজ লোড হচ্ছে"
    />
  )
}

export default RouteProgress
