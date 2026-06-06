import { useState } from 'react'
import { Star, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useProductReviews } from '../../hooks/useReviews.js'
import { addReview } from '../../firebase/firestore.js'
import { formatDate } from '../../utils/formatters.js'
import OTPModal from './OTPModal.jsx'

// ─── Star rating display ───────────────────────────────────────────────────────

function StarRating({ value, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0)
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? undefined : 'group'}
      aria-label={readOnly ? `${value} out of 5 stars` : 'Select rating'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (readOnly ? value : hovered || value)
        return (
          <Star
            key={star}
            className={`${sz} transition-colors ${
              filled ? 'text-rose-gold fill-rose-gold' : 'text-blush fill-blush'
            } ${!readOnly ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            onClick={() => !readOnly && onChange?.(star)}
            aria-label={!readOnly ? `${star} star${star > 1 ? 's' : ''}` : undefined}
          />
        )
      })}
    </div>
  )
}

// ─── Safe display name: never show phone numbers ──────────────────────────────

function maskName(name) {
  if (!name) return 'Verified Buyer'
  // If it looks like a phone number, never display it
  if (/^[+\d\s\-().]{7,}$/.test(name.trim())) return 'Verified Buyer'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

// ─── Review submission form (shown inside a modal overlay) ────────────────────

function ReviewFormModal({ productId, onClose, onSubmitted }) {
  const { user, userData } = useAuth()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!rating) { setError('Please select a star rating.'); return }
    if (!comment.trim()) { setError('Please write a comment.'); return }

    setLoading(true)
    try {
      await addReview({
        productId,
        userId: user.uid,
        // Never store phone number — use profile name or generic fallback
        customerName: userData?.name?.trim() || user.displayName?.trim() || 'Verified Buyer',
        rating,
        comment: comment.trim(),
        approved: false,
      })
      onSubmitted()
    } catch (err) {
      console.error('addReview error:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-jewel-dark/60 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-ivory rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-blush flex items-center justify-between">
          <h3 className="font-serif text-lg text-jewel-dark">Write a Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-jewel-muted hover:text-jewel-dark p-1 text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <label className="text-xs text-jewel-muted font-medium block mb-2">
              Your Rating *
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-xs text-jewel-muted font-medium block mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Tell us about the quality, design, and your experience..."
              className="w-full border border-blush rounded-xl px-3 py-2.5 text-sm text-jewel-dark placeholder-jewel-muted outline-none focus:border-rose-gold transition-colors resize-none bg-white"
              maxLength={500}
              aria-label="Review comment"
            />
            <p className="text-right text-xs text-jewel-muted mt-1">
              {comment.length}/500
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !rating || !comment.trim()}
            className="w-full bg-rose-gold text-ivory py-3 rounded-full text-sm font-medium hover:bg-jewel-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin" />
                Submitting...
              </>
            ) : 'Submit Review'}
          </button>

          <p className="text-xs text-jewel-muted text-center">
            Your review will be published after approval.
          </p>
        </form>
      </div>
    </div>
  )
}

// ─── Main ReviewSection ────────────────────────────────────────────────────────

/**
 * Review section for product detail page.
 * Props: productId
 */
export default function ReviewSection({ productId }) {
  const { isAuthenticated } = useAuth()
  const { reviews, loading, averageRating, reviewCount } = useProductReviews(productId)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      setShowOTPModal(true)
    } else {
      setShowReviewForm(true)
    }
  }

  const handleOTPSuccess = () => {
    setShowOTPModal(false)
    setShowReviewForm(true)
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setSubmitted(true)
  }

  return (
    <section id="reviews" aria-label="Customer reviews" className="space-y-6">
      {/* Summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-jewel-dark mb-1">Customer Reviews</h2>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(averageRating)} readOnly size="sm" />
              <span className="text-jewel-dark font-semibold text-sm">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-jewel-muted text-sm">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            !loading && (
              <p className="text-jewel-muted text-sm">No reviews yet. Be the first!</p>
            )
          )}
        </div>

        {submitted ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-full border border-green-200 self-start sm:self-auto">
            Thank you! Pending approval.
          </div>
        ) : (
          <button
            onClick={handleWriteReview}
            className="inline-flex items-center gap-2 bg-rose-gold text-ivory px-5 py-2.5 rounded-full text-sm font-medium hover:bg-jewel-dark transition-colors self-start sm:self-auto"
          >
            <Star size={16} />
            Write a Review
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse p-4 rounded-2xl border border-blush space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blush" />
                <div className="h-4 bg-blush rounded-full w-28" />
              </div>
              <div className="h-4 bg-blush rounded-full w-full" />
              <div className="h-4 bg-blush rounded-full w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {!loading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-blush rounded-2xl p-4 sm:p-5 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-rose-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-jewel-dark">
                      {maskName(review.customerName || review.name)}
                    </p>
                    <p className="text-xs text-jewel-muted">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} readOnly size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-jewel-dark leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          onSuccess={handleOTPSuccess}
        />
      )}

      {showReviewForm && (
        <ReviewFormModal
          productId={productId}
          onClose={() => setShowReviewForm(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </section>
  )
}
