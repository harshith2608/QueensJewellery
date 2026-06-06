import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, ShoppingBag } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext.jsx'
import { getOrderById } from '../../firebase/firestore.js'
import { formatPrice, formatDate } from '../../utils/formatters.js'
import OTPModal from '../../components/store/OTPModal.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

const STORE_NAME = 'Queens Jewellery'
const STORE_URL = 'https://queensjewellery.vercel.app'
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'

export default function Invoice() {
  const { orderId } = useParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const printRef = useRef()

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!orderId) { setError('Invalid invoice link.'); setLoading(false); return }

    getOrderById(orderId)
      .then((data) => {
        if (!data) { setError('Order not found.'); return }
        if (data.userId !== user.uid) { setError('You are not authorised to view this invoice.'); return }
        setOrder(data)
      })
      .catch(() => setError('Failed to load invoice. Please try again.'))
      .finally(() => setLoading(false))
  }, [orderId, isAuthenticated, user])

  const handlePrint = () => window.print()

  // ── Auth gate ──
  if (!authLoading && !isAuthenticated) {
    return (
      <OTPModal
        isOpen={true}
        onClose={() => window.history.back()}
        onSuccess={() => {}}
      />
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-500 text-sm">{error}</p>
        <Link to="/orders" className="text-rose-gold hover:underline text-sm">← Back to My Orders</Link>
      </div>
    )
  }

  if (!order) return null

  const shortId = order.id.slice(-8).toUpperCase()
  const items = order.items || []
  const address = order.address || {}
  const onSale = order.discount > 0

  return (
    <>
      {/* Print button — hidden during print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg hover:bg-rose-gold/90 transition-colors"
        >
          <Printer size={16} />
          Save / Print
        </button>
      </div>

      {/* Invoice */}
      <div ref={printRef} className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-6 py-10 print:px-8 print:py-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-100">
            <div>
              <h1 className="font-serif text-3xl text-rose-gold tracking-wide">{STORE_NAME}</h1>
              <p className="text-xs text-gray-400 mt-1">{STORE_URL}</p>
              <p className="text-xs text-gray-400">
                WhatsApp: +{WHATSAPP_NUMBER.replace(/^91/, '')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800 tracking-widest">INVOICE</p>
              <p className="text-sm text-gray-500 mt-1">#{shortId}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
            <p className="font-semibold text-gray-800">{address.fullName || address.name}</p>
            {address.line1 && <p className="text-sm text-gray-600">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>}
            {address.city && <p className="text-sm text-gray-600">{address.city}, {address.state} – {address.pincode}</p>}
            {address.phone && <p className="text-sm text-gray-600">📞 {address.phone}</p>}
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-400">Size: {item.selectedSize}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600">{item.quantity || 1}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-800">{formatPrice((item.price || 0) * (item.quantity || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {onSale && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-800 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-rose-gold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 mb-8">
            <span className="font-medium text-gray-700">Payment: </span>
            {order.paymentMethod === 'razorpay'
              ? `Online (Razorpay)${order.paymentId ? ` · ${order.paymentId}` : ''}`
              : order.paymentMethod === 'cod'
              ? 'Cash on Delivery'
              : 'WhatsApp'}
            <span className="ml-3 font-medium text-green-600 capitalize">● {order.status}</span>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-gray-100 pt-6 space-y-1">
            <p className="font-serif text-lg text-rose-gold">Thank you for shopping with us! 💕</p>
            <p className="text-xs text-gray-400">
              For any queries, reach us on WhatsApp or visit {STORE_URL}
            </p>
            <p className="text-xs text-gray-300 mt-2">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </>
  )
}
