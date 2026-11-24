import { FiLoader } from 'react-icons/fi'

function LoadingSpinner({ label = 'লোড হচ্ছে...', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <FiLoader className="animate-spin" aria-hidden="true" />
      {label}
    </span>
  )
}

export default LoadingSpinner
