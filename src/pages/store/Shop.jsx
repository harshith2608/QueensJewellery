import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'

import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import ProductGrid from '../../components/store/ProductGrid.jsx'
import FilterSidebar from '../../components/store/FilterSidebar.jsx'

import { useProducts } from '../../hooks/useProducts.js'
import { useCategories } from '../../hooks/useCategories.js'

// ─── Sort helper ──────────────────────────────────────────────────────────────
function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => {
        const pa = a.salePrice ?? a.price
        const pb = b.salePrice ?? b.price
        return pa - pb
      })
    case 'price_desc':
      return arr.sort((a, b) => {
        const pa = a.salePrice ?? a.price
        const pb = b.salePrice ?? b.price
        return pb - pa
      })
    case 'name_asc':
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'newest':
    default:
      return arr // already sorted by createdAt desc from Firestore
  }
}

// ─── Shop Page ────────────────────────────────────────────────────────────────
export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  // Read URL params
  const filters = {
    category: searchParams.get('category') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sort: searchParams.get('sort') || 'newest',
  }

  const handleFiltersChange = useCallback((newFilters) => {
    const params = {}
    if (newFilters.category) params.category = newFilters.category
    if (newFilters.priceMin) params.priceMin = newFilters.priceMin
    if (newFilters.priceMax) params.priceMax = newFilters.priceMax
    if (newFilters.sort && newFilters.sort !== 'newest') params.sort = newFilters.sort
    setSearchParams(params)
  }, [setSearchParams])

  const { products: rawProducts, loading } = useProducts()
  const { categories } = useCategories()

  // Client-side filtering + sorting
  const products = useMemo(() => {
    let result = rawProducts

    // Category filter
    if (filters.category) {
      result = result.filter((p) => p.categoryId === filters.category)
    }

    // Price filter
    const min = parseFloat(filters.priceMin)
    const max = parseFloat(filters.priceMax)
    if (!isNaN(min)) {
      result = result.filter((p) => (p.salePrice ?? p.price) >= min)
    }
    if (!isNaN(max)) {
      result = result.filter((p) => (p.salePrice ?? p.price) <= max)
    }

    return sortProducts(result, filters.sort)
  }, [rawProducts, filters.category, filters.priceMin, filters.priceMax, filters.sort])

  const currentCategoryName = filters.category
    ? categories.find((c) => c.id === filters.category)?.name
    : null

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Page header */}
        <div className="bg-blush/30 border-b border-blush">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-serif text-4xl text-jewel-dark">
              {currentCategoryName ? currentCategoryName : 'All Jewellery'}
            </h1>
            {!loading && (
              <p className="text-jewel-muted text-sm mt-1">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile filter button */}
          <div className="md:hidden mb-5">
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-rose-gold text-rose-gold rounded-full text-sm font-medium hover:bg-blush transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter &amp; Sort
            </button>
          </div>

          <div className="flex gap-8 items-start">
            {/* Sidebar */}
            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={handleFiltersChange}
              mobileOpen={filterSheetOpen}
              onMobileClose={() => setFilterSheetOpen(false)}
            />

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              <ProductGrid
                products={products}
                loading={loading}
                emptyMessage="Try adjusting your filters or browse our full collection."
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
