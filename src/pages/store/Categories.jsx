import { Link } from 'react-router-dom'
import { Grid3X3 } from 'lucide-react'
import Navbar from '../../components/store/Navbar.jsx'
import Footer from '../../components/store/Footer.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { useCategories } from '../../hooks/useCategories.js'

export default function Categories() {
  const { categories, loading } = useCategories()

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-28 md:pb-12">
        <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-2">Categories</h1>
        <p className="text-jewel-muted text-sm mb-8">Browse our collection by category</p>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Grid3X3 size={40} className="text-rose-gold/30" />
            <p className="text-jewel-muted text-sm">No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-blush shadow-sm hover:shadow-md transition-all duration-300"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blush via-rose-gold/20 to-ivory group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-jewel-dark/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h2 className="font-serif text-ivory text-base sm:text-lg leading-tight">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-ivory/70 text-xs mt-0.5 line-clamp-1 hidden sm:block">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
