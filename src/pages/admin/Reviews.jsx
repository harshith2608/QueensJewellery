import { useEffect, useState } from 'react'
import { Star, Check, X } from 'lucide-react'
import { getAllReviews, updateReviewApproval } from '../../firebase/firestore'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const FILTERS = ['all', 'pending', 'approved', 'rejected']

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

const getStatus = (r) => r.approved === true ? 'approved' : r.approved === false ? 'rejected' : 'pending'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState({})

  const load = async () => {
    try { const data = await getAllReviews(); setReviews(data) }
    catch { toast.error('Failed to load reviews') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleApproval = async (id, approved) => {
    setProcessing((p) => ({ ...p, [id]: true }))
    try { await updateReviewApproval(id, approved); toast.success(approved ? 'Review approved' : 'Review rejected'); load() }
    catch { toast.error('Failed to update review') }
    finally { setProcessing((p) => ({ ...p, [id]: false })) }
  }

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => getStatus(r) === filter)
  const counts = { all: reviews.length, pending: reviews.filter((r) => getStatus(r) === 'pending').length, approved: reviews.filter((r) => getStatus(r) === 'approved').length, rejected: reviews.filter((r) => getStatus(r) === 'rejected').length }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-serif text-jewel-dark">Reviews</h1>
        <p className="text-jewel-muted text-sm mt-0.5">{reviews.length} total reviews</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-rose-gold text-white shadow-sm' : 'bg-white text-jewel-muted border border-gray-100 hover:border-rose-gold/40'}`}>
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-jewel-muted text-sm">No reviews in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => {
            const status = getStatus(review)
            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-jewel-dark">{review.customerName || review.userName || 'Anonymous'}</span>
                      <StarRating rating={review.rating || 0} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${status === 'approved' ? 'bg-green-100 text-green-600' : status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {status}
                      </span>
                    </div>
                    {review.productName && <p className="text-xs text-jewel-muted mb-1">Product: <span className="text-jewel-dark">{review.productName}</span></p>}
                    {review.comment && <p className="text-sm text-jewel-dark mt-1 leading-relaxed">{review.comment}</p>}
                    <p className="text-xs text-jewel-muted mt-2">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {status !== 'approved' && (
                      <button onClick={() => handleApproval(review.id, true)} disabled={processing[review.id]}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
                        <Check size={13} /> <span className="hidden sm:inline">Approve</span>
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button onClick={() => handleApproval(review.id, false)} disabled={processing[review.id]}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                        <X size={13} /> <span className="hidden sm:inline">Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
