import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Grid,
  ShoppingBag,
  Tag,
  Star,
  Settings,
  Bell,
  RotateCcw,
  Smartphone,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Grid },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/notify-requests', label: 'Notify Requests', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/preview', label: 'Preview Site', icon: Smartphone, sidebarOnly: true },
]

const BADGE_KEYS = {
  '/admin/orders': 'pendingOrders',
  '/admin/refunds': 'pendingRefunds',
}

function Badge({ count }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/**
 * Sidebar — used inside AdminLayout for desktop nav and mobile bottom tab bar.
 * Props:
 *   variant: 'sidebar' | 'bottombar'
 *   counts: { pendingOrders, pendingRefunds }
 *   onNavClick: () => void   (optional, called after a nav link is clicked)
 */
export default function Sidebar({ variant = 'sidebar', counts = {}, onNavClick }) {
  if (variant === 'bottombar') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-1 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.filter((item) => !item.sidebarOnly).map(({ to, label, icon: Icon }) => {
          const badgeCount = counts[BADGE_KEYS[to]] || 0
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavClick}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-rose-gold' : 'text-jewel-muted hover:text-jewel-dark'
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const badgeCount = counts[BADGE_KEYS[to]] || 0
        return (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-rose-gold text-white shadow-sm'
                  : 'text-jewel-muted hover:bg-blush hover:text-jewel-dark'
              }`
            }
          >
            <Icon size={18} />
            {label}
            <Badge count={badgeCount} />
          </NavLink>
        )
      })}
    </nav>
  )
}
