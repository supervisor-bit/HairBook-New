'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const menuItems = [
  { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
  { icon: '👥', label: 'Klienti', href: '/clients' },
  { icon: '📦', label: 'Produkty', href: '/materials' },
  { icon: '🛒', label: 'Prodej', href: '/sales' },
  { icon: '📋', label: 'Objednávky', href: '/orders' },
  { icon: '⚙️', label: 'Nastavení', href: '/settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 shadow-lg relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none"></div>
        
        <div className="mb-8 text-3xl relative z-10 p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-glow">
          ✂️
        </div>
        
        <nav className="flex-1 flex flex-col gap-3 relative z-10">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                w-12 h-12 flex items-center justify-center rounded-xl text-2xl
                transition-all transform hover:scale-110
                ${pathname.startsWith(item.href)
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-glow'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }
              `}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
        
        <button
          onClick={handleLogout}
          className="w-12 h-12 flex items-center justify-center rounded-xl text-2xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all transform hover:scale-110 relative z-10"
          title="Odhlásit se"
        >
          🚪
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
