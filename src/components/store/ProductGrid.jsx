import ProductCard from './ProductCard.jsx'
import Spinner from '../ui/Spinner.jsx'

export default function ProductGrid({ products = [], loading = false, emptyMessage = 'No products found.', hasMore = false, onLoadMore }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-2xl text-jewel-dark mb-2">Nothing here yet</p>
        <p className="text-jewel-muted text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            className="px-8 py-3 border border-rose-gold text-rose-gold rounded-full text-sm font-medium hover:bg-blush transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
