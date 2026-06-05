import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2, RefreshCw, MessageCircle } from 'lucide-react'
import {
  getPendingNotifications,
  markNotified,
  markAllNotifiedForProduct,
  deleteNotification,
} from '../../firebase/firestore'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STORE_URL = 'https://queens-jewellery.vercel.app'

function buildWhatsAppLink(phone, productName, productId) {
  const productUrl = `${STORE_URL}/product/${productId}`
  const message =
    `Hi! 👋 Great news — the item you requested is back in stock at Queens Jewellery! 🛍️\n\n` +
    `*${productName}*\n\n` +
    `Shop now 👉 ${productUrl}\n\n` +
    `Hurry, limited stock available! ✨`
  const cleaned = phone.replace(/\D/g, '')
  const fullPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

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

  // Open WhatsApp and mark as notified
  const handleWhatsApp = async (req) => {
    const link = buildWhatsAppLink(req.phone, req.productName, req.productId)
    window.open(link, '_blank')
    // Mark as notified after opening WhatsApp
    setW(req.id, true)
    try {
      await markNotified(req.id)
      setNotifications((prev) => prev.filter((n) => n.id !== req.id))
    } catch { toast.error('Failed to mark as notified') }
    finally { setW(req.id, false) }
  }

  // Notify all for a product via WhatsApp + mark all notified
  const handleNotifyAll = async (productId, productName, requests) => {
    setW(productId, true)
    try {
      // Open each WhatsApp link with a small delay so browser doesn't block pop-ups
      requests.forEach((req, i) => {
        setTimeout(() => {
          window.open(buildWhatsAppLink(req.phone, req.productName, req.productId), '_blank')
        }, i * 600)
      })
      await markAllNotifiedForProduct(productId)
      setNotifications((prev) => prev.filter((n) => n.productId !== productId))
      toast.success(`Opened WhatsApp for all ${requests.length} customers`)
    } catch { toast.error('Failed') }
    finally { setW(productId, false) }
  }

  const handleMarkOne = async (id) => {
    setW(id + '_mark', true)
    try {
      await markNotified(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Marked as notified')
    } catch { toast.error('Failed') }
    finally { setW(id + '_mark', false) }
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

      {/* How it works hint */}
      {notifications.length > 0 && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <MessageCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-700 leading-relaxed">
            Click <strong>Notify via WhatsApp</strong> to open WhatsApp with a pre-filled message for that customer. The request is automatically marked as notified once you click.
          </p>
        </div>
      )}

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
              <div className="flex items-center justify-between px-5 py-3 bg-blush/20 border-b border-blush/30 flex-wrap gap-2">
                <div>
                  <p className="font-medium text-jewel-dark text-sm">{productName}</p>
                  <p className="text-xs text-jewel-muted">{requests.length} customer{requests.length !== 1 ? 's' : ''} waiting</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNotifyAll(productId, productName, requests)}
                    disabled={working[productId]}
                    className="flex items-center gap-1.5 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-lg hover:bg-[#20b857] transition-colors disabled:opacity-60"
                  >
                    <MessageCircle size={12} />
                    {working[productId] ? 'Opening…' : `Notify All (${requests.length})`}
                  </button>
                  <button
                    onClick={() => {
                      markAllNotifiedForProduct(productId)
                        .then(() => {
                          setNotifications((prev) => prev.filter((n) => n.productId !== productId))
                          toast.success('Marked all as notified')
                        })
                        .catch(() => toast.error('Failed'))
                    }}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 text-jewel-muted px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CheckCheck size={12} />
                    Mark All Done
                  </button>
                </div>
              </div>

              {/* Request rows */}
              <div className="divide-y divide-gray-50">
                {requests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={13} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-jewel-dark">+91 {req.phone}</p>
                      <p className="text-xs text-jewel-muted">{formatDate(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Primary: WhatsApp + auto-mark notified */}
                      <button
                        onClick={() => handleWhatsApp(req)}
                        disabled={working[req.id]}
                        title="Send WhatsApp & mark notified"
                        className="flex items-center gap-1.5 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-lg hover:bg-[#20b857] transition-colors disabled:opacity-60"
                      >
                        <MessageCircle size={12} />
                        Notify
                      </button>
                      {/* Manual mark without WhatsApp */}
                      <button
                        onClick={() => handleMarkOne(req.id)}
                        disabled={working[req.id + '_mark']}
                        title="Mark as notified without WhatsApp"
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
