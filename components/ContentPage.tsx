'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface ContentPageData {
  id: string
  title: string
  slug: string
  content: string
  page_type: string
  is_active: boolean
}

interface ContentPageProps {
  slug: string
  breadcrumbLabel: string
}

const supabase = createClient()

export default function ContentPage({ slug, breadcrumbLabel }: ContentPageProps) {
  const [page, setPage] = useState<ContentPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true)
      console.log('Fetching page for slug:', slug)
      
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      console.log('Fetch result:', data, 'error:', error)
      
      if (data) {
        setPage(data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }

    fetchPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">The page you are looking for does not exist.</p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-4">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-black">Home</Link></li>
            <li>/</li>
            <li className="text-black font-medium">{breadcrumbLabel}</li>
          </ol>
        </nav>

        <article>
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
          <div 
            className="text-gray-700 prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </article>

        {/* Contact specific - show contact form */}
        {page.slug === 'contact' && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="What is this about?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
