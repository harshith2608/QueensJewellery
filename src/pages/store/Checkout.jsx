import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  MapPin, Plus, CreditCard, MessageCircle, ChevronDown, ChevronUp,
  ShoppingBag, ArrowLeft, Zap, Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useCart } from '../../contexts/CartContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTestMode } from '../../contexts/TestModeContext.jsx'
import { createOrder, incrementCouponUsage, updateUser, decrementProductStock } from '../../firebase/firestore.js'
import { createRazorpayOrderFn, verifyRazorpayPaymentFn } from '../../firebase/functions.js'
import { formatPrice } from '../../utils/formatters.js'
import { initiateRazorpayPayment } from '../../utils/razorpay.js'
import { buildWhatsAppOrderMessage, openWhatsApp } from '../../utils/whatsapp.js'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import OTPModal from '../../components/store/OTPModal.jsx'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir',
  'Ladakh','Puducherry','Chandigarh','Dadra & Nagar Haveli','Lakshadweep',
]

function validateAddress(addr) {
  if (!addr.fullName.trim()) return 'Full name is required.'
  if (!/^\d{10}$/.test(addr.phone.replace(/\s/g, ''))) return 'Enter a valid 10-digit phone number.'
  if (!addr.line1.trim()) return 'Address line 1 is required.'
  if (!addr.city.trim()) return 'City is required.'
  if (!addr.state.trim()) return 'State is required.'
  if (!/^\d{6}$/.test(addr.pincode.trim())) return 'Enter a valid 6-digit pincode.'
  return null
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cartItems, cartTotal, clearCart } = useCart()
  const { user, userData, isAuthenticated, loading: authLoading } = useAuth()
  const { isTestMode } = useTestMode()

  // Coupon passed from Cart page via location.state
  const locationState = location.state || {}
  const appliedCoupon = locationState.appliedCoupon ?? null
  const discountAmount = locationState.discountAmount ?? 0
  const globalOffer = locationState.globalOffer ?? null
  const globalOfferDiscount = locationState.globalOfferDiscount ?? 0
  const freeGift = locationState.freeGift ?? null
  // Re-evaluate gift eligibility against live cart total (in case user tweaks quantities)
  const freeGiftActive = freeGift && (!freeGift.minOrder || cartTotal >= freeGift.minOrder)

  // Recalculate shipping from live cart total — don't trust location.state alone
  // This handles cases where checkout is reached without going through cart (refresh, direct URL)
  const FREE_SHIPPING_THRESHOLD = 3500
  const SHIPPING_FEE = 100
  const discountedTotal = Math.max(0, cartTotal - discountAmount - globalOfferDiscount)
  const shippingFee = discountedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = discountedTotal + shippingFee

  // Address state
  const savedAddresses = userData?.addresses ?? []
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(
    savedAddresses.length > 0 ? 0 : -1
  )
  const [showNewForm, setShowNewForm] = useState(savedAddresses.length === 0)
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS)
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [placing, setPlacing] = useState(false)

  // Order summary expand on mobile
  const [summaryOpen, setSummaryOpen] = useState(true)

  // Guard: redirect if cart is empty, but not while placing (clearCart fires during payment)
  useEffect(() => {
    if (cartItems.length === 0 && !placing) navigate('/cart', { replace: true })
  }, [cartItems, placing, navigate])

  // ─── Address helpers ────────────────────────────────────────────────────────

  const getActiveAddress = () => {
    if (showNewForm || selectedAddressIdx === -1) return newAddress
    return savedAddresses[selectedAddressIdx] || newAddress
  }

  const handleNewAddressChange = (field, value) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }))
    setAddressError('')
  }

  // ─── Place order ────────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    const address = getActiveAddress()
    const addrErr = validateAddress(address)
    if (addrErr) {
      setAddressError(addrErr)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Re-validate coupon minimum order against live cart total
    if (appliedCoupon?.minOrder && cartTotal < appliedCoupon.minOrder) {
      toast.error(`Coupon invalid — minimum order of ${formatPrice(appliedCoupon.minOrder)} required.`)
      return
    }

    // Re-validate global offer minimum order
    if (globalOffer?.minOrder && cartTotal < globalOffer.minOrder) {
      toast.error(`Offer invalid — minimum order of ${formatPrice(globalOffer.minOrder)} required.`)
      return
    }

    // Meta Pixel — InitiateCheckout event
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        value: finalTotal,
        currency: 'INR',
        num_items: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      })
    }

    setPlacing(true)

    // Optionally save address to user profile
    if (showNewForm && user) {
      try {
        await updateUser(user.uid, {
          ...(saveAddress ? { addresses: [...savedAddresses, address] } : {}),
          ...(address.fullName?.trim() ? { name: address.fullName.trim() } : {}),
        })
      } catch (err) {
        console.error('Failed to save address:', err)
      }
    }

    const orderBase = {
      userId: user.uid,
      userPhone: user.phoneNumber,
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.salePrice ?? item.price,
        originalPrice: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
      })),
      address,
      subtotal: cartTotal,
      discount: discountAmount + globalOfferDiscount,
      shippingFee,
      total: finalTotal,
      coupon: appliedCoupon
        ? { code: appliedCoupon.code, id: appliedCoupon.id, discount: discountAmount }
        : null,
      globalOffer: globalOffer
        ? { type: globalOffer.type, value: globalOffer.value, discount: globalOfferDiscount }
        : null,
      freeGift: freeGiftActive
        ? { name: freeGift.name, value: freeGift.value || 0 }
        : null,
    }

    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(orderBase)
      } else if (paymentMethod === 'cod') {
        await handleCODOrder(orderBase)
      } else {
        await handleWhatsAppOrder(orderBase)
      }
    } catch (err) {
      console.error('Order error:', err)
      toast.error(err.message || 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }

  const handleRazorpayPayment = async (orderBase) => {
    // Step 1 — Create order server-side (locks amount, prevents tampering)
    let serverOrderId = ''
    try {
      const result = await createRazorpayOrderFn({
        amount: finalTotal,          // rupees — function converts to paise
        receipt: `qj_${Date.now()}`,
      })
      serverOrderId = result.data.orderId
    } catch (err) {
      console.error('Server order creation failed:', err)
      toast.error('Could not initiate payment. Please try again.')
      setPlacing(false)
      throw err
    }

    // Step 2 — Open Razorpay checkout with server order ID
    return new Promise((resolve, reject) => {
      initiateRazorpayPayment({
        amount: finalTotal * 100,    // paise (for display in Razorpay modal)
        orderId: serverOrderId,
        name: getActiveAddress().fullName,
        email: userData?.email || '',
        phone: user?.phoneNumber || getActiveAddress().phone,
        isTestMode,
        onSuccess: async (response) => {
          try {
            // Step 3 — Verify signature server-side
            await verifyRazorpayPaymentFn({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            // Step 4 — Save verified order to Firestore
            const now = new Date().toISOString()
            const orderRef = await createOrder({
              ...orderBase,
              paymentMethod: 'razorpay',
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              status: 'confirmed',
              statusHistory: [
                { status: 'confirmed', note: 'Payment verified & received via Razorpay', timestamp: now },
              ],
            }, isTestMode)

            if (appliedCoupon?.id) {
              await incrementCouponUsage(appliedCoupon.id).catch(console.error)
            }

            orderBase.items.forEach(({ id, quantity }) =>
              decrementProductStock(id, quantity).catch(console.error)
            )

            // Meta Pixel — Purchase event (Razorpay)
            if (typeof window.fbq === 'function') {
              window.fbq('track', 'Purchase', {
                value: finalTotal,
                currency: 'INR',
                content_type: 'product',
                content_ids: orderBase.items.map((i) => i.id),
                contents: orderBase.items.map((i) => ({ id: i.id, quantity: i.quantity || 1 })),
              })
            }
            clearCart()
            navigate(`/order-confirmation?orderId=${orderRef.id}`, { replace: true })
            resolve()
          } catch (err) {
            console.error('Post-payment error:', err)
            toast.error('Payment received but order saving failed. Please contact support.')
            reject(err)
          }
        },
        onFailure: (err) => {
          setPlacing(false)
          if (err.message !== 'Payment cancelled by user') {
            toast.error(err.message || 'Payment failed. Please try again.')
          }
          reject(err)
        },
      })
    })
  }

  const handleCODOrder = async (orderBase) => {
    const now = new Date().toISOString()
    const orderRef = await createOrder({
      ...orderBase,
      paymentMethod: 'cod',
      paymentId: null,
      status: 'pending',
      statusHistory: [
        { status: 'pending', note: 'Order placed — Cash on Delivery', timestamp: now },
      ],
    }, isTestMode)

    if (appliedCoupon?.id) {
      await incrementCouponUsage(appliedCoupon.id).catch(console.error)
    }

    orderBase.items.forEach(({ id, quantity }) =>
      decrementProductStock(id, quantity).catch(console.error)
    )

    // Meta Pixel — Purchase event (COD)
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Purchase', {
        value: finalTotal,
        currency: 'INR',
        content_type: 'product',
        content_ids: orderBase.items.map((i) => i.id),
        contents: orderBase.items.map((i) => ({ id: i.id, quantity: i.quantity || 1 })),
      })
    }
    clearCart()
    navigate(`/order-confirmation?orderId=${orderRef.id}`, { replace: true })
    setPlacing(false)
  }

  const handleWhatsAppOrder = async (orderBase) => {
    const now = new Date().toISOString()
    const orderRef = await createOrder({
      ...orderBase,
      paymentMethod: 'whatsapp',
      paymentId: null,
      status: 'pending',
      statusHistory: [
        { status: 'pending', note: 'Order placed via WhatsApp', timestamp: now },
      ],
    }, isTestMode)

    if (appliedCoupon?.id) {
      await incrementCouponUsage(appliedCoupon.id).catch(console.error)
    }

    // Decrement stock for each ordered item (fire-and-forget)
    orderBase.items.forEach(({ id, quantity }) =>
      decrementProductStock(id, quantity).catch(console.error)
    )

    const msg = buildWhatsAppOrderMessage(
      cartItems,
      finalTotal,
      appliedCoupon ? { code: appliedCoupon.code, discount: discountAmount } : null
    )
    openWhatsApp(WHATSAPP_NUMBER, msg)
    // Meta Pixel — Purchase event (WhatsApp)
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Purchase', {
        value: finalTotal,
        currency: 'INR',
        content_type: 'product',
        content_ids: orderBase.items.map((i) => i.id),
        contents: orderBase.items.map((i) => ({ id: i.id, quantity: i.quantity || 1 })),
      })
    }
    clearCart()
    navigate(`/order-confirmation?orderId=${orderRef.id}`, { replace: true })
    setPlacing(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeAddress = getActiveAddress()

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-jewel-muted hover:text-rose-gold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to bag
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Section 1: Delivery Address ─── */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-blush/50">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-rose-gold text-ivory flex items-center justify-center text-xs font-bold">1</div>
                <h2 className="font-serif text-xl text-jewel-dark">Delivery Address</h2>
              </div>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 mb-5">
                  {savedAddresses.map((addr, idx) => (
                    <label
                      key={idx}
                      className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        !showNewForm && selectedAddressIdx === idx
                          ? 'border-rose-gold bg-blush/20'
                          : 'border-blush hover:border-rose-gold/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={!showNewForm && selectedAddressIdx === idx}
                        onChange={() => { setSelectedAddressIdx(idx); setShowNewForm(false); setAddressError('') }}
                        className="mt-1 accent-rose-gold flex-shrink-0"
                      />
                      <div className="text-sm text-jewel-dark leading-relaxed">
                        <p className="font-medium">{addr.fullName}</p>
                        <p className="text-jewel-muted">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <p className="text-jewel-muted">{addr.phone}</p>
                      </div>
                    </label>
                  ))}

                  {/* Add new toggle */}
                  <button
                    type="button"
                    onClick={() => { setShowNewForm(!showNewForm); setAddressError('') }}
                    className={`flex items-center gap-2 w-full p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      showNewForm
                        ? 'border-rose-gold text-rose-gold bg-blush/20'
                        : 'border-dashed border-blush text-jewel-muted hover:border-rose-gold hover:text-rose-gold'
                    }`}
                  >
                    <Plus size={16} />
                    Add a new address
                  </button>
                </div>
              )}

              {/* New address form */}
              {showNewForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      value={newAddress.fullName}
                      onChange={(v) => handleNewAddressChange('fullName', v)}
                      placeholder="Jane Doe"
                      required
                    />
                    <InputField
                      label="Phone Number"
                      value={newAddress.phone}
                      onChange={(v) => handleNewAddressChange('phone', v.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      type="tel"
                      required
                    />
                  </div>
                  <InputField
                    label="Address Line 1"
                    value={newAddress.line1}
                    onChange={(v) => handleNewAddressChange('line1', v)}
                    placeholder="House / Flat no., Street"
                    required
                  />
                  <InputField
                    label="Address Line 2"
                    value={newAddress.line2}
                    onChange={(v) => handleNewAddressChange('line2', v)}
                    placeholder="Area, Landmark (optional)"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="City"
                      value={newAddress.city}
                      onChange={(v) => handleNewAddressChange('city', v)}
                      placeholder="Mumbai"
                      required
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-jewel-muted uppercase tracking-wide">
                        State <span className="text-rose-gold">*</span>
                      </label>
                      <select
                        value={newAddress.state}
                        onChange={(e) => handleNewAddressChange('state', e.target.value)}
                        className="border border-blush rounded-xl px-3 py-2.5 text-sm text-jewel-dark bg-ivory focus:outline-none focus:border-rose-gold transition-colors"
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <InputField
                      label="Pincode"
                      value={newAddress.pincode}
                      onChange={(v) => handleNewAddressChange('pincode', v.replace(/\D/g, '').slice(0, 6))}
                      placeholder="400001"
                      type="tel"
                      required
                    />
                  </div>

                  {/* Save address checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="accent-rose-gold w-4 h-4"
                    />
                    <span className="text-sm text-jewel-muted">Save this address for future orders</span>
                  </label>
                </div>
              )}

              {addressError && (
                <p className="mt-3 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{addressError}</p>
              )}
            </section>

            {/* ── Section 2: Payment Method ─── */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-blush/50">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-full bg-rose-gold text-ivory flex items-center justify-center text-xs font-bold">2</div>
                <h2 className="font-serif text-xl text-jewel-dark">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {/* Razorpay */}
                <label
                  className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-rose-gold bg-blush/20'
                      : 'border-blush hover:border-rose-gold/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-0.5 accent-rose-gold flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className="text-rose-gold" />
                      <span className="font-medium text-jewel-dark text-sm">Pay Online</span>
                    </div>
                    <p className="text-jewel-muted text-xs">UPI, Credit/Debit Card, Net Banking via Razorpay</p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* UPI, Card, NetBanking icons (text badges) */}
                      {['UPI', 'Card', 'Net Banking'].map((label) => (
                        <span key={label} className="text-[10px] bg-blush text-rose-gold px-2 py-0.5 rounded-full font-medium">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>

                {/* COD */}
                <label
                  className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-blush hover:border-amber-400/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-0.5 accent-amber-500 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck size={16} className="text-amber-600" />
                      <span className="font-medium text-jewel-dark text-sm">Cash on Delivery</span>
                    </div>
                    <p className="text-jewel-muted text-xs">
                      Pay {formatPrice(finalTotal)} in cash when your order arrives.
                    </p>
                  </div>
                </label>

                {/* WhatsApp */}
                <label
                  className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'border-blush hover:border-green-400/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="mt-0.5 accent-green-500 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle size={16} className="text-green-600" />
                      <span className="font-medium text-jewel-dark text-sm">Order via WhatsApp</span>
                    </div>
                    <p className="text-jewel-muted text-xs">
                      We'll open WhatsApp with your order details. Pay after confirmation.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* ── Right column: order summary ──────────────────────────────── */}
          <div className="lg:sticky lg:top-24 space-y-3">
            {/* Refund & policy notice */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Refund Policy:</strong> We accept refunds only for damaged items.
                  An unboxing video is mandatory to process any claim.{' '}
                  <a href="/refund-policy" className="underline" target="_blank" rel="noopener noreferrer">
                    Read full policy
                  </a>
                </p>
              </div>
              <p className="text-center text-xs text-jewel-muted">
                By placing this order you agree to our{' '}
                <a href="/terms" className="underline text-rose-gold" target="_blank" rel="noopener noreferrer">Terms</a>
                {' & '}
                <a href="/privacy-policy" className="underline text-rose-gold" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blush/50 overflow-hidden">
              {/* Mobile toggle */}
              <button
                className="lg:hidden w-full flex items-center justify-between px-5 py-4 text-jewel-dark"
                onClick={() => setSummaryOpen((v) => !v)}
              >
                <span className="font-serif text-xl">Order Summary</span>
                {summaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <div className={`${summaryOpen ? 'block' : 'hidden'} lg:block p-5 space-y-4`}>
                {/* Items list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => {
                    const price = item.salePrice ?? item.price
                    return (
                      <div key={item.id} className="flex items-center gap-3">
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
                          <p className="text-jewel-dark text-xs font-medium line-clamp-2 leading-tight">{item.name}</p>
                          <p className="text-jewel-muted text-xs">
                            Qty: {item.quantity}
                            {item.selectedSize && ` · Size: ${item.selectedSize}`}
                          </p>
                        </div>
                        <span className="text-jewel-dark text-xs font-semibold flex-shrink-0">
                          {formatPrice(price * item.quantity)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-blush pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-jewel-muted">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  {globalOffer && globalOfferDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{globalOffer.type === 'percent' ? `${globalOffer.value}% off` : `Flat ₹${globalOffer.value} off`}</span>
                      <span>−{formatPrice(globalOfferDiscount)}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>−{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {freeGiftActive && (
                    <div className="flex justify-between text-green-600">
                      <span>🎁 {freeGift.name}{freeGift.value > 0 ? ` (worth ₹${freeGift.value})` : ''}</span>
                      <span className="font-medium">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between text-jewel-muted">
                    <span>Shipping</span>
                    {shippingFee === 0
                      ? <span className="text-green-600 font-medium">Free</span>
                      : <span>{formatPrice(shippingFee)}</span>
                    }
                  </div>
                  <div className="flex justify-between font-semibold text-jewel-dark text-base pt-1 border-t border-blush">
                    <span>Total</span>
                    <span className="text-rose-gold">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Delivery address preview */}
                {(activeAddress.fullName || activeAddress.line1) && (
                  <div className="bg-blush/30 rounded-xl p-3 text-xs text-jewel-muted leading-relaxed">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={12} className="text-rose-gold" />
                      <span className="font-medium text-jewel-dark">Delivering to</span>
                    </div>
                    <p>{activeAddress.fullName}</p>
                    <p>
                      {activeAddress.line1}
                      {activeAddress.line2 ? `, ${activeAddress.line2}` : ''}
                    </p>
                    {activeAddress.city && (
                      <p>{activeAddress.city}{activeAddress.state ? `, ${activeAddress.state}` : ''} – {activeAddress.pincode}</p>
                    )}
                  </div>
                )}

                {/* Place order button */}
                <Button
                  className="w-full rounded-full"
                  size="md"
                  loading={placing}
                  disabled={placing}
                  onClick={handlePlaceOrder}
                >
                  {paymentMethod === 'razorpay' ? (
                    <><Zap size={16} />Pay {formatPrice(finalTotal)}</>
                  ) : paymentMethod === 'cod' ? (
                    <><Truck size={16} />Place COD Order</>
                  ) : (
                    <><MessageCircle size={16} />Place Order on WhatsApp</>
                  )}
                </Button>

                <p className="text-center text-jewel-muted text-xs">
                  By placing the order, you agree to our terms of service.
                </p>
              </div>

              {/* Always-visible total on desktop */}
              <div className="hidden lg:flex items-center justify-between px-5 pb-4 pt-0">
              </div>
            </div>

            {/* Sticky mobile bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white border-t border-blush px-4 py-3 flex items-center gap-3 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-jewel-muted">Total</p>
                <p className="font-semibold text-jewel-dark text-base">{formatPrice(finalTotal)}</p>
              </div>
              <Button
                className="rounded-full flex-shrink-0"
                size="md"
                loading={placing}
                disabled={placing}
                onClick={handlePlaceOrder}
              >
                {paymentMethod === 'razorpay' ? 'Pay Now' : paymentMethod === 'cod' ? 'Place COD Order' : 'Order via WhatsApp'}
              </Button>
            </div>
          </div>

        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* OTP login gate — shown automatically if user is not authenticated */}
      <OTPModal
        isOpen={!isAuthenticated}
        onClose={() => navigate('/cart')}
        onSuccess={() => {}}
      />
    </div>
  )
}

// ─── Reusable field component ──────────────────────────────────────────────────

function InputField({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-jewel-muted uppercase tracking-wide">
        {label} {required && <span className="text-rose-gold">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-blush rounded-xl px-3 py-2.5 text-sm text-jewel-dark bg-ivory placeholder-jewel-muted focus:outline-none focus:border-rose-gold transition-colors"
      />
    </div>
  )
}
