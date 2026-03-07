'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AdminLayout from '@/components/AdminLayout'

interface ContentPage {
  id: string
  title: string
  slug: string
  content: string
  page_type: string
  is_active: boolean
  sort_order: number
}

const pageTypes = [
  { value: 'about', label: 'About Us' },
  { value: 'faq', label: 'FAQ' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'returns', label: 'Returns' },
  { value: 'blog', label: 'Blog' },
  { value: 'refund', label: 'Refund Policy' },
  { value: 'shipping', label: 'Shipping Policy' },
  { value: 'terms', label: 'Terms of Service' },
  { value: 'privacy', label: 'Privacy Policy' },
  { value: 'contact', label: 'Contact' },
]

export default function ContentPagesAdmin() {
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const supabase = createClient()

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('content_pages')
      .select('*')
      .order('sort_order')

    if (data) setPages(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!editingPage) return

    setSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('content_pages')
      .update({
        title: editingPage.title,
        content: editingPage.content,
        is_active: editingPage.is_active,
        sort_order: editingPage.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingPage.id)

    if (error) {
      setMessage({ type: 'error', text: 'Error saving: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Page saved successfully!' })
      setEditingPage(null)
      fetchPages()
    }
    setSaving(false)
  }

  const handleToggleActive = async (page: ContentPage) => {
    const { error } = await supabase
      .from('content_pages')
      .update({ is_active: !page.is_active })
      .eq('id', page.id)

    if (!error) {
      fetchPages()
    }
  }

  const getPageTypeLabel = (type: string) => {
    return pageTypes.find(p => p.value === type)?.label || type
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Pages</h1>
            <p className="text-gray-600">Manage your website content pages</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-md ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Pages List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No content pages found
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPageTypeLabel(page.page_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      /{page.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        page.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingPage(page)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(page)}
                        className={`${
                          page.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {page.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit: {getPageTypeLabel(editingPage.page_type)}
                </h2>
                <button
                  onClick={() => setEditingPage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (HTML supported)
                  </label>
                  <textarea
                    value={editingPage.content || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="Enter HTML content..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can use HTML tags like h2, p, strong, ul, li, etc.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={editingPage.sort_order}
                      onChange={(e) => setEditingPage({ ...editingPage, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPage.is_active}
                        onChange={(e) => setEditingPage({ ...editingPage, is_active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setEditingPage(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
