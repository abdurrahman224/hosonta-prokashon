import { useState } from 'react'
import { FiStar } from 'react-icons/fi'

function StarRating({ value = 0, onChange, interactive = false, size = 'text-lg', label = 'রেটিং' }) {
  const [hovered, setHovered] = useState(0)
  const currentValue = hovered || value

  if (!interactive) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${size} text-primary`} aria-label={`${value} স্টার`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, value - star + 1)) * 100
          return (
            <span key={star} className="relative inline-flex">
              <FiStar className="text-dark/20" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <FiStar className="fill-current" />
              </span>
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${size}`} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} স্টার`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault()
              onChange(Math.min(5, star + 1))
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault()
              onChange(Math.max(1, star - 1))
            }
          }}
          className="rounded-sm text-primary outline-none focus:ring-2 focus:ring-primary"
        >
          <FiStar className={currentValue >= star ? 'fill-current' : 'text-dark/20'} />
        </button>
      ))}
    </div>
  )
}

export default StarRating
