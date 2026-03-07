'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface AdminLink {
  href: string
  label: string
  icon: string
}

const adminLinks: AdminLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '👕' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/social-media', label: 'Social Media', icon: '🔗' },
  { href: '/admin/content', label: 'Content Pages', icon: '📝' },
  { href: '/admin/site-settings', label: 'Site Settings', icon: '⚙️' },
]

const supabase = createClient()

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logo, setLogo] = useState<string>('')
  const [footerLogo, setFooterLogo] = useState<string>('')
  const [siteName, setSiteName] = useState<string>('Agape Gear')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        router.push('/admin/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    // Fetch site settings for footer logo
    const fetchSiteSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['logo', 'footer_logo', 'site_name'])

      if (data) {
        data.forEach((item: { key: string; value: string }) => {
          if (item.key === 'logo' && item.value) {
            setLogo(item.value)
          }
          if (item.key === 'footer_logo' && item.value) {
            setFooterLogo(item.value)
          }
          if (item.key === 'site_name' && item.value) {
            setSiteName(item.value)
          }
        })
      }
    }

    checkAdmin()
    fetchSiteSettings()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">Agape Admin</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
        >
          ☰
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <h1 className="text-2xl font-bold">Agape Admin</h1>
            <p className="text-gray-400 text-sm mt-1">E-commerce Dashboard</p>
          </div>
          
          <nav className="mt-6">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-6 py-3 hover:bg-gray-800 transition-colors ${
                  pathname === link.href ? 'bg-gray-800 border-l-4 border-white' : ''
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Admin Panel</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
            <a href="/" className="block mt-3 text-sm text-gray-400 hover:text-white">
              ← Back to Store
            </a>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-8">
          {children}
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {footerLogo || logo ? (
              <img src={footerLogo || logo} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold text-gray-900">{siteName}</span>
            )}
            <span className="text-sm text-gray-500">Admin Panel</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
