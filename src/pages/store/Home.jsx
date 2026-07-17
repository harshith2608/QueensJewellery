import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import CategoryCard from '../../components/store/CategoryCard.jsx'
import ProductCard from '../../components/store/ProductCard.jsx'
import ProductGrid from '../../components/store/ProductGrid.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

import { useCategories } from '../../hooks/useCategories.js'
import { useProducts } from '../../hooks/useProducts.js'
import { getFeaturedProducts, getSettings } from '../../firebase/firestore.js'

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ banners }) {
  if (!banners || banners.length === 0) {
    // Default gradient banner
    return (
      <section className="relative h-[60vh] min-h-[360px] max-h-[640px] bg-gradient-to-br from-ivory via-blush to-rose-gold/30 flex items-center overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10">
          <p className="text-rose-gold text-sm font-medium tracking-widest uppercase mb-3">
            New Collection
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-jewel-dark leading-tight mb-4">
            Queens<br />Jewellery
          </h1>
          <p className="text-jewel-muted text-base sm:text-lg mb-8 max-w-md">
            Exquisite Imitation Jewellery — crafted for the queen in you.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-rose-gold text-white px-8 py-3.5 rounded-full font-medium tracking-wide hover:bg-jewel-dark transition-colors shadow-lg"
          >
            Shop Now
          </Link>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-rose-gold/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-8 bottom-0 w-48 h-48 rounded-full bg-blush/60 blur-2xl pointer-events-none" />
      </section>
    )
  }

  // Pure image carousel — no text overlay
  return (
    <section className="relative h-[60vh] min-h-[360px] max-h-[640px] overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        className="h-full w-full"
      >
        {banners.map((banner, idx) => (
          <SwiperSlide key={idx}>
            {banner.link ? (
              <Link to={banner.link} className="block w-full h-full">
                <img
                  src={banner.image}
                  alt={banner.alt || 'Queens Jewellery'}
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <img
                src={banner.image}
                alt={banner.alt || 'Queens Jewellery'}
                className="w-full h-full object-cover"
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

// ─── Section Heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="font-serif text-3xl sm:text-4xl text-jewel-dark">{title}</h2>
        {subtitle && <p className="text-jewel-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm text-rose-gold hover:underline font-medium flex-shrink-0 ml-4"
        >
          {linkLabel || 'View All →'}
        </Link>
      )}
    </div>
  )
}

// ─── Promotional Banner ───────────────────────────────────────────────────────
function PromoBanner() {
  const [promo, setPromo] = useState(null)

  useEffect(() => {
    getSettings()
      .then((s) => setPromo(s.promoBanner ?? null))
      .catch(() => {})
  }, [])

  // Use Firestore data if available, else fall back to defaults
  const label = promo?.label ?? 'Special Offer'
  const title = promo?.title ?? 'Free Shipping on Orders Above ₹999'
  const subtitle = promo?.subtitle ?? 'Shop your favourite jewellery with no delivery charges — across India!'
  const buttonText = promo?.buttonText ?? 'Shop Now'
  const buttonLink = promo?.buttonLink ?? '/shop'

  // Hide if admin explicitly turned it off
  if (promo && !promo.active) return null

  // Hide if title is blank (admin cleared it intentionally)
  if (promo && !title) return null

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-gold to-jewel-dark p-8 sm:p-12 text-center text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white translate-x-16 translate-y-16" />
          </div>
          <div className="relative z-10">
            {label && (
              <p className="text-blush/80 text-xs font-medium uppercase tracking-widest mb-2">
                {label}
              </p>
            )}
            <h2 className="font-serif text-3xl sm:text-4xl mb-3">{title}</h2>
            {subtitle && (
              <p className="text-white/80 text-sm mb-6">{subtitle}</p>
            )}
            <Link
              to={buttonLink}
              className="inline-block bg-white text-rose-gold px-8 py-3 rounded-full font-medium hover:bg-blush transition-colors"
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Featured Products (horizontal scroll on mobile) ─────────────────────────
function FeaturedProducts({ products, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!products.length) return null

  return (
    <>
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
          {products.map((product) => (
            <div key={product.id} className="snap-start flex-shrink-0 w-44">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  const { categories, loading: catLoading } = useCategories()
  const { products: newArrivals, loading: arrivalsLoading } = useProducts({ limitN: 8 })

  // Fetch settings (banners, announcement)
  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((data) => { if (!cancelled) setSettings(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setSettingsLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Fetch featured products
  useEffect(() => {
    let cancelled = false
    setFeaturedLoading(true)
    getFeaturedProducts(8)
      .then((data) => { if (!cancelled) setFeaturedProducts(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setFeaturedLoading(false) })
    return () => { cancelled = true }
  }, [])

  const heroBanners = (settings?.banners || []).map((b) => ({ ...b, image: b.url }))

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* 1. Hero Banner */}
        {settingsLoading ? (
          <div className="h-[60vh] min-h-[360px] max-h-[640px] bg-gradient-to-br from-ivory via-blush to-rose-gold/20 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <HeroBanner banners={heroBanners} />
        )}

        {/* 2. Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SectionHeading
            title="Shop by Category"
            subtitle="Explore our curated jewellery collections"
          />
          {catLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Placeholder tiles */}
              {['Earrings', 'Necklaces', 'Bangles', 'Rings'].map((name) => (
                <Link
                  key={name}
                  to="/shop"
                  className="aspect-square rounded-2xl bg-blush flex items-end p-4 hover:shadow-lg transition-shadow group"
                >
                  <div>
                    <h3 className="font-serif text-jewel-dark text-lg">{name}</h3>
                    <span className="text-xs text-rose-gold group-hover:underline">Shop →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 3. Featured Collection */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SectionHeading
            title="Featured Collection"
            subtitle="Our handpicked favourites"
            linkTo="/shop?featured=true"
            linkLabel="View All →"
          />
          <FeaturedProducts products={featuredProducts} loading={featuredLoading} />
        </section>

        {/* 4. Promotional Banner */}
        <PromoBanner />

        {/* 5. New Arrivals */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SectionHeading
            title="New Arrivals"
            subtitle="Fresh styles added to our collection"
            linkTo="/shop?sort=newest"
            linkLabel="See All →"
          />
          <ProductGrid
            products={newArrivals}
            loading={arrivalsLoading}
            emptyMessage="Check back soon for new arrivals!"
          />
        </section>
      </main>

      <Footer />
    </div>
  )
}
