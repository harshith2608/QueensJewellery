import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  MessageCircle,
  Star,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Share2,
  Check,
  Bell,
} from 'lucide-react'

import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import MediaViewer from '../../components/store/MediaViewer.jsx'
import ReviewSection from '../../components/store/ReviewSection.jsx'
import ProductCard from '../../components/store/ProductCard.jsx'
import NotifyMeModal from '../../components/store/NotifyMeModal.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Button from '../../components/ui/Button.jsx'

import { useCart } from '../../contexts/CartContext.jsx'
import { useCategories } from '../../hooks/useCategories.js'
import { getProductById, getProducts } from '../../firebase/firestore.js'
import { formatPrice } from '../../utils/formatters.js'
import { openWhatsApp, buildWhatsAppOrderMessage } from '../../utils/whatsapp.js'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'

// ─── Star rating display ──────────────────────────────────────────────────────
function StarRow({ rating, count }) {
  return (
    <button
      onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      aria-label="Go to reviews"
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-jewel-muted'}`}
          />
        ))}
      </div>
      <span className="text-sm text-jewel-muted">
        {rating > 0 ? rating.toFixed(1) : 'No'} {count > 0 ? `(${count} reviews)` : 'reviews yet'}
      </span>
    </button>
  )
}

// ─── Stock status badge ───────────────────────────────────────────────────────
function StockStatus({ stock }) {
  if (stock === 0) {
    return (
      <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
        <XCircle className="w-4 h-4" />
        Out of Stock
      </div>
    )
  }
  if (stock <= 5) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
        <AlertTriangle className="w-4 h-4" />
        Only {stock} left
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" />
      In Stock
    </div>
  )
}

// ─── Collapsible description ──────────────────────────────────────────────────
function Description({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text && text.length > 200

  if (!text) return null

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-lg text-jewel-dark">Description</h3>
      <div
        className={`text-jewel-muted text-sm leading-relaxed overflow-hidden transition-all duration-300 ${
          isLong && !expanded ? 'max-h-24' : 'max-h-[1000px]'
        }`}
        style={{ maskImage: isLong && !expanded ? 'linear-gradient(to bottom, black 60%, transparent)' : undefined }}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-rose-gold text-sm hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" />Show less</>
          ) : (
            <><ChevronDown className="w-4 h-4" />Read more</>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Related Products ─────────────────────────────────────────────────────────
function RelatedProducts({ categoryId, excludeId }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categoryId) { setLoading(false); return }
    let cancelled = false
    getProducts({ categoryId, limit: 5 })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.filter((p) => p.id !== excludeId).slice(0, 4))
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [categoryId, excludeId])

  if (loading || !products.length) return null

  return (
    <section className="mt-16">
      <h2 className="font-serif text-2xl sm:text-3xl text-jewel-dark mb-6">
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

// ─── Product Page ─────────────────────────────────────────────────────────────
export default function Product() {
  const { id } = useParams()
  const { addToCart, isInCart } = useCart()
  const { categories } = useCategories()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [sizeError, setSizeError] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setQuantity(1)
    getProductById(id)
      .then((data) => {
        if (!cancelled) {
          if (!data) setNotFound(true)
          else setProduct(data)
        }
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // Derived values
  const category = product
    ? categories.find((c) => c.id === product.categoryId)
    : null
  const onSale = product?.salePrice != null && product.salePrice < product.price
  const effectivePrice = onSale ? product.salePrice : product?.price
  const isOutOfStock = product?.stock === 0
  const maxQty = product?.stock || 99
  const inCart = product ? isInCart(product.id) : false

  const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    if (hasSizes && !selectedSize) {
      setSizeError(true)
      return
    }
    setSizeError(false)
    for (let i = 0; i < quantity; i++) addToCart({ ...product, selectedSize: selectedSize || null })
    // Meta Pixel — AddToCart event
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: effectivePrice,
        currency: 'INR',
      })
    }
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = product?.name || 'Queens Jewellery'
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check out ${title} on Queens Jewellery!`, url })
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    if (!product) return
    const item = {
      name: product.name,
      quantity,
      price: effectivePrice,
    }
    const message = buildWhatsAppOrderMessage([item], effectivePrice * quantity)
    openWhatsApp(WHATSAPP_NUMBER, message)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    )
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-ivory">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <h2 className="font-serif text-3xl text-jewel-dark">Product Not Found</h2>
          <p className="text-jewel-muted text-sm">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link to="/shop" className="text-rose-gold hover:underline text-sm font-medium">
            Browse All Products
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-jewel-muted mb-6">
            <Link to="/" className="hover:text-rose-gold transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {category ? (
              <>
                <Link
                  to={`/category/${category.slug}`}
                  className="hover:text-rose-gold transition-colors"
                >
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            ) : null}
            <span className="text-jewel-dark font-medium line-clamp-1">{product.name}</span>
          </nav>

          {/* Main product layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
            {/* Left: Media Gallery */}
            <div>
              <MediaViewer media={product.media || []} />
            </div>

            {/* Right: Product Info */}
            <div className="space-y-5">
              {/* Name + Share */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-serif text-3xl sm:text-4xl text-jewel-dark leading-tight">
                  {product.name}
                </h1>
                <button
                  onClick={handleShare}
                  title={copied ? 'Link copied!' : 'Share product'}
                  className="flex-shrink-0 mt-1 p-2 rounded-full border border-blush text-jewel-muted hover:text-rose-gold hover:border-rose-gold transition-colors"
                  aria-label="Share product"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Reviews */}
              <StarRow
                rating={product.averageRating || 0}
                count={product.reviewCount || 0}
              />

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl text-rose-gold font-semibold">
                  {formatPrice(effectivePrice)}
                </span>
                {onSale && (
                  <span className="text-jewel-muted text-lg line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                {onSale && (
                  <span className="text-xs bg-rose-gold text-white px-2 py-0.5 rounded-full font-medium">
                    Save {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                  </span>
                )}
              </div>

              {/* Stock status */}
              <StockStatus stock={product.stock ?? 99} />

              {/* Description */}
              <Description text={product.description} />

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blush text-jewel-muted px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Size selector — shown only for products with sizes */}
              {hasSizes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-jewel-dark">Size:</span>
                    {selectedSize && (
                      <span className="text-sm text-rose-gold font-semibold">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => { setSelectedSize(size); setSizeError(false) }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                          selectedSize === size
                            ? 'border-rose-gold bg-rose-gold text-ivory'
                            : 'border-blush text-jewel-dark hover:border-rose-gold'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {sizeError && (
                    <p className="text-red-500 text-xs mt-1.5">Please select a size before adding to cart</p>
                  )}
                </div>
              )}

              {/* Quantity selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-jewel-muted font-medium">Qty:</span>
                  <div className="flex items-center border border-blush rounded-full overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-jewel-muted hover:bg-blush hover:text-jewel-dark transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-jewel-dark font-semibold text-sm min-w-[3ch] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="px-3 py-2 text-jewel-muted hover:bg-blush hover:text-jewel-dark transition-colors disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full"
                  size="lg"
                  variant={addedFeedback ? 'secondary' : 'primary'}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isOutOfStock
                    ? 'Out of Stock'
                    : addedFeedback
                    ? 'Added to Cart!'
                    : inCart
                    ? 'Add More to Cart'
                    : 'Add to Cart'}
                </Button>

                {/* Notify Me — shown only when out of stock */}
                {isOutOfStock && (
                  <button
                    onClick={() => setNotifyOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-rose-gold text-rose-gold rounded-full text-sm font-medium hover:bg-blush transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Me When Available
                  </button>
                )}

                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 py-3.5 rounded-2xl font-medium text-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </button>

                {product.instagramUrl && (
                  <a
                    href={product.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-[#E1306C] text-[#E1306C] hover:bg-[#E1306C]/10 py-3.5 rounded-2xl font-medium text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    Watch Video on Instagram
                  </a>
                )}
              </div>

              {/* Shipping note */}
              <p className="text-xs text-jewel-muted pt-2 border-t border-blush">
                Free shipping on orders above ₹3,500 · Returns accepted only for damaged items (unboxing video required within 48 hrs)
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16 pt-12 border-t border-blush">
            <ReviewSection
              productId={id}
              averageRating={product.averageRating || 0}
              reviewCount={product.reviewCount || 0}
            />
          </div>

          {/* Related Products */}
          <RelatedProducts categoryId={product.categoryId} excludeId={id} />
        </div>
      </main>

      {/* Mobile sticky CTA bar */}
      <div className="md:hidden fixed left-0 right-0 z-20 bg-ivory border-t border-blush px-4 py-3 flex gap-3" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        {isOutOfStock ? (
          <button
            onClick={() => setNotifyOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-rose-gold text-rose-gold rounded-full text-sm font-medium"
          >
            <Bell className="w-4 h-4" />
            Notify Me
          </button>
        ) : (
          <Button
            onClick={handleAddToCart}
            className="flex-1"
            variant={addedFeedback ? 'secondary' : 'primary'}
          >
            <ShoppingBag className="w-4 h-4" />
            {addedFeedback ? 'Added!' : 'Add to Cart'}
          </Button>
        )}
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-1.5 px-4 border border-[#25D366] text-[#25D366] rounded-xl text-sm font-medium hover:bg-[#25D366]/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </div>

      <Footer />

      {notifyOpen && product && (
        <NotifyMeModal product={product} onClose={() => setNotifyOpen(false)} />
      )}
    </div>
  )
}
