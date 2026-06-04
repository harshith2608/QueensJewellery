import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, MapPin, CreditCard, ChevronDown, ChevronUp,
  ShoppingBag, Clock, CheckCircle2, Circle, Truck, Home, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../../contexts/AuthContext.jsx'
import { getOrdersByUser } from '../../firebase/firestore.js'
import { formatPrice, formatDate } from '../../utils/formatters.js'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

// ─── Status pipeline ──────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: Clock },
  { key: 'confirmed', label: 'Confirmed',       icon: CheckCircle2 },
  { key: 'processing',label: 'Processing',      icon: Package },
  { key: 'shipped',   label: 'Shipped',         icon: Truck },
  { key: 'delivered', label: 'Delivered',       icon: Home },
]

const STATUS_COLORS = {
  pending:    'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
}

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${cls}`}>
      {status}
    </span>
  )
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ currentStatus, statusHistory }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus)

  // Build a map: step key → history entry (most recent for that key)
  const historyMap = {}
  for (const entry of statusHistory || []) {
    historyMap[entry.status] = entry
  }

  return (
    <div className="mt-4">
      <div className="relative">
        {STATUS_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isFuture = idx > currentIdx
          const histEntry = historyMap[step.key]
          const Icon = step.icon

          return (
            <div key={step.key} className="flex gap-3 pb-6 last:pb-0 relative">
              {/* Vertical connector */}
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`absolute left-[13px] top-7 w-0.5 h-full -translate-x-px ${
                    isDone ? 'bg-rose-gold' : 'bg-blush'
                  }`}
                />
              )}

              {/* Step indicator */}
              <div className="relative flex-shrink-0">
                {isDone && (
                  <div className="w-7 h-7 rounded-full bg-rose-gold flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-ivory" />
                  </div>
                )}
                {isCurrent && (
                  <div className="relative w-7 h-7">
                    <div className="absolute inset-0 rounded-full bg-rose-gold/30 animate-ping" />
                    <div className="relative w-7 h-7 rounded-full bg-rose-gold flex items-center justify-center">
                      <Icon size={13} className="text-ivory" />
                    </div>
                  </div>
                )}
                {isFuture && (
                  <div className="w-7 h-7 rounded-full border-2 border-blush bg-ivory flex items-center justify-center">
                    <Circle size={10} className="text-blush" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="pt-0.5 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isFuture ? 'text-jewel-muted' : 'text-jewel-dark'
                  }`}
                >
                  {step.label}
                </p>
                {histEntry?.note && (
                  <p className="text-xs text-jewel-muted mt-0.5">{histEntry.note}</p>
                )}
                {histEntry?.timestamp && (
                  <p className="text-xs text-jewel-muted mt-0.5">
                    {formatDate(histEntry.timestamp)}
                  </p>
                )}
                {isCurrent && !histEntry && (
                  <p className="text-xs text-rose-gold mt-0.5">In progress</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false)
  const itemCount = (order.items || []).reduce((s, i) => s + i.quantity, 0)
  const shortId = order.id.slice(-8).toUpperCase()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blush/50 overflow-hidden">
      {/* Row header — always visible */}
      <button
        className="w-full text-left px-5 py-4"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-rose-gold font-semibold text-sm">#{shortId}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-jewel-muted text-xs">
              {formatDate(order.createdAt)} · {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatPrice(order.total)}
            </p>
          </div>
          <div className="flex-shrink-0 text-jewel-muted">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-blush px-5 pb-5 space-y-5 pt-4">
          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={14} className="text-rose-gold" />
              <h3 className="font-serif text-base text-jewel-dark">Items</h3>
            </div>
            <div className="space-y-3">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-blush/30 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={18} className="text-rose-gold/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-jewel-dark text-sm font-medium line-clamp-2 leading-tight">{item.name}</p>
                    <p className="text-jewel-muted text-xs">Qty: {item.quantity} · {formatPrice(item.price)}</p>
                  </div>
                  <span className="text-jewel-dark text-sm font-semibold flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-3 pt-3 border-t border-blush space-y-1 text-sm">
              {order.globalOffer?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {order.globalOffer.type === 'percent'
                      ? `${order.globalOffer.value}% off`
                      : `Flat ₹${order.globalOffer.value} off`}
                  </span>
                  <span>−{formatPrice(order.globalOffer.discount)}</span>
                </div>
              )}
              {order.coupon?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.coupon.code})</span>
                  <span>−{formatPrice(order.coupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-jewel-dark">
                <span>Total</span>
                <span className="text-rose-gold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          {order.address && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-rose-gold" />
                <h3 className="font-serif text-base text-jewel-dark">Delivery Address</h3>
              </div>
              <div className="text-sm text-jewel-muted leading-relaxed bg-blush/20 rounded-xl p-3">
                <p className="font-medium text-jewel-dark">{order.address.fullName}</p>
                <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
                <p>{order.address.city}, {order.address.state} – {order.address.pincode}</p>
                {order.address.phone && <p className="mt-0.5">{order.address.phone}</p>}
              </div>
            </div>
          )}

          {/* Payment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={14} className="text-rose-gold" />
              <h3 className="font-serif text-base text-jewel-dark">Payment</h3>
            </div>
            <div className="text-sm text-jewel-muted space-y-0.5">
              <p>
                Method:{' '}
                <span className="text-jewel-dark font-medium capitalize">
                  {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'WhatsApp / COD'}
                </span>
              </p>
              {order.paymentId && (
                <p>
                  ID: <span className="font-mono text-xs text-jewel-dark">{order.paymentId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div>
            <h3 className="font-serif text-base text-jewel-dark mb-1">Order Status</h3>
            <StatusTimeline
              currentStatus={order.status}
              statusHistory={order.statusHistory || []}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrderTracking() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    getOrdersByUser(user.uid)
      .then(setOrders)
      .catch((err) => {
        console.error('Failed to fetch orders:', err)
        toast.error('Failed to load orders. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 pb-28 md:pb-10">
        <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-2">My Orders</h1>
        <p className="text-jewel-muted text-sm mb-8">
          Track and manage all your orders in one place.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <Spinner size="lg" />
              <p className="text-jewel-muted text-sm">Loading your orders…</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 space-y-5">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blush mx-auto">
              <ShoppingBag size={36} className="text-rose-gold" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-jewel-dark mb-2">No orders yet</h2>
              <p className="text-jewel-muted text-sm max-w-xs mx-auto">
                You haven't placed any orders. Start exploring our collection!
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-rose-gold text-ivory px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Shop Now
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
