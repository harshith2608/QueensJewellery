import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Reusable search bar.
 * Props: value, onChange, onSubmit, placeholder, autoFocus, onClear
 */
export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Search jewellery...',
  autoFocus = false,
  onClear,
  className = '',
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className="absolute left-4 w-5 h-5 text-jewel-muted pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-white border border-blush rounded-2xl text-jewel-dark placeholder-jewel-muted focus:outline-none focus:border-rose-gold transition-colors text-sm shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onClear?.()}
          className="absolute right-3 p-1 text-jewel-muted hover:text-jewel-dark transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
