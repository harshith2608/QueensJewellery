import { useEffect, useState } from 'react'
import { getCategories } from '../firebase/firestore'

/** Returns active categories ordered by displayOrder. */
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchCategories = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getCategories()
        if (!cancelled) setCategories(data)
      } catch (err) {
        console.error('useCategories error:', err)
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCategories()
    return () => { cancelled = true }
  }, [])

  return { categories, loading, error }
}
