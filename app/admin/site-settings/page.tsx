'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface SiteSettings {
  logo: string
  footer_logo: string
  site_name: string
  site_description: string
  hero_title: string
  hero_subtitle: string
  hero_image: string
  mobile_hero_image: string
  hero_cta_text: string
  hero_cta_link: string
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    logo: '',
    footer_logo: '',
    site_name: '',
    site_description: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    mobile_hero_image: '',
    hero_cta_text: '',
    hero_cta_link: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
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

      fetchSettings()
    }

    checkAuth()
  }, [supabase, router])

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')

    if (!error && data) {
      const settingsMap: SiteSettings = {
        logo: '',
        footer_logo: '',
        site_name: '',
        site_description: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image: '',
        mobile_hero_image: '',
        hero_cta_text: '',
        hero_cta_link: ''
      }
      
      data.forEach((item: { key: string; value: string }) => {
        if (item.key in settingsMap) {
          settingsMap[item.key as keyof SiteSettings] = item.value || ''
        }
      })
      
      setSettings(settingsMap)
    }
    setLoading(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      setSettings(prev => ({ ...prev, logo: publicUrl }))
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Error uploading logo. Please try again.' })
    }
    setUploading(false)
  }

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `hero_${Date.now()}.${file.name.split('.').pop()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      setSettings(prev => ({ ...prev, hero_image: publicUrl }))
      setMessage({ type: 'success', text: 'Hero image uploaded successfully!' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Error uploading hero image. Please try again.' })
    }
    setUploading(false)
  }

  const handleMobileHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `mobile_hero_${Date.now()}.${file.name.split('.').pop()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      setSettings(prev => ({ ...prev, mobile_hero_image: publicUrl }))
      setMessage({ type: 'success', text: 'Mobile hero image uploaded successfully!' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Error uploading mobile hero image. Please try again.' })
    }
    setUploading(false)
  }

  const handleFooterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `footer_logo_${Date.now()}.${file.name.split('.').pop()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName)

      setSettings(prev => ({ ...prev, footer_logo: publicUrl }))
      setMessage({ type: 'success', text: 'Footer logo uploaded successfully!' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Error uploading footer logo. Please try again.' })
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const settingsToSave = [
        { key: 'logo', value: settings.logo },
        { key: 'footer_logo', value: settings.footer_logo },
        { key: 'site_name', value: settings.site_name },
        { key: 'site_description', value: settings.site_description },
        { key: 'hero_title', value: settings.hero_title },
        { key: 'hero_subtitle', value: settings.hero_subtitle },
        { key: 'hero_image', value: settings.hero_image },
        { key: 'mobile_hero_image', value: settings.mobile_hero_image },
        { key: 'hero_cta_text', value: settings.hero_cta_text },
        { key: 'hero_cta_link', value: settings.hero_cta_link }
      ]

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Error saving settings. Please try again.' })
    }

    setSaving(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Logo Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Logo</h2>
            <div className="flex items-start gap-6">
              {/* Current Logo Preview */}
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt="Current Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No logo uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload New Logo</span>
                  <span className="text-xs text-gray-500 block mt-1">Recommended: 200x80px, PNG or JPG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="mt-2 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50"
                  />
                </label>
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
                {settings.logo && (
                  <p className="mt-2 text-xs text-gray-500">
                    Current: {settings.logo.split('/').pop()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Logo Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Footer Logo</h2>
            <div className="flex items-start gap-6">
              {/* Current Footer Logo Preview */}
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {settings.footer_logo ? (
                  <img 
                    src={settings.footer_logo} 
                    alt="Current Footer Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No footer logo uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload Footer Logo</span>
                  <span className="text-xs text-gray-500 block mt-1">Recommended: 200x80px, PNG or JPG (used in footer)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFooterLogoUpload}
                    disabled={uploading}
                    className="mt-2 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50"
                  />
                </label>
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
                {settings.footer_logo && (
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, footer_logo: '' }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove footer logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Site Name */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Site Name</span>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site name"
              />
            </label>
          </div>

          {/* Site Description */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Site Description</span>
              <textarea
                value={settings.site_description}
                onChange={(e) => setSettings(prev => ({ ...prev, site_description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site description"
              />
            </label>
          </div>
        </div>

        {/* Hero Section Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h2>
          
          {/* Hero Image */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Hero Image (Desktop)</h3>
            <div className="flex items-start gap-6">
              {/* Current Hero Image Preview */}
              <div className="w-64 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {settings.hero_image ? (
                  <img 
                    src={settings.hero_image} 
                    alt="Current Hero" 
                    className="max-w-full max-h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No hero image</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload Desktop Hero Image</span>
                  <span className="text-xs text-gray-500 block mt-1">Recommended: 1920x1080px, PNG or JPG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    disabled={uploading}
                    className="mt-2 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50"
                  />
                </label>
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
                {settings.hero_image && (
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, hero_image: '' }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Hero Image */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Hero Image (Mobile)</h3>
            <div className="flex items-start gap-6">
              {/* Current Mobile Hero Image Preview */}
              <div className="w-40 h-52 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                {settings.mobile_hero_image ? (
                  <img 
                    src={settings.mobile_hero_image} 
                    alt="Current Mobile Hero" 
                    className="max-w-full max-h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">No mobile hero</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Upload Mobile Hero Image</span>
                  <span className="text-xs text-gray-500 block mt-1">Recommended: 750x1000px, PNG or JPG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileHeroImageUpload}
                    disabled={uploading}
                    className="mt-2 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50"
                  />
                </label>
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
                {settings.mobile_hero_image && (
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, mobile_hero_image: '' }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Title */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hero Title</span>
              <input
                type="text"
                value={settings.hero_title}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Premium Quality Clothing"
              />
            </label>
          </div>

          {/* Hero Subtitle */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Hero Subtitle</span>
              <textarea
                value={settings.hero_subtitle}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Discover our collection of premium clothing..."
              />
            </label>
          </div>

          {/* CTA Text and Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">CTA Button Text</span>
                <input
                  type="text"
                  value={settings.hero_cta_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, hero_cta_text: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Shop Now"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">CTA Link</span>
                <input
                  type="text"
                  value={settings.hero_cta_link}
                  onChange={(e) => setSettings(prev => ({ ...prev, hero_cta_link: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., /products"
                />
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
