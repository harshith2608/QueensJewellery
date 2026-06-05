import { useEffect, useState } from 'react'
import { Eye, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { getAllRefunds, updateRefundStatus } from '../../firebase/firestore'
import { formatDate, formatPrice } from '../../utils/formatters'
import toast from 'react-hot-toast'

const TABS = ['all', 'pending', 'approved', 'rejected']

const STATUS_COLORS = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function RefundBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function RefundDetailModal({ refund, onClose, onUpdated }) {
  const [adminNote, setAdminNote] = useState(refund.adminNote || '')
  const [saving, setSaving] = useState(null)

  const handleAction = async (status) => {
    setSaving(status)
    try {
      await updateRefundStatus(refund.id, status, adminNote)
      toast.success(status === 'approved' ? 'Refund approved' : 'Refund rejected')
      onUpdated()
      onClose()
    } catch {
      toast.error('Failed to update refund status')
    } finally {
      setSaving(null)
    }
  }

  const shortOrderId = refund.orderId?.slice(-8).toUpperCase() || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-jewel-dark">Refund Request</h2>
            <p className="text-xs text-jewel-muted mt-0.5">Order #{shortOrderId} · {formatDate(refund.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-jewel-muted">Current status:</span>
            <RefundBadge status={refund.status} />
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-2">Customer</h3>
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-0.5 text-jewel-muted">
              {refund.address?.fullName && <p className="text-jewel-dark font-medium">{refund.address.fullName}</p>}
              {refund.userPhone && <p>{refund.userPhone}</p>}
              {refund.address?.line1 && <p>{refund.address.line1}{refund.address.line2 ? `, ${refund.address.line2}` : ''}</p>}
              {refund.address?.city && <p>{refund.address.city}, {refund.address.state} – {refund.address.pincode}</p>}
            </div>
          </div>

          {/* Order items */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-2">
              Order Items <span className="font-normal text-jewel-muted">({formatPrice(refund.orderTotal)})</span>
            </h3>
            <div className="space-y-2">
              {(refund.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jewel-dark truncate">{item.name}</p>
                    <p className="text-xs text-jewel-muted">
                      Qty: {item.quantity || 1}
                      {item.selectedSize && ` · Size: ${item.selectedSize}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-jewel-dark">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reason & description */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-2">Reason</h3>
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2">
              <p className="font-medium text-jewel-dark">{refund.reason}</p>
              {refund.description && <p className="text-jewel-muted leading-relaxed">{refund.description}</p>}
            </div>
          </div>

          {/* Proof media */}
          {refund.proofUrls?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-jewel-dark mb-2">Proof ({refund.proofUrls.length} file{refund.proofUrls.length !== 1 ? 's' : ''})</h3>
              <div className="flex flex-wrap gap-3">
                {refund.proofUrls.map((url, i) => {
                  const isVideo = /\.(mp4|mov|webm|avi)/i.test(url) || url.includes('video')
                  return isVideo ? (
                    <video key={i} src={url} controls className="w-full max-w-xs rounded-xl border border-gray-200" />
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Proof ${i + 1}`} className="w-28 h-28 rounded-xl object-cover border border-gray-200 hover:opacity-90 transition-opacity" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Admin note */}
          {refund.status === 'pending' && (
            <div>
              <h3 className="text-sm font-semibold text-jewel-dark mb-2">Admin Note <span className="font-normal text-jewel-muted">(optional — visible to customer)</span></h3>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="e.g. Refund will be processed within 5–7 business days via original payment method."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold resize-none"
              />
            </div>
          )}

          {refund.adminNote && refund.status !== 'pending' && (
            <div>
              <h3 className="text-sm font-semibold text-jewel-dark mb-1">Admin Note</h3>
              <p className="text-sm text-jewel-muted bg-gray-50 rounded-xl p-3">{refund.adminNote}</p>
            </div>
          )}

          {/* Action buttons */}
          {refund.status === 'pending' && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleAction('rejected')}
                disabled={!!saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {saving === 'rejected' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={16} />}
                Reject
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={!!saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving === 'approved' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Approve Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Refunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [viewRefund, setViewRefund] = useState(null)

  const load = async () => {
    try {
      const data = await getAllRefunds()
      setRefunds(data)
    } catch {
      toast.error('Failed to load refund requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = activeTab === 'all' ? refunds : refunds.filter((r) => r.status === activeTab)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-serif text-jewel-dark">Refunds</h1>
        <p className="text-jewel-muted text-sm mt-0.5">{refunds.length} total refund request{refunds.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count = tab === 'all' ? refunds.length : refunds.filter((r) => r.status === tab).length
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-rose-gold text-white shadow-sm' : 'bg-white text-jewel-muted border border-gray-100 hover:border-rose-gold/40'}`}>
              {tab} <span className="ml-1 opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-jewel-muted py-16 text-sm">No refund requests in this category.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden md:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-jewel-muted uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-jewel-muted">#{refund.orderId?.slice(-8).toUpperCase() || '—'}</td>
                    <td className="px-4 py-3 text-jewel-dark hidden sm:table-cell">{refund.address?.fullName || refund.userPhone || '—'}</td>
                    <td className="px-4 py-3 text-jewel-muted hidden md:table-cell max-w-[200px] truncate">{refund.reason}</td>
                    <td className="px-4 py-3"><RefundBadge status={refund.status} /></td>
                    <td className="px-4 py-3 text-jewel-muted hidden lg:table-cell">{formatDate(refund.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => setViewRefund(refund)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <Eye size={13} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewRefund && (
        <RefundDetailModal
          refund={viewRefund}
          onClose={() => setViewRefund(null)}
          onUpdated={() => { load(); setViewRefund(null) }}
        />
      )}
    </div>
  )
}
