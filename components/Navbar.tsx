'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]
}

interface SocialMedia {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

interface SiteSettings {
  logo: string
  site_name: string
}

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logo: '', site_name: '' })
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Hide Navbar on admin pages and auth pages
  const isAdminPage = pathname?.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setRole(profile.role)
        }
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session?.user) {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (data) {
        // Organize categories into parent/children structure
        const parentCategories = data.filter(c => !c.parent_id)
        const childCategories = data.filter(c => c.parent_id)

        const categoriesWithChildren = parentCategories.map(parent => ({
          ...parent,
          children: childCategories.filter(child => child.parent_id === parent.id)
        }))

        setCategories(categoriesWithChildren)
      }
    }

    fetchCategories()
  }, [supabase])

  // Fetch social media
  useEffect(() => {
    const fetchSocialMedia = async () => {
      const { data } = await supabase
        .from('social_media')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (data) {
        setSocialMedia(data)
      }
    }

    const fetchSiteSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['logo', 'site_name'])

      if (data) {
        const settings: SiteSettings = { logo: '', site_name: '' }
        data.forEach((item: { key: string; value: string }) => {
          if (item.key === 'logo') settings.logo = item.value || ''
          if (item.key === 'site_name') settings.site_name = item.value || ''
        })
        setSiteSettings(settings)
      }
    }

    fetchSocialMedia()
    fetchSiteSettings()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setSidebarOpen(false)
  }

  const toggleCategory = (categoryId: string) => {
    setOpenDropdown(openDropdown === categoryId ? null : categoryId)
  }

  const getSocialIcon = (icon: string) => {
    switch (icon) {
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )
      case 'instagram':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        )
      case 'twitter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        )
      case 'youtube':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        )
      case 'tiktok':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
    }
  }

  if (isAdminPage || isAuthPage) {
    return null
  }

  return (
    <>
      {/* DESKTOP NAVBAR - Visible on md and above */}
      <nav className="bg-white text-gray-900 hidden md:block border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              {siteSettings.logo ? (
                <img
                  src={siteSettings.logo}
                  alt={siteSettings.site_name || 'Agape Gear'}
                  className="h-30 w-auto object-contain"
                />
              ) : (
                <span className="text-xl font-bold">
                  {siteSettings.site_name || 'AGAPE GEAR'}
                </span>
              )}
            </Link>

            {/* Nav Links */}
            <div className="flex items-baseline space-x-6">

              {/* Each parent category as a menu item */}
              {categories.map((category) => (
                <div key={category.id} className="relative group">
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="hover:text-red-600 text-black transition-colors px-2 py-2 rounded-md text-md font-semibold flex items-center gap-1 uppercase"
                  >
                    {category.name}
                    {category.children && category.children.length > 0 && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {/* Dropdown for this category */}
                  {category.children && category.children.length > 0 && (
                    <div className="absolute left-0 top-full mt-0 w-48 bg-white text-gray-900 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            className="block px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 uppercase"
                          >
                            {child.name.replace(/^(Men|Women)\s+/, '')}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}


            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Search Form */}
              <form action="/products" method="GET" className="hidden lg:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search products..."
                    className="w-52 xl:w-64 pl-10 pr-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  />

                  {/* Icon Inside Input */}
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </form>

              <Link href="/cart" className="hover:text-red-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>

              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                  {/* Dropdown menu */}
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false)
                          handleLogout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hover:text-red-600 transition-colors flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE NAVBAR - Only visible on small screens */}
      <nav className="bg-white/95 backdrop-blur-sm text-gray-900 md:hidden fixed w-full z-50 border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            {siteSettings.logo ? (
              <img
                src={siteSettings.logo}
                alt={siteSettings.site_name || 'Agape Gear'}
                className="h-22 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-bold">
                {siteSettings.site_name || 'AGAPE GEAR'}
              </span>
            )}
          </Link>

          {/* Right Icons */}
          <div className="flex items-center space-x-1">
            {/* Search Icon - Opens Modal */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Cart Icon */}
            <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-20 z-50 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white text-gray-900 z-50 md:hidden transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 ${sidebarOpen ? 'animate-slide-in' : ''}`}>
          {siteSettings.logo ? (
            <img
              src={siteSettings.logo}
              alt={siteSettings.site_name || 'Agape Gear'}
              className="h-20 w-auto object-contain"
            />
          ) : (
            <span className="text-2xl font-bold">
              {siteSettings.site_name || 'AGAPE GEAR'}
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-2 space-y-4" style={{ height: 'calc(100% - 280px)' }}>

          {/* Categories Section */}
          <div className={`pt-4 ${sidebarOpen ? 'animate-fade-in' : ''}`}>

            {categories.map((category, index) => (
              <div
                key={category.id}
                className={`mt-2 ${index < categories.length - 1 ? 'border-b border-gray-200 pb-2' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/products?category=${category.slug}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex-1"
                  >
                    <div className="p-3 hover:bg-gray-100 rounded-lg group">
                      <span className="text-lg font-medium group-hover:text-red-600 transition-colors uppercase">
                        {category.name}
                      </span>
                    </div>
                  </Link>

                  {category.children && category.children.length > 0 && (
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-3 hover:bg-gray-100 rounded-lg"
                    >
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === category.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Subcategories - Collapsible */}
                {category.children && category.children.length > 0 && (
                  <div className={`ml-4 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${openDropdown === category.id ? 'max-h-96' : 'max-h-0'}`}>
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/products?category=${child.slug}`}
                        onClick={() => setSidebarOpen(false)}
                        className="block"
                      >
                        <div className="flex items-center p-2 hover:bg-gray-100 rounded-lg group">
                          <span className="text-sm font-semibold text-black group-hover:text-red-600 transition-colors uppercase">
                            {child.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Account Section */}
          <div className={`pt-4 mt-4 border-t border-gray-200 ${sidebarOpen ? 'animate-fade-in' : ''}`}>
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="block"
                >
                  <div className="p-3 hover:bg-gray-100 rounded-lg group flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors uppercase">
                      My Profile
                    </span>
                  </div>
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setSidebarOpen(false)}
                  className="block"
                >
                  <div className="p-3 hover:bg-gray-100 rounded-lg group flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors uppercase">
                      My Orders
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setSidebarOpen(false)
                    handleLogout()
                  }}
                  className="block w-full text-left"
                >
                  <div className="p-3 hover:bg-gray-100 rounded-lg group flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors uppercase">
                      Sign Out
                    </span>
                  </div>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setSidebarOpen(false)}
                className="block"
              >
                <div className="p-3 hover:bg-gray-100 rounded-lg group flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors uppercase">
                    Account
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Social Media Section */}
          {socialMedia.length > 0 && (
            <div className={`pt-4 mt-4 border-t border-gray-200 ${sidebarOpen ? 'animate-fade-in' : ''}`}>
              {/* <div className="p-3">
                <span className="text-sm font-semibold text-gray-500 uppercase">Follow Us</span>
              </div> */}

              <div className="flex items-center space-x-4 px-3">
                {socialMedia.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                  >
                    {getSocialIcon(social.icon)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>

      {/* No spacer needed for fixed nav - handled by page layout */}

      {/* Search Modal - Mobile */}
      {searchModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 opacity-80 z-50 md:hidden"
            onClick={() => setSearchModalOpen(false)}
          />
          {/* Modal */}
          <div className="fixed top-20 left-4 right-4 z-50 md:hidden">
            <form action="/products" method="GET" className="bg-white rounded-lg shadow-xl p-4">
              <div className="flex items-center">
                <input
                  type="text"
                  name="search"
                  placeholder="Search"
                  autoFocus
                  className="flex-1 px-4 py-3 text-base border border-gray-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-3 text-black rounded-r-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="mt-3 w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}

