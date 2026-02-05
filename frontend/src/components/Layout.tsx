import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Package, ShoppingCart } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">EM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EVENT MANAGER</h1>
                <p className="text-xs text-gray-500">Fior d'Acqua</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <NavLink to="/dashboard">
              <div className="flex items-center gap-2 px-3 py-4">
                <LayoutDashboard size={20} />
                <span className="font-medium">Dashboard</span>
              </div>
            </NavLink>

            <NavLink to="/clienti">
              <div className="flex items-center gap-2 px-3 py-4">
                <Users size={20} />
                <span className="font-medium">Clienti</span>
              </div>
            </NavLink>

            <NavLink to="/prodotti">
              <div className="flex items-center gap-2 px-3 py-4">
                <Package size={20} />
                <span className="font-medium">Prodotti</span>
              </div>
            </NavLink>

            <NavLink to="/ordini">
              <div className="flex items-center gap-2 px-3 py-4">
                <ShoppingCart size={20} />
                <span className="font-medium">Ordini</span>
              </div>
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Fior d'Acqua - EVENT MANAGER
          </p>
        </div>
      </footer>
    </div>
  )
}