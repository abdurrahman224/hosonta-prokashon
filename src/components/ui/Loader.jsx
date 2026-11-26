import { FiLoader } from 'react-icons/fi'

/**
 * Inline or centered loading spinner.
 */
export function Spinner({ label, size = 16, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-ink-muted ${className}`}>
      <FiLoader size={size} className="animate-spin text-ink" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}

/**
 * Neutral skeleton placeholder block.
 */
export function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-surface-muted ${className}`}
    />
  )
}

export default Spinner
