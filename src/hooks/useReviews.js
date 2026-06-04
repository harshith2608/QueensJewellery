import { useEffect, useState } from 'react'
import { getProductReviews } from '../firebase/firestore'

/**
 * Fetches approved reviews for a product and computes aggregate stats.
 * @param {string} productId
 */
export function useProductReviews(productId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) {
      setReviews([])
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchReviews = async () => {
      setLoading(true)
      try {
        const data = await getProductReviews(productId)
        if (!cancelled) setReviews(data)
      } catch (err) {
        console.error('useProductReviews error:', err)
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReviews()
    return () => { cancelled = true }
  }, [productId])

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount
      : 0

  return { reviews, loading, averageRating, reviewCount }
}
