import { X, SlidersHorizontal } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A–Z' },
]

/**
 * Filter sidebar (desktop) / bottom-sheet (mobile).
 * Props: categories[], filters { category, priceMin, priceMax, sort }, onChange, mobileOpen, onMobileClose
 */
export default function FilterSidebar({
  categories = [],
  filters = {},
  onChange,
  mobileOpen = false,
  onMobileClose,
}) {
  const { category = '', priceMin = '', priceMax = '', sort = 'newest' } = filters

  const update = (key, value) => onChange?.({ ...filters, [key]: value })

  const clearAll = () =>
    onChange?.({ category: '', priceMin: '', priceMax: '', sort: 'newest' })

  const hasFilters = category || priceMin || priceMax || sort !== 'newest'

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-rose-gold" />
          <span className="font-serif text-lg text-jewel-dark">Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-rose-gold hover:underline transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-jewel-muted mb-3">
          Sort by
        </h4>
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sort === opt.value}
                onChange={() => update('sort', opt.value)}
                className="accent-rose-gold w-4 h-4"
              />
              <span className="text-sm text-jewel-dark group-hover:text-rose-gold transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-jewel-muted mb-3">
            Category
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value=""
                checked={category === ''}
                onChange={() => update('category', '')}
                className="accent-rose-gold w-4 h-4"
              />
              <span className="text-sm text-jewel-dark group-hover:text-rose-gold transition-colors">
                All Categories
              </span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={category === cat.id}
                  onChange={() => update('category', cat.id)}
                  className="accent-rose-gold w-4 h-4"
                />
                <span className="text-sm text-jewel-dark group-hover:text-rose-gold transition-colors">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-jewel-muted mb-3">
          Price Range
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => update('priceMin', e.target.value)}
            className="w-full px-3 py-2 border border-blush rounded-xl text-sm text-jewel-dark focus:outline-none focus:border-rose-gold bg-white"
            min={0}
          />
          <span className="text-jewel-muted text-sm">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => update('priceMax', e.target.value)}
            className="w-full px-3 py-2 border border-blush rounded-xl text-sm text-jewel-dark focus:outline-none focus:border-rose-gold bg-white"
            min={0}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 flex-shrink-0 bg-ivory rounded-2xl border border-blush p-5 self-start sticky top-24">
        {content}
      </aside>

      {/* Mobile bottom sheet */}
      <>
        <div
          className={`md:hidden fixed inset-0 bg-jewel-dark/50 z-40 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onMobileClose}
          aria-hidden="true"
        />
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ivory rounded-t-3xl p-5 pb-8 shadow-2xl transition-transform duration-300 ${
            mobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="font-serif text-xl text-jewel-dark">Filter &amp; Sort</span>
            <button
              onClick={onMobileClose}
              className="p-2 rounded-full hover:bg-blush transition-colors text-jewel-muted"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {content}
          <button
            onClick={onMobileClose}
            className="mt-6 w-full bg-rose-gold text-white py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Apply Filters
          </button>
        </div>
      </>
    </>
  )
}
