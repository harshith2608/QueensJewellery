import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, Tag, MessageCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { useCart } from '../../contexts/CartContext.jsx'
import { getCouponByCode, getSettings } from '../../firebase/firestore.js'
import { formatPrice } from '../../utils/formatters.js'
import { buildWhatsAppOrderMessage, openWhatsApp } from '../../utils/whatsapp.js'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import Button from '../../components/ui/Button.jsx'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'
const FREE_SHIPPING_THRESHOLD = 3500
const SHIPPING_FEE = 100

export default function Cart() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const navigate = useNavigate()

  const [globalOffer, setGlobalOffer] = useState(null)
  const [freeGift, setFreeGift] = useState(null)
  const fetchedOffer = useRef(false)

  useEffect(() => {
    if (fetchedOffer.current) return
    fetchedOffer.current = true
    getSettings()
      .then((s) => {
        const offer = s.globalOffer
        if (offer?.active && offer?.value > 0) {
          // Skip expired offers — endDate is inclusive (valid through end of that day)
          let expired = false
          if (offer.endDate) {
            const end = new Date(offer.endDate)
            end.setHours(23, 59, 59, 999)
            expired = Date.now() > end.getTime()
          }
          if (!expired) setGlobalOffer(offer)
        }
        if (s.freeGift?.active && s.freeGift?.name) {
          setFreeGift(s.freeGift)
        }
      })
      .catch(() => {})
  }, [])

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // ─── Auto-invalidate coupon if cart drops below minOrder ──────────────────
  useEffect(() => {
    if (appliedCoupon?.minOrder && cartTotal < appliedCoupon.minOrder) {
      setAppliedCoupon(null)
      setCouponCode('')
      toast.error(
        `Coupon removed — minimum order of ${formatPrice(appliedCoupon.minOrder)} required.`
      )
    }
  }, [cartTotal])

  // ─── Global offer (auto-applied) ───────────────────────────────────────────

  const globalOfferActive = globalOffer && (!globalOffer.minOrder || cartTotal >= globalOffer.minOrder)
  const freeGiftActive = freeGift && (!freeGift.minOrder || cartTotal >= freeGift.minOrder)
  const globalOfferDiscount = globalOfferActive
    ? globalOffer.type === 'percent'
      ? Math.round((cartTotal * globalOffer.value) / 100)
      : Math.min(globalOffer.value, cartTotal)
    : 0

  // ─── Coupon logic ──────────────────────────────────────────────────────────

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round((cartTotal * appliedCoupon.value) / 100)
      : Math.min(appliedCoupon.value, cartTotal)
    : 0

  const discountedTotal = Math.max(0, cartTotal - discountAmount - globalOfferDiscount)
  const shippingFee = discountedTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = discountedTotal + shippingFee

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponError('')
    setCouponLoading(true)

    try {
      const coupon = await getCouponByCode(code)

      if (!coupon) {
        setCouponError('Coupon not found.')
        return
      }
      if (!coupon.active) {
        setCouponError('This coupon is no longer active.')
        return
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt?.toDate?.() ?? coupon.expiresAt) < new Date()) {
        setCouponError('This coupon has expired.')
        return
      }
      if (coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
        setCouponError('This coupon has reached its usage limit.')
        return
      }
      if (coupon.minOrder && cartTotal < coupon.minOrder) {
        setCouponError(`Minimum order of ${formatPrice(coupon.minOrder)} required.`)
        return
      }

      setAppliedCoupon(coupon)
      toast.success(`Coupon applied! ${formatPrice(
        coupon.type === 'percent'
          ? Math.round((cartTotal * coupon.value) / 100)
          : Math.min(coupon.value, cartTotal)
      )} off!`)
    } catch (err) {
      console.error('Coupon error:', err)
      setCouponError('Failed to apply coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleProceedToCheckout = () => {
    navigate('/checkout', { state: { appliedCoupon, discountAmount, globalOffer: globalOfferActive ? globalOffer : null, globalOfferDiscount, freeGift: freeGiftActive ? freeGift : null, shippingFee, finalTotal } })
  }

  const handleWhatsAppOrder = () => {
    const msg = buildWhatsAppOrderMessage(
      cartItems,
      finalTotal,
      appliedCoupon ? { code: appliedCoupon.code, discount: discountAmount } : null
    )
    openWhatsApp(WHATSAPP_NUMBER, msg)
  }

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24 md:pb-8 text-center">
          <div className="mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-blush">
            <ShoppingBag size={40} className="text-rose-gold" />
          </div>
          <h1 className="font-serif text-3xl text-jewel-dark mb-2">Your bag is empty</h1>
          <p className="text-jewel-muted text-sm mb-8 max-w-xs">
            Looks like you haven't added any pieces yet. Discover our collection and find something you love.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-rose-gold text-ivory px-7 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Shopping
            <ArrowRight size={16} />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  // ─── Main cart view ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-10">
        <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-8">Shopping Bag</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Cart items ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const effectivePrice =
                item.salePrice != null && item.salePrice < item.price
                  ? item.salePrice
                  : item.price

              return (
                <div
                  key={item.cartKey || item.id}
                  className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-blush/50"
                >
                  {/* Product image */}
                  <Link to={`/product/${item.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-blush/30">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={28} className="text-rose-gold/40" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.id}`}>
                      <h3 className="font-serif text-jewel-dark text-base sm:text-lg leading-tight hover:text-rose-gold transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    {item.selectedSize && (
                      <span className="text-xs text-jewel-muted">Size: <span className="font-medium text-jewel-dark">{item.selectedSize}</span></span>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-rose-gold font-semibold text-sm">
                        {formatPrice(effectivePrice)}
                      </span>
                      {item.salePrice != null && item.salePrice < item.price && (
                        <span className="text-jewel-muted text-xs line-through">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>

                    {/* Quantity + remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-blush rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.cartKey || item.id, item.quantity - 1)}
                          className="px-3 py-1.5 text-jewel-muted hover:text-jewel-dark hover:bg-blush transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-jewel-dark min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartKey || item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock ?? 99)}
                          className="px-3 py-1.5 text-jewel-muted hover:text-jewel-dark hover:bg-blush transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-jewel-dark font-semibold text-sm hidden sm:block">
                          {formatPrice(effectivePrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.cartKey || item.id)}
                          className="p-2 text-jewel-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Clear cart */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Remove all items from your bag?')) clearCart()
                }}
                className="text-xs text-jewel-muted hover:text-red-500 transition-colors underline underline-offset-2"
              >
                Clear bag
              </button>
            </div>
          </div>

          {/* ── Order summary ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blush/50 space-y-5">
              <h2 className="font-serif text-xl text-jewel-dark">Order Summary</h2>

              {/* Subtotal */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-jewel-muted">
                  <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>

                {/* Global offer discount */}
                {globalOfferActive && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag size={13} />
                      {globalOffer.type === 'percent' ? `${globalOffer.value}% off` : `Flat ₹${globalOffer.value} off`}
                    </span>
                    <span>−{formatPrice(globalOfferDiscount)}</span>
                  </div>
                )}

                {/* Coupon discount */}
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag size={13} />
                      {appliedCoupon.code}
                    </span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}

                {/* Free gift */}
                {freeGiftActive && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      🎁 {freeGift.name}{freeGift.value > 0 ? ` (worth ₹${freeGift.value})` : ''}
                    </span>
                    <span className="font-medium">FREE</span>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between text-jewel-muted">
                  <span>Shipping</span>
                  {shippingFee === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : <span>{formatPrice(shippingFee)}</span>
                  }
                </div>

                <div className="border-t border-blush pt-2 flex justify-between font-semibold text-jewel-dark text-base">
                  <span>Total</span>
                  <span className="text-rose-gold">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Coupon input */}
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-jewel-muted uppercase tracking-wide">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter code"
                      className="flex-1 border border-blush rounded-xl px-3 py-2 text-sm text-jewel-dark placeholder-jewel-muted focus:outline-none focus:border-rose-gold bg-ivory transition-colors"
                    />
                    <Button
                      size="sm"
                      onClick={handleApplyCoupon}
                      loading={couponLoading}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-xs">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <Tag size={14} />
                    <span className="font-medium">{appliedCoupon.code}</span>
                    <span className="text-green-600">−{formatPrice(discountAmount)}</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-green-600 hover:text-red-500 underline transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-3 pt-1">
                <Button
                  className="w-full rounded-full"
                  size="md"
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full text-sm font-medium transition-colors"
                >
                  <MessageCircle size={16} />
                  Order on WhatsApp
                </button>
              </div>

              {/* Trust note */}
              <p className="text-center text-jewel-muted text-xs">
                {shippingFee > 0
                  ? `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - discountedTotal)} more for free shipping`
                  : '🎉 You qualify for free shipping!'
                }
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
