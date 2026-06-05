import { useEffect, useState } from 'react'
import { getAllOrders, getAllRefunds } from '../firebase/firestore'

export function useAdminCounts() {
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingRefunds, setPendingRefunds] = useState(0)

  const refresh = async () => {
    try {
      const [orders, refunds] = await Promise.all([getAllOrders(), getAllRefunds()])
      setPendingOrders(orders.filter((o) => o.status === 'pending').length)
      setPendingRefunds(refunds.filter((r) => r.status === 'pending').length)
    } catch {
      // silently ignore — counts are non-critical
    }
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60_000) // re-check every minute
    return () => clearInterval(interval)
  }, [])

  return { pendingOrders, pendingRefunds }
}
