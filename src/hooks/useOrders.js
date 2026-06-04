import { useCallback, useEffect, useState } from 'react'
import { getAllOrders, getOrdersByUser } from '../firebase/firestore'

/**
 * Admin hook — fetches all orders with an optional status filter.
 * @param {string} [status]
 */
export function useOrders(status) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllOrders(status)
      setOrders(data)
    } catch (err) {
      console.error('useOrders error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}

/**
 * Customer hook — fetches orders belonging to a specific user.
 * @param {string} userId
 */
export function useUserOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getOrdersByUser(userId)
      setOrders(data)
    } catch (err) {
      console.error('useUserOrders error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}
