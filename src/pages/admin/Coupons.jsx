import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { getAllCoupons, addCoupon, updateCoupon, deleteCoupon } from '../../firebase/firestore'
import { formatPrice, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY_FORM = { code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiry: '', active: true }

function CouponForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? { ...initial, minOrder: initial.minOrder ?? '', maxUses: initial.maxUses ?? '', expiry: initial.expiry ? new Date(initial.expiry).toISOString().split('T')[0] : '' }
    : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) return toast.error('Coupon code is required')
    if (!form.value || isNaN(Number(form.value))) return toast.error('Valid discount value is required')
    setSaving(true)
    try {
      await onSave({
        code: form.code.toUpperCase().trim(), type: form.type, value: Number(form.value),
        minOrder: form.minOrder !== '' ? Number(form.minOrder) : null,
        maxUses: form.maxUses !== '' ? Number(form.maxUses) : 0,
        expiry: form.expiry ? new Date(form.expiry).toISOString() : null,
        active: form.active, usedCount: initial?.usedCount ?? 0,
      })
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-jewel-dark mb-1">Coupon Code *</label>
        <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. SAVE20" />
      </div>
      <div>
        <label className="block text-sm font-medium text-jewel-dark mb-2">Discount Type *</label>
        <div className="flex gap-4">
          {['percent', 'flat'].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={t} checked={form.type === t} onChange={() => set('type', t)} className="accent-rose-gold w-4 h-4" />
              <span className="text-sm text-jewel-dark">{t === 'percent' ? 'Percentage (%)' : 'Flat Amount (₹)'}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Value * {form.type === 'percent' ? '(%)' : '(₹)'}</label>
          <input type="number" min="0" max={form.type === 'percent' ? 100 : undefined} value={form.value} onChange={(e) => set('value', e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder={form.type === 'percent' ? 'e.g. 20' : 'e.g. 500'} />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Min. Order (₹) <span className="text-jewel-muted font-normal">optional</span></label>
          <input type="number" min="0" value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="No minimum" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Max Uses <span className="text-jewel-muted font-normal">(0 = unlimited)</span></label>
          <input type="number" min="0" value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Expiry Date <span className="text-jewel-muted font-normal">optional</span></label>
          <input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
        <span className="text-sm font-medium text-jewel-dark">Active</span>
      </label>
      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-jewel-muted hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Coupon'}
        </button>
      </div>
    </form>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-jewel-dark">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toggling, setToggling] = useState({})

  const load = async () => {
    try { const data = await getAllCoupons(); setCoupons(data) }
    catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (formData) => {
    try {
      if (modal?.edit) { await updateCoupon(modal.edit.id, formData); toast.success('Coupon updated') }
      else { await addCoupon(formData); toast.success('Coupon added') }
      setModal(null); load()
    } catch { toast.error('Failed to save coupon') }
  }

  const handleDelete = async (id) => {
    try { await deleteCoupon(id); toast.success('Coupon deleted'); setDeleteConfirm(null); load() }
    catch { toast.error('Failed to delete coupon') }
  }

  const handleToggleActive = async (coupon) => {
    setToggling((p) => ({ ...p, [coupon.id]: true }))
    try { await updateCoupon(coupon.id, { active: !coupon.active }); toast.success(`Coupon ${!coupon.active ? 'activated' : 'deactivated'}`); load() }
    catch { toast.error('Failed to update status') }
    finally { setToggling((p) => ({ ...p, [coupon.id]: false })) }
  }

  const isExpired = (expiry) => expiry && new Date(expiry) < new Date()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Coupons</h1>
          <p className="text-jewel-muted text-sm mt-0.5">{coupons.length} coupons</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <p className="text-center text-jewel-muted py-16 text-sm">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden md:table-cell">Min Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden sm:table-cell">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden lg:table-cell">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-jewel-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-jewel-dark">{c.code}</span>
                        {isExpired(c.expiry) && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-medium">Expired</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-rose-gold">{c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)} off</td>
                    <td className="px-4 py-3 text-jewel-muted hidden md:table-cell">{c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
                    <td className="px-4 py-3 text-jewel-muted hidden sm:table-cell">{c.usedCount || 0} / {c.maxUses || '∞'}</td>
                    <td className="px-4 py-3 text-jewel-muted hidden lg:table-cell">{c.expiry ? formatDate(c.expiry) : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(c)} disabled={toggling[c.id]}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${c.active ? 'bg-rose-gold' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${c.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ edit: c })} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteConfirm(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Coupon' : 'Edit Coupon'} onClose={() => setModal(null)}>
          <CouponForm initial={modal?.edit || null} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="mx-auto text-red-400 mb-3" />
            <h3 className="text-lg font-semibold text-jewel-dark mb-1">Delete Coupon?</h3>
            <p className="text-sm text-jewel-muted mb-5">Permanently delete coupon "{deleteConfirm.code}".</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-jewel-muted hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
