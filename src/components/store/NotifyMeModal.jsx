import { useState } from 'react'
import { X, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { addStockNotification } from '../../firebase/firestore.js'
import toast from 'react-hot-toast'

export default function NotifyMeModal({ product, onClose }) {
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleaned = phone.replace(/\s/g, '')
    if (!/^\d{10}$/.test(cleaned)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await addStockNotification({
        productId: product.id,
        productName: product.name,
        phone: cleaned,
      })
      if (result.duplicate) {
        toast('You\'re already on the list for this product!')
        onClose()
        return
      }
      setSubmitted(true)
    } catch (err) {
      console.error('NotifyMe error:', err?.code, err?.message)
      if (err?.code === 'permission-denied') {
        toast.error('Permission denied — check Firestore rules for stock_notifications.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blush">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-rose-gold" />
            <h2 className="text-sm font-semibold text-jewel-dark">Notify Me</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            /* Success state */
            <div className="text-center py-4 space-y-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mx-auto">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <div>
                <p className="font-serif text-lg text-jewel-dark">You're on the list!</p>
                <p className="text-jewel-muted text-sm mt-1">
                  We'll let you know on <span className="font-medium text-jewel-dark">{phone}</span> as soon as <span className="font-medium text-jewel-dark">{product.name}</span> is back in stock.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-rose-gold text-ivory rounded-full text-sm font-medium hover:opacity-90 transition-opacity mt-2"
              >
                Got it
              </button>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-jewel-dark text-sm font-medium mb-0.5">{product.name}</p>
                <p className="text-jewel-muted text-xs">
                  This product is currently out of stock. Enter your mobile number and we'll notify you the moment it's available again.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-rose-gold focus-within:ring-2 focus-within:ring-rose-gold/20 transition-all">
                  <span className="px-3 py-2.5 text-sm text-jewel-muted bg-gray-50 border-r border-gray-200">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError('') }}
                    placeholder="10-digit number"
                    maxLength={10}
                    className="flex-1 px-3 py-2.5 text-base text-jewel-dark focus:outline-none bg-white"
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-gold text-ivory rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Saving…' : 'Notify Me When Available'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
