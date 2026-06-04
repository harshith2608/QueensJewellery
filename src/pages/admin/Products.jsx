import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2, ChevronDown } from 'lucide-react'
import { getProducts, addProduct, updateProduct, deleteProduct, getAllCategories } from '../../firebase/firestore'
import MediaUpload from '../../components/admin/MediaUpload'
import { formatPrice } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', productCode: '', description: '', categoryId: '', price: '', salePrice: '', stock: '', tags: '', featured: false, active: true, media: [] }

function ProductForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? { ...initial, tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''), salePrice: initial.salePrice ?? '' }
    : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState(initial?.media || [])

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Product name is required')
    if (!form.price || isNaN(Number(form.price))) return toast.error('Valid price is required')
    if (!form.categoryId) return toast.error('Please select a category')
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        productCode: form.productCode.trim().toUpperCase(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        salePrice: form.salePrice !== '' ? Number(form.salePrice) : null,
        stock: form.stock !== '' && form.stock !== null ? Number(form.stock) : null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: form.featured, active: form.active, media,
      })
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-jewel-dark mb-1">Product Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. Rose Gold Diamond Ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">
            Product Code <span className="text-jewel-muted font-normal">(for Instagram DMs)</span>
          </label>
          <input value={form.productCode} onChange={(e) => set('productCode', e.target.value.toUpperCase())}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold uppercase" placeholder="e.g. QJ001" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-jewel-dark mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold resize-none" placeholder="Product description" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Category *</label>
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold bg-white">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">
            Stock <span className="text-jewel-muted font-normal">(leave blank for unlimited)</span>
          </label>
          <input type="number" min="0" value={form.stock ?? ''} onChange={(e) => set('stock', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. 10 — leave blank for unlimited" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Price (₹) *</label>
          <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. 4999" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Sale Price (₹) <span className="text-jewel-muted font-normal">optional</span></label>
          <input type="number" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="Leave blank if no sale" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-jewel-dark mb-1">Tags <span className="text-jewel-muted font-normal">(comma-separated)</span></label>
          <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. gold, rings, wedding" />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
            <span className="text-sm font-medium text-jewel-dark">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
            <span className="text-sm font-medium text-jewel-dark">Active</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-jewel-dark mb-2">Media (Images &amp; Videos)</label>
        <MediaUpload existingMedia={media} onUpdate={setMedia} path="products" />
      </div>
      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-jewel-muted hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>
    </form>
  )
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 overflow-y-auto py-8">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-sm'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-jewel-dark">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toggling, setToggling] = useState({})

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([getProducts(), getAllCategories()])
      setProducts(prods); setCategories(cats)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (!filterCat || p.categoryId === filterCat)
  })

  const handleSave = async (formData) => {
    try {
      if (modal?.edit) { await updateProduct(modal.edit.id, formData); toast.success('Product updated') }
      else { await addProduct(formData); toast.success('Product added') }
      setModal(null); load()
    } catch { toast.error('Failed to save product') }
  }

  const handleDelete = async (id) => {
    try { await deleteProduct(id); toast.success('Product deleted'); setDeleteConfirm(null); load() }
    catch { toast.error('Failed to delete product') }
  }

  const handleToggleActive = async (prod) => {
    setToggling((p) => ({ ...p, [prod.id]: true }))
    try { await updateProduct(prod.id, { active: !prod.active }); toast.success(`Product ${!prod.active ? 'activated' : 'deactivated'}`); load() }
    catch { toast.error('Failed to update status') }
    finally { setToggling((p) => ({ ...p, [prod.id]: false })) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Products</h1>
          <p className="text-jewel-muted text-sm mt-0.5">{filtered.length} of {products.length} products</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
        </div>
        <div className="relative">
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold bg-white">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-jewel-muted pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-jewel-muted py-16 text-sm">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Product','Category','Price','Stock','Active','Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide ${h === 'Category' ? 'hidden md:table-cell' : h === 'Stock' ? 'hidden sm:table-cell' : h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {prod.media?.[0]?.url ? <img src={prod.media[0].url} alt={prod.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-jewel-dark truncate max-w-[160px]">{prod.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {prod.productCode && <span className="text-[10px] bg-gray-100 text-jewel-muted px-1.5 py-0.5 rounded font-mono">{prod.productCode}</span>}
                            {prod.featured && <span className="text-[10px] bg-rose-gold/10 text-rose-gold px-1.5 py-0.5 rounded font-medium">Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-jewel-muted hidden md:table-cell">{categoryMap[prod.categoryId] || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-jewel-dark">{formatPrice(prod.price)}</span>
                      {prod.salePrice && <span className="ml-1 text-xs text-rose-gold">{formatPrice(prod.salePrice)}</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        prod.stock === null || prod.stock === undefined ? 'bg-blue-50 text-blue-500' :
                        prod.stock === 0 ? 'bg-red-100 text-red-600' :
                        prod.stock <= 5 ? 'bg-amber-100 text-amber-600' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {prod.stock === null || prod.stock === undefined ? '∞' : prod.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(prod)} disabled={toggling[prod.id]}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${prod.active ? 'bg-rose-gold' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${prod.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ edit: prod })} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteConfirm(prod)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
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
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)} wide>
          <ProductForm initial={modal?.edit || null} categories={categories} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="mx-auto text-red-400 mb-3" />
            <h3 className="text-lg font-semibold text-jewel-dark mb-1">Delete Product?</h3>
            <p className="text-sm text-jewel-muted mb-5">Permanently delete "{deleteConfirm.name}". This cannot be undone.</p>
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
