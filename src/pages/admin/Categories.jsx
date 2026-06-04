import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../../firebase/firestore'
import MediaUpload from '../../components/admin/MediaUpload'
import { slugify } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', slug: '', description: '', displayOrder: 0, active: true, image: '' }

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [media, setMedia] = useState(initial?.image ? [{ type: 'image', url: initial.image }] : [])

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }))

  const handleNameChange = (v) => setForm((p) => ({ ...p, name: v, slug: slugify(v) }))

  const handleMediaUpdate = (arr) => {
    setMedia(arr)
    set('image', arr[0]?.url || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try { await onSave({ ...form, image: media[0]?.url || '' }) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Name *</label>
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. Necklaces" />
        </div>
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Slug</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="auto-generated" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-jewel-dark mb-1">Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold resize-none" placeholder="Short category description" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-jewel-dark mb-1">Display Order</label>
          <input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
        </div>
        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
            <span className="text-sm font-medium text-jewel-dark">Active</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-jewel-dark mb-2">Category Image</label>
        <MediaUpload existingMedia={media} onUpdate={handleMediaUpdate} path="categories" />
      </div>
      <div className="flex gap-3 pt-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-jewel-muted hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-60">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Category'}
        </button>
      </div>
    </form>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-jewel-dark">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toggling, setToggling] = useState({})

  const load = async () => {
    try { const data = await getAllCategories(); setCategories(data) }
    catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (formData) => {
    try {
      if (modal?.edit) { await updateCategory(modal.edit.id, formData); toast.success('Category updated') }
      else { await addCategory(formData); toast.success('Category added') }
      setModal(null); load()
    } catch { toast.error('Failed to save category') }
  }

  const handleDelete = async (id) => {
    try { await deleteCategory(id); toast.success('Category deleted'); setDeleteConfirm(null); load() }
    catch { toast.error('Failed to delete category') }
  }

  const handleToggleActive = async (cat) => {
    setToggling((p) => ({ ...p, [cat.id]: true }))
    try { await updateCategory(cat.id, { active: !cat.active }); toast.success(`Category ${!cat.active ? 'activated' : 'deactivated'}`); load() }
    catch { toast.error('Failed to update status') }
    finally { setToggling((p) => ({ ...p, [cat.id]: false })) }
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
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Categories</h1>
          <p className="text-jewel-muted text-sm mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center text-jewel-muted py-16 text-sm">No categories yet. Add your first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Image','Name','Slug','Order','Active','Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide ${h === 'Slug' ? 'hidden md:table-cell' : h === 'Order' ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {cat.image ? <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-jewel-dark">{cat.name}</td>
                    <td className="px-4 py-3 text-jewel-muted font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                    <td className="px-4 py-3 text-jewel-muted hidden sm:table-cell">{cat.displayOrder}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(cat)} disabled={toggling[cat.id]}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${cat.active ? 'bg-rose-gold' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${cat.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ edit: cat })} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteConfirm(cat)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
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
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <CategoryForm initial={modal?.edit || null} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 size={36} className="mx-auto text-red-400 mb-3" />
            <h3 className="text-lg font-semibold text-jewel-dark mb-1">Delete Category?</h3>
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
