import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { formatPrice } from '../../utils/formatters.js'
import { openWhatsApp, buildWhatsAppOrderMessage } from '../../utils/whatsapp.js'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const drawerRef = useRef(null)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleCheckout = () => {
    onClose()
    if (!isAuthenticated) {
      navigate('/checkout?requireAuth=true')
    } else {
      navigate('/checkout')
    }
  }

  const handleWhatsApp = () => {
    const message = buildWhatsAppOrderMessage(cartItems, cartTotal)
    openWhatsApp(WHATSAPP_NUMBER || '919999999999', message)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-jewel-dark/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed z-50 bg-ivory shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
          bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl
          md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-[420px] md:max-h-full md:rounded-none md:rounded-l-2xl
          ${isOpen
            ? 'translate-y-0 md:translate-x-0 md:translate-y-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blush">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-rose-gold" size={20} />
            <h2 className="font-serif text-xl text-jewel-dark">
              Your Cart
              {cartCount > 0 && (
                <span className="ml-2 text-sm font-sans text-jewel-muted">
                  ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blush transition-colors text-jewel-muted hover:text-jewel-dark"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <ShoppingBag size={56} className="text-blush mb-4" />
              <p className="font-serif text-2xl text-jewel-dark mb-2">Your cart is empty</p>
              <p className="text-jewel-muted text-sm mb-6">
                Discover our beautiful jewellery collection
              </p>
              <Link
                to="/shop"
                onClick={onClose}
                className="inline-block bg-rose-gold text-ivory px-6 py-2.5 rounded-full text-sm font-medium hover:bg-jewel-dark transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQty={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-blush px-5 py-4 space-y-3 bg-ivory">
            <div className="flex items-center justify-between">
              <span className="font-sans text-jewel-muted text-sm">Subtotal</span>
              <span className="font-serif text-xl text-jewel-dark font-semibold">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-jewel-muted">
              Shipping & taxes calculated at checkout
            </p>
            <button
              onClick={handleCheckout}
              className="w-full bg-rose-gold text-ivory py-3 rounded-full font-medium hover:bg-jewel-dark transition-colors text-sm tracking-wide"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 border border-rose-gold text-rose-gold py-3 rounded-full font-medium hover:bg-blush transition-colors text-sm"
            >
              <MessageCircle size={18} />
              Order on WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function CartItem({ item, onUpdateQty, onRemove }) {
  const effectivePrice =
    item.salePrice != null && item.salePrice < item.price ? item.salePrice : item.price

  return (
    <div className="flex gap-3">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-blush">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={24} className="text-jewel-muted" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-serif text-jewel-dark text-sm leading-snug line-clamp-2 mb-1">
          {item.name}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-rose-gold font-semibold text-sm">
            {formatPrice(effectivePrice)}
          </span>
          {item.salePrice != null && item.salePrice < item.price && (
            <span className="text-jewel-muted text-xs line-through">
              {formatPrice(item.price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity stepper */}
          <div className="flex items-center border border-blush rounded-full overflow-hidden">
            <button
              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
              className="px-2.5 py-1 text-jewel-muted hover:bg-blush transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 text-sm text-jewel-dark font-medium min-w-[2ch] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
              disabled={item.quantity >= (item.stock ?? 99)}
              className="px-2.5 py-1 text-jewel-muted hover:bg-blush transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            className="text-jewel-muted hover:text-rose-gold transition-colors p-1"
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
