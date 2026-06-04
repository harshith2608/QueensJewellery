import { Link, useNavigate } from 'react-router-dom'
import { Home, ShoppingBag, ArrowLeft } from 'lucide-react'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 pb-28 md:pb-20 text-center">
        {/* Decorative number */}
        <p className="font-serif text-[8rem] md:text-[12rem] leading-none text-rose-gold/15 select-none">
          404
        </p>

        <div className="-mt-8 md:-mt-12">
          <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-3">
            Page Not Found
          </h1>
          <p className="text-jewel-muted text-sm max-w-xs mx-auto mb-10">
            The page you're looking for doesn't exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-rose-gold text-rose-gold text-sm font-medium hover:bg-blush transition-colors"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-gold text-ivory text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Home size={16} />
              Home
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-jewel-dark text-ivory text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={16} />
              Shop
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
