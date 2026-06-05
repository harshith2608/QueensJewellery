import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2, RefreshCw, Phone } from 'lucide-react'
import {
  getPendingNotifications,
  markNotified,
  markAllNotifiedForProduct,
  deleteNotification,
} from '../../firebase/firestore'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function NotifyRequests() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await getPendingNotifications()
      setNotifications(data)
    } catch {
      toast.error('Failed to load notify requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Group by product
  const grouped = notifications.reduce((acc, n) => {
    if (!acc[n.productId]) {
      acc[n.productId] = { productName: n.productName, productId: n.productId, requests: [] }
    }
    acc[n.productId].requests.push(n)
    return acc
  }, {})

  const setW = (id, val) => setWorking((p) => ({ ...p, [id]: val }))

  const handleMarkOne = async (id) => {
    setW(id, true)
    try {
      await markNotified(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Marked as notified')
    } catch { toast.error('Failed') }
    finally { setW(id, false) }
  }

  const handleMarkAll = async (productId, productName) => {
    setW(productId, true)
    try {
      await markAllNotifiedForProduct(productId)
      setNotifications((prev) => prev.filter((n) => n.productId !== productId))
      toast.success(`All requests for "${productName}" marked as notified`)
    } catch { toast.error('Failed') }
    finally { setW(productId, false) }
  }

  const handleDelete = async (id) => {
    setW(id + '_del', true)
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Request deleted')
    } catch { toast.error('Failed') }
    finally { setW(id + '_del', false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Notify Requests</h1>
          <p className="text-jewel-muted text-sm mt-0.5">
            {notifications.length === 0
              ? 'No pending requests'
              : `${notifications.length} customer${notifications.length !== 1 ? 's' : ''} waiting on ${Object.keys(grouped).length} product${Object.keys(grouped).length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-jewel-muted hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-full bg-blush flex items-center justify-center">
            <Bell size={24} className="text-rose-gold" />
          </div>
          <p className="font-serif text-xl text-jewel-dark">All caught up!</p>
          <p className="text-jewel-muted text-sm">No pending notify requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map(({ productId, productName, requests }) => (
            <div key={productId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Product header */}
              <div className="flex items-center justify-between px-5 py-3 bg-blush/20 border-b border-blush/30">
                <div>
                  <p className="font-medium text-jewel-dark text-sm">{productName}</p>
                  <p className="text-xs text-jewel-muted">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => handleMarkAll(productId, productName)}
                  disabled={working[productId]}
                  className="flex items-center gap-1.5 text-xs bg-rose-gold text-white px-3 py-1.5 rounded-lg hover:bg-rose-gold/90 transition-colors disabled:opacity-60"
                >
                  <CheckCheck size={12} />
                  {working[productId] ? 'Marking…' : 'Mark All Notified'}
                </button>
              </div>

              {/* Request rows */}
              <div className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
                      <Phone size={13} className="text-rose-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-jewel-dark">+91 {req.phone}</p>
                      <p className="text-xs text-jewel-muted">{formatDate(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMarkOne(req.id)}
                        disabled={working[req.id]}
                        title="Mark as notified"
                        className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                      >
                        <CheckCheck size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        disabled={working[req.id + '_del']}
                        title="Delete request"
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
