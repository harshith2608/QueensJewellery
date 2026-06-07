import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2, ChevronDown, ShoppingBag, Bell, Heart, Star, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { getProducts, addProduct, updateProduct, deleteProduct, getAllCategories } from '../../firebase/firestore'
import MediaUpload from '../../components/admin/MediaUpload'
import { formatPrice } from '../../utils/formatters'
import toast from 'react-hot-toast'

// ─── Preview helpers ──────────────────────────────────────────────────────────

function buildPreviewProduct(form, media, categories) {
  const price = Number(form.price) || 0
  const salePrice = form.salePrice !== '' && form.salePrice != null ? Number(form.salePrice) : null
  const stock = form.stock !== '' && form.stock != null ? Number(form.stock) : null
  const cat = categories.find((c) => c.id === form.categoryId)
  return {
    id: '__preview__',
    name: form.name || 'Product Name',
    price,
    salePrice: salePrice != null && salePrice < price ? salePrice : null,
    description: form.description || '',
    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
    media: media || [],
    stock,
    featured: form.featured,
    categoryName: cat?.name || '',
  }
}

// ── Static Shop Tile preview (no router/cart context) ─────────────────────────
function ShopTilePreview({ product }) {
  const { name, price, salePrice, media, stock } = product
  const firstMedia = Array.isArray(media) && media.length > 0 ? media[0] : null
  const imageUrl = firstMedia?.url || null
  const onSale = salePrice != null && salePrice < price
  const isOutOfStock = stock === 0

  return (
    <div className="relative bg-ivory rounded-2xl overflow-hidden w-[200px] shadow-lg flex-shrink-0">
      <div className="relative aspect-square overflow-hidden bg-blush">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={40} className="text-rose-gold/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {isOutOfStock && <span className="bg-jewel-dark text-ivory text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Out of Stock</span>}
          {onSale && !isOutOfStock && <span className="bg-rose-gold text-ivory text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Sale</span>}
        </div>
        <div className="absolute top-2 right-2 p-2 rounded-full bg-ivory/80 text-jewel-muted">
          <Heart size={14} />
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-serif text-jewel-dark text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {name || 'Product Name'}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-rose-gold font-semibold text-sm">{formatPrice(onSale ? salePrice : price)}</span>
          {onSale && <span className="text-jewel-muted text-xs line-through">{formatPrice(price)}</span>}
        </div>
        <div className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium ${isOutOfStock ? 'border border-rose-gold text-rose-gold' : 'bg-rose-gold text-ivory'}`}>
          {isOutOfStock ? <><Bell size={12} /> Notify Me</> : <><ShoppingBag size={12} /> Add to Cart</>}
        </div>
      </div>
    </div>
  )
}

// ── Static Product Page preview ───────────────────────────────────────────────
function ProductPagePreview({ product }) {
  const { name, price, salePrice, description, tags, sizes, media, stock, categoryName } = product
  const firstMedia = Array.isArray(media) && media.length > 0 ? media[0] : null
  const imageUrl = firstMedia?.url || null
  const onSale = salePrice != null && salePrice < price
  const effectivePrice = onSale ? salePrice : price
  const isOutOfStock = stock === 0
  const lowStock = stock != null && stock > 0 && stock <= 5

  return (
    <div className="bg-ivory rounded-xl overflow-hidden text-sm max-w-sm w-full">
      {/* Image */}
      <div className="aspect-square bg-blush overflow-hidden rounded-xl mb-4">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={60} className="text-rose-gold/20" />
          </div>
        )}
      </div>

      {/* Breadcrumb stub */}
      <p className="text-[10px] text-jewel-muted mb-2 px-1">
        Home / {categoryName || 'Category'} / <span className="text-jewel-dark font-medium">{name || 'Product'}</span>
      </p>

      {/* Name */}
      <h1 className="font-serif text-2xl text-jewel-dark leading-tight mb-2">{name || 'Product Name'}</h1>

      {/* Rating stub */}
      <div className="flex items-center gap-1 mb-3">
        {[1,2,3,4,5].map((s) => <Star key={s} size={13} className="text-jewel-muted" />)}
        <span className="text-xs text-jewel-muted ml-1">No reviews yet</span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-serif text-2xl text-rose-gold font-semibold">{formatPrice(effectivePrice)}</span>
        {onSale && <span className="text-jewel-muted text-base line-through">{formatPrice(price)}</span>}
        {onSale && <span className="text-xs bg-rose-gold text-white px-2 py-0.5 rounded-full font-medium">Save {Math.round(((price - salePrice) / price) * 100)}%</span>}
      </div>

      {/* Stock */}
      <div className="mb-3">
        {isOutOfStock ? (
          <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium"><XCircle size={14} /> Out of Stock</div>
        ) : lowStock ? (
          <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium"><AlertTriangle size={14} /> Only {stock} left</div>
        ) : (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><CheckCircle2 size={14} /> In Stock</div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="mb-3">
          <h3 className="font-serif text-base text-jewel-dark mb-1">Description</h3>
          <p className="text-jewel-muted text-xs leading-relaxed line-clamp-4">{description}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span key={tag} className="text-xs bg-blush text-jewel-muted px-2.5 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-jewel-dark mb-1.5">Size:</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <div key={size} className="px-3 py-1 rounded-full text-xs font-medium border-2 border-blush text-jewel-dark">{size}</div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="space-y-2 mt-3">
        <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium ${isOutOfStock ? 'bg-gray-200 text-gray-400' : 'bg-rose-gold text-ivory'}`}>
          <ShoppingBag size={16} />{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </div>
        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border border-[#25D366] text-[#25D366]">
          Order on WhatsApp
        </div>
      </div>

      <p className="text-[10px] text-jewel-muted mt-3 pt-3 border-t border-blush">Free shipping on orders above ₹999 · Easy returns within 7 days</p>
    </div>
  )
}


const EMPTY_FORM = { name: '', productCode: '', description: '', categoryId: '', price: '', salePrice: '', stock: '', tags: '', sizes: '', featured: false, active: true, media: [] }

function ProductForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? { ...initial, tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''), sizes: Array.isArray(initial.sizes) ? initial.sizes.join(', ') : (initial.sizes || ''), salePrice: initial.salePrice ?? '' }
    : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState(initial?.media || [])
  const [previewTab, setPreviewTab] = useState('tile')

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  const isBangleCategory = () => {
    const cat = categories.find((c) => c.id === form.categoryId)
    return cat?.name?.toLowerCase().includes('bangle') ?? false
  }

  const previewProduct = buildPreviewProduct(form, media, categories)

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
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        featured: form.featured, active: form.active, media,
      })
    } finally { setSaving(false) }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left: scrollable form ── */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 border-r border-gray-100 min-w-0 space-y-4">
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
          {isBangleCategory() && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-jewel-dark mb-1">
                Sizes <span className="text-jewel-muted font-normal">(bangle sizes: 2-2, 2-4, 2-6, 2-8, 2-10)</span>
              </label>
              <input value={form.sizes} onChange={(e) => set('sizes', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. 2-2, 2-4, 2-6, 2-8, 2-10" />
            </div>
          )}
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

      {/* ── Right: live preview panel (outside <form> so no submit issues) ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-gray-50/40">
        {/* Toggle tabs — fixed at top of panel */}
        <div className="flex gap-1.5 p-3 border-b border-gray-100 flex-shrink-0">
          {[
            { key: 'tile', label: 'Shop Tile' },
            { key: 'page', label: 'Product Page' },
          ].map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setPreviewTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${previewTab === key ? 'bg-rose-gold text-white shadow-sm' : 'bg-white text-jewel-muted border border-gray-100 hover:border-rose-gold/40'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Scrollable preview content */}
        <div className="flex-1 overflow-y-auto p-4">
          {previewTab === 'tile' ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] text-jewel-muted text-center">How it looks in the shop grid</p>
              <ShopTilePreview product={previewProduct} />
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-jewel-muted text-center mb-3">How the product page looks</p>
              <ProductPagePreview product={previewProduct} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className={`bg-white rounded-2xl shadow-xl w-full flex flex-col ${wide ? 'max-w-5xl h-[92vh]' : 'max-w-sm max-h-[90vh] overflow-y-auto'}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0 ${!wide && 'sticky top-0 bg-white z-10'}`}>
          <h2 className="text-base font-semibold text-jewel-dark">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className={wide ? 'flex-1 overflow-hidden' : 'p-5'}>{children}</div>
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
