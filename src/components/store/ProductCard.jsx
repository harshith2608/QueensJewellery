import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Play, ShoppingBag, Bell } from 'lucide-react'
import { useCart } from '../../contexts/CartContext.jsx'
import { formatPrice } from '../../utils/formatters.js'
import NotifyMeModal from './NotifyMeModal.jsx'

const PLACEHOLDER_URL = '/placeholder-jewellery.jpg'

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const { addToCart, isInCart } = useCart()

  if (!product) return null

  const { id, name, price, salePrice, media, stock } = product

  // Pick first media item
  const firstMedia = Array.isArray(media) && media.length > 0 ? media[0] : null
  const imageUrl =
    firstMedia?.type === 'image' || !firstMedia?.type
      ? firstMedia?.url || PLACEHOLDER_URL
      : PLACEHOLDER_URL
  const hasVideo = Array.isArray(media) && media.some((m) => m.type === 'video')

  const isOutOfStock = stock === 0
  const onSale = salePrice != null && salePrice < price
  const inCart = isInCart(id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) {
      setNotifyOpen(true)
    } else {
      addToCart(product)
    }
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted((v) => !v)
  }

  return (
    <Link
      to={`/product/${id}`}
      className="group relative bg-ivory rounded-2xl overflow-hidden block hover:shadow-xl transition-shadow duration-300"
      aria-label={name}
    >
      {/* Image container — square frame, image fits fully inside without cropping */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_URL }}
        />

        {/* Video indicator */}
        {hasVideo && (
          <div className="absolute bottom-2 left-2 bg-jewel-dark/60 text-ivory rounded-full p-1.5">
            <Play size={12} fill="currentColor" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isOutOfStock && (
            <span className="bg-jewel-dark text-ivory text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Out of Stock
            </span>
          )}
          {onSale && !isOutOfStock && (
            <span className="bg-rose-gold text-ivory text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist button — always visible on mobile, hover-reveal on desktop */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 p-2 rounded-full bg-ivory/80 backdrop-blur-sm text-jewel-muted hover:text-rose-gold transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <Heart
            size={16}
            className={wishlisted ? 'fill-rose-gold text-rose-gold' : ''}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        <h3 className="font-serif text-jewel-dark text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-rose-gold font-semibold text-sm">
            {formatPrice(onSale ? salePrice : price)}
          </span>
          {onSale && (
            <span className="text-jewel-muted text-xs line-through">
              {formatPrice(price)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock && false}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
            isOutOfStock
              ? 'border border-rose-gold text-rose-gold hover:bg-blush'
              : inCart
              ? 'bg-jewel-dark text-ivory hover:bg-rose-gold'
              : 'bg-rose-gold text-ivory hover:bg-jewel-dark'
          }`}
          aria-label={isOutOfStock ? 'Notify me when available' : inCart ? 'Added to cart' : 'Add to cart'}
        >
          {isOutOfStock ? <Bell size={14} /> : <ShoppingBag size={14} />}
          {isOutOfStock ? 'Notify Me' : inCart ? 'Added to Cart' : 'Add to Cart'}
        </button>
      </div>

      {notifyOpen && (
        <NotifyMeModal product={product} onClose={() => setNotifyOpen(false)} />
      )}
    </Link>
  )
}
