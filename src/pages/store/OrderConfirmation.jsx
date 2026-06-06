import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, MapPin, CreditCard, Clock, ArrowRight, Home } from 'lucide-react'

import { getOrdersByUser } from '../../firebase/firestore.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { formatPrice, formatDate } from '../../utils/formatters.js'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId || !user) {
      setLoading(false)
      return
    }

    // Fetch the order — retry briefly since Firestore write might take a moment
    let attempts = 0
    const fetchOrder = async () => {
      try {
        const orders = await getOrdersByUser(user.uid)
        const found = orders.find((o) => o.id === orderId)
        if (found) {
          setOrder(found)
          setLoading(false)
        } else if (attempts < 3) {
          attempts++
          setTimeout(fetchOrder, 1500)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" />
            <p className="text-jewel-muted text-sm">Confirming your order…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 pb-28 md:pb-12">
        {/* ── Success hero ─────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Animated checkmark */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
              <div className="relative w-24 h-24 rounded-full bg-green-50 border-4 border-green-400 flex items-center justify-center">
                <CheckCircle2 size={44} className="text-green-500" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-jewel-muted text-sm max-w-sm mx-auto">
            Thank you for shopping with Queens Jewellery. Your order is confirmed and will be processed shortly.
          </p>

          {orderId && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blush/60 px-4 py-2 rounded-full">
              <span className="text-jewel-muted text-xs">Order ID</span>
              <span className="text-rose-gold font-semibold text-sm font-mono">
                #{orderId.slice(-8).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* ── Order details card ───────────────────────────────────────── */}
        {order ? (
          <div className="bg-white rounded-2xl shadow-sm border border-blush/50 overflow-hidden">
            {/* Items */}
            <div className="p-5 border-b border-blush">
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} className="text-rose-gold" />
                <h2 className="font-serif text-lg text-jewel-dark">Items Ordered</h2>
              </div>
              <div className="space-y-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-blush/30 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={18} className="text-rose-gold/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-jewel-dark text-sm font-medium line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-jewel-muted text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-jewel-dark text-sm font-semibold flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-3 border-t border-blush space-y-1 text-sm">
                <div className="flex justify-between text-jewel-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal ?? order.total)}</span>
                </div>
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
                <div className="flex justify-between text-jewel-muted">
                  <span>Shipping</span>
                  {!order.shippingFee
                    ? <span className="text-green-600 font-medium">Free</span>
                    : <span>{formatPrice(order.shippingFee)}</span>
                  }
                </div>
                <div className="flex justify-between font-semibold text-jewel-dark text-base pt-1 border-t border-blush">
                  <span>Total Paid</span>
                  <span className="text-rose-gold">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            {order.address && (
              <div className="p-5 border-b border-blush">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-rose-gold" />
                  <h2 className="font-serif text-lg text-jewel-dark">Delivery Address</h2>
                </div>
                <div className="text-sm text-jewel-muted leading-relaxed">
                  <p className="font-medium text-jewel-dark">{order.address.fullName}</p>
                  <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
                  <p>{order.address.city}, {order.address.state} – {order.address.pincode}</p>
                  <p className="mt-1">{order.address.phone}</p>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-rose-gold" />
                <h2 className="font-serif text-lg text-jewel-dark">Payment</h2>
              </div>
              <div className="text-sm text-jewel-muted space-y-1">
                <p>
                  Method:{' '}
                  <span className="text-jewel-dark font-medium capitalize">
                    {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'WhatsApp / COD'}
                  </span>
                </p>
                {order.paymentId && (
                  <p>
                    Payment ID:{' '}
                    <span className="text-jewel-dark font-mono text-xs">{order.paymentId}</span>
                  </p>
                )}
                <p>
                  Order Date:{' '}
                  <span className="text-jewel-dark font-medium">{formatDate(order.createdAt)}</span>
                </p>
              </div>

              {/* Estimated delivery */}
              <div className="mt-4 flex items-start gap-2 bg-blush/40 rounded-xl p-3">
                <Clock size={15} className="text-rose-gold mt-0.5 flex-shrink-0" />
                <p className="text-xs text-jewel-muted leading-relaxed">
                  Estimated delivery: <span className="font-medium text-jewel-dark">7–8 business days</span>.
                  You'll receive updates via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Order not found fallback */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blush/50 text-center text-jewel-muted text-sm">
            Order details could not be loaded. Check your order history below.
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-rose-gold text-ivory px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Track Your Order
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 border border-rose-gold text-rose-gold px-6 py-3 rounded-full text-sm font-medium hover:bg-blush transition-colors"
          >
            <Home size={16} />
            Continue Shopping
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
