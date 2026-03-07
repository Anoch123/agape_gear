'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface SocialMedia {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

const supabase = createClient()

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([])
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([])
  const [logo, setLogo] = useState<string>('')
  const [footerLogo, setFooterLogo] = useState<string>('')
  const [siteName, setSiteName] = useState<string>('AGAPE')
  const pathname = usePathname()

  // Hide Footer on admin pages and auth pages
  const isAdminPage = pathname?.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('sort_order')
      
      if (categoriesData) {
        // Only get parent categories for footer
        const parentCategories = categoriesData.filter((c: Category) => !c.parent_id)
        setCategories(parentCategories.slice(0, 6)) // Limit to 6 categories
      }

      // Fetch social media
      const { data: socialData } = await supabase
        .from('social_media')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (socialData) {
        setSocialMedia(socialData)
      }

      // Fetch site settings for logo
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['logo', 'footer_logo', 'site_name'])

      if (settingsData) {
        settingsData.forEach((item: { key: string; value: string }) => {
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

    fetchData()
  }, [])

  // Hide Footer on admin pages and auth pages
  if (isAdminPage || isAuthPage) {
    return null
  }

  const getSocialIcon = (icon: string) => {
    switch (icon) {
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        )
      case 'twitter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )
      case 'youtube':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      case 'tiktok':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
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

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="col-span-2">
            <Link href="/" className="text-2xl font-bold">
              {footerLogo || logo ? (
                <img src={footerLogo || logo} alt={siteName} className="h-16 w-auto object-contain" />
              ) : (
                siteName
              )}
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              Premium quality clothing designed for comfort and style.
            </p>
            {/* Email Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Newsletter</h4>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
            {/* Social Media */}
            {socialMedia.length > 0 && (
              <div className="flex items-center space-x-4 mt-6">
                {socialMedia.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {getSocialIcon(social.icon)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm">
                  All Products
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/products?category=${category.slug}`} 
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Make a Return
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Agape Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Policies</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <span className="block font-medium text-white">Email:</span>
                support@agapegear.com
              </li>
              <li>
                <span className="block font-medium text-white">Phone:</span>
                +94 77 123 4567
              </li>
              <li>
                <span className="block font-medium text-white">Address:</span>
                Colombo, Sri Lanka
              </li>
              <li>
                <span className="block font-medium text-white">Hours:</span>
                Mon-Fri: 9AM - 6PM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Agape Gear. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
