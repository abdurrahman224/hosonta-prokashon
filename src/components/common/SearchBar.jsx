import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import useDebounce from '../../hooks/useDebounce'

function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'খুঁজুন...',
  className = '',
  autoFocus = false,
  onSubmit,
}) {
  const [inputValue, setInputValue] = useState(value)
  const debouncedValue = useDebounce(inputValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange?.(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    setInputValue('')
    onChange?.('')
    onClear?.()
  }

  return (
    <div
      className={`relative ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && onSubmit) onSubmit(inputValue.trim())
      }}
    >
      <FiSearch
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted"
      />
      <input
        ref={inputRef}
        type="search"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-dark/10 bg-white py-3 pl-11 pr-11 text-dark outline-none transition placeholder:text-dark-light focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label={placeholder}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-dark-muted transition hover:bg-dark/10 hover:text-dark"
          aria-label="সার্চ মুছে ফেলুন"
        >
          <FiX />
        </button>
      )}
    </div>
  )
}

export default SearchBar
