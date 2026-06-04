import { useCallback, useEffect, useState } from 'react'
import { getProducts, getFeaturedProducts } from '../firebase/firestore'

/**
 * Fetches products with optional filters.
 * @param {{ categoryId?: string, featured?: boolean, limitN?: number, skip?: boolean }} opts
 *
 * Pass skip=true to defer fetching (e.g. while waiting for a categoryId to resolve).
 */
export function useProducts({ categoryId, featured, limitN, skip = false } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (featured === true && !categoryId) {
        data = await getFeaturedProducts(limitN)
      } else {
        data = await getProducts({ categoryId, featured, limit: limitN })
      }
      setProducts(data)
    } catch (err) {
      console.error('useProducts error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [categoryId, featured, limitN])

  useEffect(() => {
    if (skip) {
      setLoading(false)
      return
    }
    fetchProducts()
  }, [fetchProducts, skip])

  return { products, loading, error, refetch: fetchProducts }
}
