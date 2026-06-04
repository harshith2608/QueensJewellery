import { useState, useMemo, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'

import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import ProductGrid from '../../components/store/ProductGrid.jsx'
import FilterSidebar from '../../components/store/FilterSidebar.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

import { useCategories } from '../../hooks/useCategories.js'
import { useProducts } from '../../hooks/useProducts.js'

const PLACEHOLDER_HERO = null

function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
    case 'price_desc':
      return arr.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
    case 'name_asc':
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    default:
      return arr
  }
}

export default function Category() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const { categories, loading: catLoading } = useCategories()
  const category = categories.find((c) => c.slug === slug)

  const filters = {
    category: '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sort: searchParams.get('sort') || 'newest',
  }

  const handleFiltersChange = useCallback((newFilters) => {
    const params = {}
    if (newFilters.priceMin) params.priceMin = newFilters.priceMin
    if (newFilters.priceMax) params.priceMax = newFilters.priceMax
    if (newFilters.sort && newFilters.sort !== 'newest') params.sort = newFilters.sort
    setSearchParams(params)
  }, [setSearchParams])

  // Skip product fetch until category is resolved — avoids a redundant "all products" query
  // while useCategories is still loading, and prevents a stuck loading state.
  const { products: rawProducts, loading: productsLoading, error: productsError } = useProducts({
    categoryId: category?.id,
    skip: catLoading || !category,
  })

  const products = useMemo(() => {
    let result = rawProducts
    const min = parseFloat(filters.priceMin)
    const max = parseFloat(filters.priceMax)
    if (!isNaN(min)) result = result.filter((p) => (p.salePrice ?? p.price) >= min)
    if (!isNaN(max)) result = result.filter((p) => (p.salePrice ?? p.price) <= max)
    return sortProducts(result, filters.sort)
  }, [rawProducts, filters.priceMin, filters.priceMax, filters.sort])

  // Loading state while categories are being fetched
  if (catLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    )
  }

  // Category not found
  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <h2 className="font-serif text-3xl text-jewel-dark">Category Not Found</h2>
          <p className="text-jewel-muted text-sm">
            The category you are looking for does not exist.
          </p>
          <Link
            to="/shop"
            className="text-rose-gold hover:underline text-sm font-medium"
          >
            Browse All Products
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero banner */}
        <section className="relative h-48 sm:h-64 md:h-80 overflow-hidden bg-blush">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blush via-rose-gold/20 to-ivory" />
          )}
          <div className="absolute inset-0 bg-jewel-dark/40" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-ivory/70 text-xs mb-2">
              <Link to="/" className="hover:text-ivory transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-ivory font-medium">{category.name}</span>
            </nav>

            <h1 className="font-serif text-3xl sm:text-5xl text-ivory">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-ivory/80 text-sm mt-2 max-w-lg">{category.description}</p>
            )}
          </div>
        </section>

        {/* Product count bar */}
        <div className="border-b border-blush bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            {!productsLoading && (
              <p className="text-jewel-muted text-sm">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            )}
            {/* Mobile filter button */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border border-rose-gold text-rose-gold rounded-full text-sm font-medium hover:bg-blush transition-colors ml-auto"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter &amp; Sort
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8 items-start">
            {/* Sidebar (no category filter here, already scoped) */}
            <FilterSidebar
              categories={[]}
              filters={filters}
              onChange={handleFiltersChange}
              mobileOpen={filterSheetOpen}
              onMobileClose={() => setFilterSheetOpen(false)}
            />

            {/* Products */}
            <div className="flex-1 min-w-0">
              {productsError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <p className="font-serif text-xl text-jewel-dark">Couldn't load products</p>
                  <p className="text-jewel-muted text-sm">Check your connection and try again.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-rose-gold font-medium underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <ProductGrid
                  products={products}
                  loading={productsLoading}
                  emptyMessage={`No products in ${category.name} yet. Check back soon!`}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
