import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'

import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import SearchBar from '../../components/store/SearchBar.jsx'
import ProductGrid from '../../components/store/ProductGrid.jsx'

import { searchProducts } from '../../firebase/firestore.js'

const DEBOUNCE_MS = 400

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setHasSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await searchProducts(trimmed)
      setResults(data)
    } catch (err) {
      console.error(err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial search from URL param
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (value) => {
    setQuery(value)

    // Update URL
    if (value.trim()) {
      setSearchParams({ q: value.trim() })
    } else {
      setSearchParams({})
    }

    // Debounced search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, DEBOUNCE_MS)
  }

  const handleClear = () => {
    setQuery('')
    setSearchParams({})
    setResults([])
    setHasSearched(false)
  }

  const handleSubmit = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(val)
  }

  const trimmedQuery = query.trim()

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Search header */}
        <div className="bg-blush/30 border-b border-blush">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
            <h1 className="font-serif text-3xl text-jewel-dark">Search</h1>
            <SearchBar
              value={query}
              onChange={handleQueryChange}
              onSubmit={handleSubmit}
              onClear={handleClear}
              placeholder="Search by name, description, or tag..."
              autoFocus
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status text */}
          {hasSearched && !loading && trimmedQuery && (
            <p className="text-jewel-muted text-sm mb-6">
              {results.length > 0 ? (
                <>
                  Showing <strong className="text-jewel-dark">{results.length}</strong> result
                  {results.length !== 1 ? 's' : ''} for{' '}
                  <strong className="text-jewel-dark">"{trimmedQuery}"</strong>
                </>
              ) : (
                <>
                  No results for <strong className="text-jewel-dark">"{trimmedQuery}"</strong>
                </>
              )}
            </p>
          )}

          {/* Results */}
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <SearchIcon className="w-16 h-16 text-blush mb-4" />
              <p className="font-serif text-2xl text-jewel-dark mb-2">Find your perfect piece</p>
              <p className="text-jewel-muted text-sm">
                Search by jewellery name, description, or tags like "gold", "earrings", "bridal"
              </p>
            </div>
          ) : (
            <ProductGrid
              products={results}
              loading={loading}
              emptyMessage={`We couldn't find anything matching "${trimmedQuery}". Try different keywords.`}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
