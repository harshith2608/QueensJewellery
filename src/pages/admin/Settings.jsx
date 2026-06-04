import { useEffect, useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Loader2, Save } from 'lucide-react'
import { getSettings, updateSettings } from '../../firebase/firestore'
import MediaUpload from '../../components/admin/MediaUpload'
import toast from 'react-hot-toast'

const EMPTY_OFFER = { active: false, type: 'percent', value: '', minOrder: '' }
const EMPTY_PROMO = { active: true, label: 'Special Offer', title: '', subtitle: '', buttonText: 'Shop Now', buttonLink: '/shop' }

export default function Settings() {
  const [whatsapp, setWhatsapp] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [banners, setBanners] = useState([])
  const [globalOffer, setGlobalOffer] = useState(EMPTY_OFFER)
  const [promoBanner, setPromoBanner] = useState(EMPTY_PROMO)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings()
        setWhatsapp(data.whatsapp || '')
        setAnnouncement(data.announcement || '')
        setBanners(data.banners || [])
        setGlobalOffer(data.globalOffer || EMPTY_OFFER)
        setPromoBanner(data.promoBanner || EMPTY_PROMO)
      } catch { toast.error('Failed to load settings') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const setOffer = (field, value) => setGlobalOffer((p) => ({ ...p, [field]: value }))
  const setPromo = (field, value) => setPromoBanner((p) => ({ ...p, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        whatsapp, announcement, banners,
        promoBanner,
        globalOffer: {
          active: globalOffer.active,
          type: globalOffer.type,
          value: globalOffer.value !== '' ? Number(globalOffer.value) : 0,
          minOrder: globalOffer.minOrder !== '' ? Number(globalOffer.minOrder) : 0,
        },
      })
      toast.success('Settings saved')
    }
    catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const moveBanner = (index, direction) => {
    const updated = [...banners]
    const swapWith = index + direction
    if (swapWith < 0 || swapWith >= updated.length) return
    ;[updated[index], updated[swapWith]] = [updated[swapWith], updated[index]]
    setBanners(updated)
  }

  const removeBanner = (index) => setBanners((prev) => prev.filter((_, i) => i !== index))

  const handleBannerMediaUpdate = (mediaArr) => {
    const newUrls = mediaArr.filter((m) => m.type === 'image').map((m) => m.url)
    const existing = banners.map((b) => b.url)
    const toAdd = newUrls.filter((u) => !existing.includes(u)).map((url) => ({ url, alt: '' }))
    if (toAdd.length > 0) setBanners((prev) => [...prev, ...toAdd])
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Settings</h1>
          <p className="text-jewel-muted text-sm mt-0.5">Manage store-wide configuration</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-jewel-dark mb-1">WhatsApp Number</h2>
        <p className="text-xs text-jewel-muted mb-3">Include country code (e.g. +919876543210).</p>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+919876543210"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-jewel-dark mb-1">Announcement Bar</h2>
        <p className="text-xs text-jewel-muted mb-3">Shown as a top banner on the storefront. Leave blank to hide.</p>
        <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="e.g. Free shipping on orders above ₹2,000!"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
        {announcement && (
          <div className="mt-3 px-4 py-2.5 bg-rose-gold text-white text-sm text-center rounded-xl">{announcement}</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-jewel-dark">Promo Banner</h2>
            <p className="text-xs text-jewel-muted mt-0.5">The large promotional banner on the home page.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={promoBanner.active} onChange={(e) => setPromo('active', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
            <span className="text-sm font-medium text-jewel-dark">Show</span>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-jewel-muted mb-1">Label (small text above title)</label>
            <input value={promoBanner.label} onChange={(e) => setPromo('label', e.target.value)}
              placeholder="e.g. Special Offer"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-jewel-muted mb-1">Button Text</label>
            <input value={promoBanner.buttonText} onChange={(e) => setPromo('buttonText', e.target.value)}
              placeholder="e.g. Shop Now"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-jewel-muted mb-1">Title</label>
            <input value={promoBanner.title} onChange={(e) => setPromo('title', e.target.value)}
              placeholder="e.g. Free Shipping on Orders Above ₹999"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-jewel-muted mb-1">Subtitle</label>
            <input value={promoBanner.subtitle} onChange={(e) => setPromo('subtitle', e.target.value)}
              placeholder="e.g. Shop your favourite jewellery with no delivery charges — across India!"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-jewel-muted mb-1">Button Link</label>
            <input value={promoBanner.buttonLink} onChange={(e) => setPromo('buttonLink', e.target.value)}
              placeholder="e.g. /shop or /category/necklaces"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-jewel-dark">Global Offer</h2>
            <p className="text-xs text-jewel-muted mt-0.5">Auto-applied at checkout — no coupon code needed.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={globalOffer.active} onChange={(e) => setOffer('active', e.target.checked)} className="w-4 h-4 accent-rose-gold" />
            <span className="text-sm font-medium text-jewel-dark">Active</span>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-jewel-muted mb-1">Discount Type</label>
            <select value={globalOffer.type} onChange={(e) => setOffer('type', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold bg-white">
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-jewel-muted mb-1">
              {globalOffer.type === 'percent' ? 'Discount %' : 'Discount ₹'}
            </label>
            <input type="number" min="0" value={globalOffer.value}
              onChange={(e) => setOffer('value', e.target.value)}
              placeholder={globalOffer.type === 'percent' ? 'e.g. 10' : 'e.g. 150'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-jewel-muted mb-1">Min Order (₹)</label>
            <input type="number" min="0" value={globalOffer.minOrder}
              onChange={(e) => setOffer('minOrder', e.target.value)}
              placeholder="e.g. 1500 or 0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
          </div>
        </div>

        {globalOffer.active && globalOffer.value > 0 && (
          <p className="text-xs text-rose-gold font-medium">
            ✓ {globalOffer.type === 'percent' ? `${globalOffer.value}% off` : `₹${globalOffer.value} off`}
            {globalOffer.minOrder > 0 ? ` on orders above ₹${globalOffer.minOrder}` : ' on all orders'}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-jewel-dark mb-1">Hero Banners</h2>
        <p className="text-xs text-jewel-muted mb-4">Upload images for the homepage hero. Use arrows to reorder.</p>

        {banners.length > 0 && (
          <div className="space-y-3 mb-5">
            {banners.map((banner, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={banner.url} alt={banner.alt || `Banner ${i + 1}`} className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <input value={banner.alt || ''} onChange={(e) => { const u = [...banners]; u[i] = { ...u[i], alt: e.target.value }; setBanners(u) }}
                    placeholder="Alt text (optional)"
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-gold/30 focus:border-rose-gold bg-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveBanner(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 text-jewel-muted disabled:opacity-30 transition-colors" title="Move up"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1} className="p-1 rounded hover:bg-gray-200 text-jewel-muted disabled:opacity-30 transition-colors" title="Move down"><ChevronDown size={14} /></button>
                </div>
                <button type="button" onClick={() => removeBanner(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Remove"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-jewel-muted uppercase tracking-wide mb-2">Add New Banner Images</p>
          <MediaUpload existingMedia={[]} onUpdate={handleBannerMediaUpdate} path="banners" />
        </div>
      </div>

      <div className="flex justify-end pb-4">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-rose-gold text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
