import { useEffect, useState } from 'react'
import { ShoppingBag, Package, IndianRupee, Clock, AlertTriangle } from 'lucide-react'
import { getAllOrders, getProducts } from '../../firebase/firestore'
import OrderStatusBadge from '../../components/admin/OrderStatusBadge'
import { formatPrice, formatDate } from '../../utils/formatters'

function StatCard({ icon: Icon, label, value, color = 'rose' }) {
  const colorMap = {
    rose: 'bg-rose-gold/10 text-rose-gold',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-jewel-dark">{value}</p>
        <p className="text-sm text-jewel-muted">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [allOrders, allProducts] = await Promise.all([getAllOrders(), getProducts()])
        setOrders(allOrders)
        setProducts(allProducts)
      } catch (err) {
        console.error('Dashboard load error', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const recentOrders = orders.slice(0, 10)
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) <= 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif text-jewel-dark">Dashboard</h1>
        <p className="text-jewel-muted text-sm mt-0.5">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} color="rose" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={formatPrice(totalRevenue)} color="green" />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} color="amber" />
        <StatCard icon={Package} label="Total Products" value={products.length} color="blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-jewel-dark">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="text-center text-jewel-muted py-10 text-sm">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-jewel-muted uppercase tracking-wide">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-jewel-muted uppercase tracking-wide">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-jewel-muted uppercase tracking-wide">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-jewel-muted uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-jewel-muted uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-jewel-muted">
                        #{order.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-jewel-dark">
                        {order.address?.name || order.customerName || order.phone || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-jewel-dark">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-jewel-muted">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-jewel-dark">Low Stock</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-center text-jewel-muted py-10 text-sm">All products well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.media?.[0]?.url ? (
                      <img src={p.media[0].url} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                    )}
                    <span className="text-sm text-jewel-dark truncate">{p.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {p.stock === 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
