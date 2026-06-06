import { useEffect, useState } from 'react'
import { Eye, X, ChevronDown, Loader2, Clock, Plus, Search, Trash2, ShoppingBag, MessageCircle } from 'lucide-react'
import { getAllOrders, updateOrderStatus, getProducts, createOrder, decrementProductStock } from '../../firebase/firestore'
import OrderStatusBadge from '../../components/admin/OrderStatusBadge'
import { formatPrice, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STORE_URL = 'https://queensjewellery.vercel.app'

const STATUS_MESSAGES = {
  pending:    (name, id) => `Hi ${name}! We have received your Queens Jewellery order #${id}. We'll confirm it shortly. 🙏`,
  confirmed:  (name, id) => `Hi ${name}! Your Queens Jewellery order #${id} has been confirmed. We're preparing it for you! 🎉`,
  processing: (name, id) => `Hi ${name}! Your Queens Jewellery order #${id} is being packed carefully and will be shipped soon. 📦`,
  shipped:    (name, id) => `Hi ${name}! Great news! Your Queens Jewellery order #${id} has been shipped and is on its way to you! 🚚 You'll receive it in 7–8 business days.`,
  delivered:  (name, id) => `Hi ${name}! Your Queens Jewellery order #${id} has been delivered. We hope you love it! 💕 Do share a photo with us!`,
  cancelled:  (name, id) => `Hi ${name}! Your Queens Jewellery order #${id} has been cancelled. Please contact us if you have any questions.`,
}

function openWhatsApp(phone, message) {
  const cleaned = phone.replace(/\D/g, '')
  const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank')
}

const TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState(null)

  const customerPhone = order.address?.phone || order.userPhone || ''
  const customerName = order.address?.fullName || order.address?.name || 'Customer'
  const shortId = order.id.slice(-8).toUpperCase()

  const handleUpdate = async () => {
    if (newStatus === order.status) return toast('Status unchanged')
    setSaving(true)
    try {
      await onStatusUpdate(order.id, newStatus, note)
      toast.success('Status updated')
      setLastNotifiedStatus(newStatus)
    }
    catch { toast.error('Failed to update status') }
    finally { setSaving(false) }
  }

  const handleWhatsApp = (status) => {
    if (!customerPhone) return toast.error('No customer phone number on this order')
    const msgFn = STATUS_MESSAGES[status]
    if (!msgFn) return
    openWhatsApp(customerPhone, msgFn(customerName, shortId))
  }

  const address = order.address || {}
  const items = order.items || []
  const history = order.statusHistory || []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-jewel-dark">Order #{order.id.slice(-8).toUpperCase()}</h2>
              {order.refunded && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">Refunded</span>
              )}
            </div>
            <p className="text-xs text-jewel-muted mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-3">Order Items</h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {(item.image || item.media?.[0]?.url) ? <img src={item.image || item.media[0].url} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />}
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
            <div className="mt-3 p-3 border border-gray-100 rounded-xl space-y-1">
              {order.subtotal != null && <div className="flex justify-between text-sm text-jewel-muted"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              {order.deliveryFee != null && <div className="flex justify-between text-sm text-jewel-muted"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span></div>}
              <div className="flex justify-between text-sm font-bold text-jewel-dark pt-1 border-t border-gray-100"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-2">Delivery Address</h3>
            <div className="p-3 bg-gray-50 rounded-xl text-sm text-jewel-muted space-y-0.5">
              {address.name && <p className="text-jewel-dark font-medium">{address.name}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              {(address.city || address.state || address.pincode) && <p>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>}
              {address.phone && <p>Phone: {address.phone}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-2">Payment</h3>
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-jewel-muted">Method</span>
                <span className="text-jewel-dark font-medium">
                  {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)'
                    : order.paymentMethod === 'cod' ? 'Cash on Delivery'
                    : order.paymentMethod === 'whatsapp' ? 'WhatsApp'
                    : order.paymentMethod || '—'}
                </span>
              </div>
              {order.paymentId && <div className="flex justify-between"><span className="text-jewel-muted">Payment ID</span><span className="text-jewel-dark font-mono text-xs">{order.paymentId}</span></div>}
              {order.couponCode && <div className="flex justify-between"><span className="text-jewel-muted">Coupon</span><span className="text-green-600 font-medium">{order.couponCode}</span></div>}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-jewel-dark mb-3">Status Timeline</h3>
              <div className="space-y-3">
                {[...history].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Clock size={14} className="text-jewel-muted mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={h.status} />
                        <span className="text-xs text-jewel-muted">{formatDate(h.timestamp)}</span>
                      </div>
                      {h.note && <p className="text-xs text-jewel-muted mt-0.5">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Invoice */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-jewel-dark">Send Invoice</p>
              <p className="text-xs text-jewel-muted">Opens WhatsApp with invoice link for the customer</p>
            </div>
            <button
              onClick={() => {
                const phone = order.address?.phone || order.userPhone || ''
                if (!phone) return toast.error('No customer phone number on this order')
                const name = order.address?.fullName || order.address?.name || 'Customer'
                const shortId = order.id.slice(-8).toUpperCase()
                const invoiceUrl = `${STORE_URL}/invoice/${order.id}`
                const msg = `Hi ${name}! 🧾 Here is your invoice for Queens Jewellery order #${shortId}:\n${invoiceUrl}\n\nThank you for shopping with us! 💕`
                openWhatsApp(phone, msg)
              }}
              className="flex items-center gap-2 border border-[#25D366] text-[#25D366] px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#25D366]/10 transition-colors flex-shrink-0"
            >
              <MessageCircle size={14} />
              Send Invoice
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-jewel-dark">Update Status</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="relative">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="appearance-none w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold bg-white">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-jewel-muted pointer-events-none" />
              </div>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleUpdate} disabled={saving || newStatus === order.status}
                className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Updating…' : 'Update Status'}
              </button>
              <button
                onClick={() => handleWhatsApp(lastNotifiedStatus || order.status)}
                disabled={!customerPhone}
                title={!customerPhone ? 'No phone number on this order' : `Send WhatsApp for "${lastNotifiedStatus || order.status}" status`}
                className="flex items-center gap-2 border border-[#25D366] text-[#25D366] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#25D366]/10 transition-colors disabled:opacity-40"
              >
                <MessageCircle size={15} />
                Notify on WhatsApp
              </button>
            </div>
            {lastNotifiedStatus && (
              <p className="text-xs text-jewel-muted">
                Will send <span className="font-medium capitalize">{lastNotifiedStatus}</span> message · tap again any time to re-send
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Manual Order Modal ──────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery (COD)' },
  { value: 'whatsapp', label: 'WhatsApp / Paid Offline' },
  { value: 'razorpay', label: 'Online (Razorpay)' },
  { value: 'upi', label: 'UPI / Bank Transfer' },
]

function ManualOrderModal({ onClose, onCreated }) {
  const [allProducts, setAllProducts] = useState([])
  const [loadingProds, setLoadingProds] = useState(true)
  const [productSearch, setProductSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState([])       // [{product, quantity}]
  const [saving, setSaving] = useState(false)

  // Customer details
  const [customer, setCustomer] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [paymentNote, setPaymentNote] = useState('')  // e.g. UPI ref / Razorpay ID
  const [orderNote, setOrderNote] = useState('')
  const [manualDiscount, setManualDiscount] = useState('')    // optional flat discount

  const setC = (f, v) => setCustomer((p) => ({ ...p, [f]: v }))

  useEffect(() => {
    getProducts()
      .then((prods) => setAllProducts(prods.filter((p) => p.active !== false)))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoadingProds(false))
  }, [])

  const searchLower = productSearch.toLowerCase()
  const filteredProds = allProducts.filter((p) => {
    if (!productSearch) return true
    return (
      p.name?.toLowerCase().includes(searchLower) ||
      p.productCode?.toLowerCase().includes(searchLower)
    )
  }).slice(0, 8)

  const addItem = (product) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
    setProductSearch('')
  }

  const removeItem = (id) => setSelectedItems((prev) => prev.filter((i) => i.product.id !== id))

  const setQty = (id, qty) => {
    const n = Math.max(1, Number(qty))
    setSelectedItems((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: n } : i))
  }

  const subtotal = selectedItems.reduce((sum, { product, quantity }) => {
    const price = product.salePrice ?? product.price
    return sum + price * quantity
  }, 0)

  const discountAmt = manualDiscount && !isNaN(Number(manualDiscount)) ? Math.min(Number(manualDiscount), subtotal) : 0
  const total = subtotal - discountAmt

  const handlePlace = async () => {
    if (selectedItems.length === 0) return toast.error('Add at least one product')
    if (!customer.fullName.trim()) return toast.error('Customer name is required')
    if (!customer.phone.trim()) return toast.error('Customer phone is required')
    if (!customer.line1.trim() || !customer.city.trim() || !customer.state.trim() || !customer.pincode.trim()) {
      return toast.error('Complete delivery address is required')
    }

    setSaving(true)
    try {
      const items = selectedItems.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        productCode: product.productCode || '',
        image: product.media?.find((m) => m.type === 'image')?.url ?? product.media?.[0]?.url ?? '',
        price: product.salePrice ?? product.price,
        quantity,
      }))

      const orderData = {
        source: 'manual',            // flag to distinguish admin-placed orders
        userId: null,
        items,
        subtotal,
        discount: discountAmt,
        total,
        address: { ...customer },
        paymentMethod,
        ...(paymentNote.trim() ? { paymentId: paymentNote.trim() } : {}),
        ...(orderNote.trim() ? { note: orderNote.trim() } : {}),
        ...(discountAmt > 0 ? { manualDiscount: discountAmt } : {}),
        status: 'confirmed',
        statusHistory: [{ status: 'confirmed', timestamp: new Date().toISOString(), note: 'Manual order placed by admin' }],
      }

      await createOrder(orderData)

      // Decrement stock for products that have tracked stock
      await Promise.allSettled(
        selectedItems.map(({ product, quantity }) =>
          decrementProductStock(product.id, quantity)
        )
      )

      toast.success('Manual order placed!')
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-jewel-dark">Place Manual Order</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Product picker ── */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-3">Products</h3>

            {/* Search */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-jewel-muted" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by name or product code (e.g. QJ001)…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold"
              />
            </div>

            {/* Dropdown results */}
            {productSearch && (
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-3">
                {loadingProds ? (
                  <p className="text-xs text-jewel-muted p-3">Loading…</p>
                ) : filteredProds.length === 0 ? (
                  <p className="text-xs text-jewel-muted p-3">No products found.</p>
                ) : filteredProds.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blush/30 transition-colors border-b border-gray-50 last:border-b-0 text-left"
                  >
                    {p.media?.[0]?.url
                      ? <img src={p.media[0].url} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center"><ShoppingBag size={14} className="text-gray-300" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-jewel-dark font-medium truncate">{p.name}</p>
                      <p className="text-xs text-jewel-muted">
                        {p.productCode && <span className="font-mono mr-2">{p.productCode}</span>}
                        {formatPrice(p.salePrice ?? p.price)}
                        {p.stock === null || p.stock === undefined ? ' · Unlimited' : ` · Stock: ${p.stock}`}
                      </p>
                    </div>
                    <Plus size={15} className="text-rose-gold flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected items */}
            {selectedItems.length > 0 ? (
              <div className="space-y-2">
                {selectedItems.map(({ product, quantity }) => {
                  const price = product.salePrice ?? product.price
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      {product.media?.[0]?.url
                        ? <img src={product.media[0].url} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-jewel-dark truncate">{product.name}</p>
                        {product.productCode && <span className="text-[10px] font-mono text-jewel-muted">{product.productCode}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button type="button" onClick={() => setQty(product.id, quantity - 1)} className="px-2 py-1 text-jewel-muted hover:bg-gray-100 text-sm">−</button>
                          <input
                            type="number" min="1" value={quantity}
                            onChange={(e) => setQty(product.id, e.target.value)}
                            className="w-10 text-center text-sm py-1 focus:outline-none border-x border-gray-200"
                          />
                          <button type="button" onClick={() => setQty(product.id, quantity + 1)} className="px-2 py-1 text-jewel-muted hover:bg-gray-100 text-sm">+</button>
                        </div>
                        <span className="text-sm font-semibold text-jewel-dark w-16 text-right">{formatPrice(price * quantity)}</span>
                        <button type="button" onClick={() => removeItem(product.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Totals */}
                <div className="p-3 border border-gray-100 rounded-xl space-y-1.5 mt-1">
                  <div className="flex justify-between text-sm text-jewel-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-jewel-muted flex-shrink-0">Manual discount (₹)</span>
                    <input
                      type="number" min="0" value={manualDiscount}
                      onChange={(e) => setManualDiscount(e.target.value)}
                      placeholder="0"
                      className="ml-auto w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold"
                    />
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−{formatPrice(discountAmt)}</span></div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-jewel-dark pt-1.5 border-t border-gray-100">
                    <span>Order Total</span>
                    <span className="text-rose-gold">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-jewel-muted text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Search and add products above
              </p>
            )}
          </div>

          {/* ── Customer details ── */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-3">Customer Details</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">Full Name *</label>
                <input value={customer.fullName} onChange={(e) => setC('fullName', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. Priya Sharma" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">Phone *</label>
                <input value={customer.phone} onChange={(e) => setC('phone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="e.g. 9876543210" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-jewel-muted mb-1">Address Line 1 *</label>
                <input value={customer.line1} onChange={(e) => setC('line1', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="House / flat / street" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-jewel-muted mb-1">Address Line 2 <span className="font-normal">(optional)</span></label>
                <input value={customer.line2} onChange={(e) => setC('line2', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="Landmark / area" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">City *</label>
                <input value={customer.city} onChange={(e) => setC('city', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="City" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">State *</label>
                <input value={customer.state} onChange={(e) => setC('state', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="State" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">Pincode *</label>
                <input value={customer.pincode} onChange={(e) => setC('pincode', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="6-digit pincode" />
              </div>
            </div>
          </div>

          {/* ── Payment & Notes ── */}
          <div>
            <h3 className="text-sm font-semibold text-jewel-dark mb-3">Payment & Notes</h3>
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs font-medium text-jewel-muted mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="appearance-none w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold bg-white">
                  {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 bottom-3 text-jewel-muted pointer-events-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">Payment Reference <span className="font-normal">(UPI ID / Razorpay ID / transaction no.)</span></label>
                <input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-jewel-muted mb-1">Order Note <span className="font-normal">(internal)</span></label>
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold resize-none" placeholder="e.g. Instagram DM order — @username" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-jewel-muted hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handlePlace} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors disabled:opacity-60 shadow-sm">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Placing Order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [viewOrder, setViewOrder] = useState(null)
  const [showManual, setShowManual] = useState(false)

  const load = async () => {
    try { const data = await getAllOrders(); setOrders(data) }
    catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleStatusUpdate = async (id, status, note) => { await updateOrderStatus(id, status, note); load() }

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-jewel-dark">Orders</h1>
          <p className="text-jewel-muted text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => setShowManual(true)}
          className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-gold/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> Manual Order
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
          return (
            <button key={s} onClick={() => setActiveTab(s)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${activeTab === s ? 'bg-rose-gold text-white shadow-sm' : 'bg-white text-jewel-muted border border-gray-100 hover:border-rose-gold/40'}`}>
              {s} <span className="ml-1 opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-jewel-muted py-16 text-sm">No orders in this category.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden md:table-cell">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-jewel-muted uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-jewel-muted uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-jewel-muted">
                      #{order.id.slice(-8).toUpperCase()}
                      {order.source === 'manual' && (
                        <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-sans font-medium">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-jewel-dark hidden sm:table-cell">{order.address?.fullName || order.address?.name || order.phone || order.userId?.slice(-6) || '—'}</td>
                    <td className="px-4 py-3 text-jewel-muted hidden md:table-cell">{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-medium text-jewel-dark">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} refunded={order.refunded} /></td>
                    <td className="px-4 py-3 text-jewel-muted hidden lg:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => setViewOrder(order)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
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

      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} onStatusUpdate={handleStatusUpdate} />}

      {showManual && (
        <ManualOrderModal
          onClose={() => setShowManual(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
