import { useState, useEffect, useRef } from 'react'
import logo from '../../assets/logo.png'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShoppingBag, Home, Store, Grid3X3, PackageSearch, UserCircle2, LogOut } from 'lucide-react'
import { useCart } from '../../contexts/CartContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import CartDrawer from './CartDrawer.jsx'
import AnnouncementBar from './AnnouncementBar.jsx'
import OTPModal from './OTPModal.jsx'

const BASE_navLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Shop', to: '/shop', icon: Store },
  { label: 'Categories', to: '/categories', icon: Grid3X3 },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const accountRef = useRef(null)
  const { cartCount } = useCart()
  const { isAuthenticated, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = isAuthenticated
    ? [...BASE_navLinks, { label: 'Orders', to: '/orders', icon: PackageSearch }]
    : BASE_navLinks

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      setMobileMenuOpen(false)
    }
  }, [location.pathname])

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <>
      <div className="sticky top-0 z-30">
      <AnnouncementBar />
      <nav
        className={`bg-ivory transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: hamburger (mobile) + logo */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg text-jewel-muted hover:text-jewel-dark hover:bg-blush transition-colors"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              <Link
                to="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={logo} alt="" className="h-9 w-auto" />
                <span className="font-serif text-2xl text-rose-gold tracking-wide">Queens Jewellery</span>
              </Link>
            </div>

            {/* Center: desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium tracking-wide transition-colors pb-0.5 border-b-2 ${
                    isActive(to)
                      ? 'text-rose-gold border-rose-gold'
                      : 'text-jewel-dark border-transparent hover:text-rose-gold hover:border-rose-gold'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right: search + account + cart */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/search')}
                className="p-2 rounded-full text-jewel-muted hover:text-jewel-dark hover:bg-blush transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Account / Login */}
              {isAuthenticated ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((v) => !v)}
                    className="p-2 rounded-full text-rose-gold hover:bg-blush transition-colors"
                    aria-label="Account"
                  >
                    <UserCircle2 size={20} />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-lg border border-blush overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-blush">
                        <p className="text-xs text-jewel-muted">Signed in as</p>
                        <p className="text-sm font-medium text-jewel-dark truncate">{user?.phoneNumber}</p>
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-jewel-dark hover:bg-blush transition-colors"
                      >
                        <PackageSearch size={15} />
                        My Orders
                      </Link>
                      <button
                        onClick={() => { signOut(); setAccountOpen(false) }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-gold text-rose-gold text-xs font-medium hover:bg-blush transition-colors"
                >
                  <UserCircle2 size={15} />
                  Login
                </button>
              )}

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-full text-jewel-muted hover:text-jewel-dark hover:bg-blush transition-colors"
                aria-label={`Open cart, ${cartCount} items`}
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-gold text-ivory text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-64 border-t border-blush' : 'max-h-0'
          }`}
        >
          <div className="px-4 py-3 space-y-1 bg-ivory">
            {navLinks.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-blush text-rose-gold'
                    : 'text-jewel-dark hover:bg-blush hover:text-rose-gold'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile bottom category bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-ivory border-t border-blush shadow-[0_-2px_8px_rgba(44,26,29,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-around px-2 py-1.5">
            {navLinks.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                  isActive(to) ? 'text-rose-gold' : 'text-jewel-muted'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                to="/orders"
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                  location.pathname === '/orders' ? 'text-rose-gold' : 'text-jewel-muted'
                }`}
              >
                <UserCircle2 size={20} />
                <span className="text-[10px] font-medium">Account</span>
              </Link>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors text-jewel-muted"
              >
                <UserCircle2 size={20} />
                <span className="text-[10px] font-medium">Login</span>
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors relative ${
                cartOpen ? 'text-rose-gold' : 'text-jewel-muted'
              }`}
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-rose-gold text-ivory text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </button>
          </div>
        </div>
      </nav>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <OTPModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </>
  )
}
