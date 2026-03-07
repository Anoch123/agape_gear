'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SocialMedia {
  id: string
  platform: string
  url: string
  icon: string
  is_active: boolean
  sort_order: number
}

export default function SocialMediaPage() {
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
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
        router.push('/')
        return
      }

      fetchSocialMedia()
    }

    checkAuth()
  }, [supabase, router])

  const fetchSocialMedia = async () => {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .order('sort_order')

    if (!error && data) {
      setSocialMedia(data)
    }
    setLoading(false)
  }

  const handleUpdate = async (id: string, field: string, value: any) => {
    const updated = socialMedia.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    )
    setSocialMedia(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      for (const item of socialMedia) {
        const { error } = await supabase
          .from('social_media')
          .update({
            platform: item.platform,
            url: item.url,
            icon: item.icon,
            is_active: item.is_active,
            sort_order: item.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Social media links updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating social media links' })
    }

    setSaving(false)
  }

  const handleAdd = async () => {
    const newItem: Omit<SocialMedia, 'id'> = {
      platform: 'New Platform',
      url: 'https://',
      icon: 'link',
      is_active: true,
      sort_order: socialMedia.length + 1
    }

    const { data, error } = await supabase
      .from('social_media')
      .insert([newItem])
      .select()
      .single()

    if (!error && data) {
      setSocialMedia([...socialMedia, data])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media link?')) return

    const { error } = await supabase
      .from('social_media')
      .delete()
      .eq('id', id)

    if (!error) {
      setSocialMedia(socialMedia.filter(item => item.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Links</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {socialMedia.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.platform}
                      onChange={(e) => handleUpdate(item.id, 'platform', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdate(item.id, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={item.icon}
                      onChange={(e) => handleUpdate(item.id, 'icon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="pinterest">Pinterest</option>
                      <option value="link">Link</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(e) => handleUpdate(item.id, 'is_active', e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.sort_order}
                      onChange={(e) => handleUpdate(item.id, 'sort_order', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {socialMedia.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No social media links yet. Click "Add New" to create one.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
