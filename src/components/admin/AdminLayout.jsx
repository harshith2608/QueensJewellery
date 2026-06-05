import { Outlet } from 'react-router-dom'
import { LogOut, Crown } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAdminCounts } from '../../hooks/useAdminCounts'
import toast from 'react-hot-toast'

export default function AdminLayout() {
  const { signOutAdmin } = useAdminAuth()
  const counts = useAdminCounts()

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Sign out failed')
    }
  }

  return (
    <div className="min-h-screen bg-ivory font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-rose-gold rounded-full flex items-center justify-center">
            <Crown size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-jewel-dark leading-tight font-serif">Queens Jewellery</p>
            <p className="text-[10px] text-jewel-muted">Admin Portal</p>
          </div>
        </div>

        {/* Nav links */}
        <Sidebar variant="sidebar" counts={counts} />

        {/* Sign out */}
        <div className="px-3 pb-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-gold rounded-full flex items-center justify-center">
            <Crown size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-jewel-dark font-serif">Queens Jewellery Admin</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main content */}
      <main className="md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden">
        <Sidebar variant="bottombar" counts={counts} />
      </div>
    </div>
  )
}
