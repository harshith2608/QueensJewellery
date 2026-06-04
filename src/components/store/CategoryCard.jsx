import { Link } from 'react-router-dom'

const PLACEHOLDER = '/placeholder-category.jpg'

/**
 * Category card — links to /category/:slug
 * Props: category { id, name, slug, image, description }
 */
export default function CategoryCard({ category }) {
  if (!category) return null
  const { name, slug, image, description } = category

  return (
    <Link
      to={`/category/${slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-square block bg-blush hover:shadow-xl transition-shadow duration-300"
    >
      {/* Background image */}
      <img
        src={image || PLACEHOLDER}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-jewel-dark/70 via-jewel-dark/20 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-serif text-ivory text-lg leading-tight">{name}</h3>
        {description && (
          <p className="text-ivory/70 text-xs mt-0.5 line-clamp-1">{description}</p>
        )}
        <span className="inline-block mt-2 text-xs text-rose-gold font-medium tracking-wide uppercase group-hover:underline">
          Shop Now →
        </span>
      </div>
    </Link>
  )
}
