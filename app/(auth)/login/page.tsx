'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SiteSettings {
  logo: string
  site_name?: string
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logo: '', site_name: '' })
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResendSuccess(false)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Check if user needs to confirm email
        if (signInError.message.includes('Email not confirmed') || signInError.message.includes('confirm')) {
          setError('Please confirm your email address before logging in. Check your inbox for the confirmation link or request a new one.')
          setLoading(false)
          return
        } else {
          throw signInError
        }
      }

      // If no user data, show error
      if (!data.user) {
        setError('Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      if (data.user) {
        // Try to get or create profile
        let profile = null
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile read error:', profileError)
          } else if (profileData) {
            profile = profileData
          }
        } catch (profileErr) {
          console.error('Profile error:', profileErr)
        }

        // Create profile if it doesn't exist
        if (!profile) {
          try {
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email || '',
                full_name: data.user.user_metadata?.full_name || null,
                role: 'customer'
              }, { onConflict: 'id' })

            if (upsertError) {
              console.error('Profile upsert error:', upsertError)
            }
          } catch (upsertErr) {
            console.error('Profile upsert error:', upsertErr)
          }
        }

        // Get updated profile
        const { data: finalProfile, error: finalProfileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (finalProfileError) {
          console.error('Final profile fetch error:', finalProfileError)
          // Use user_metadata role as fallback
          const metadataRole = data.user.user_metadata?.role
          if (metadataRole === 'admin' || metadataRole === 'superadmin') {
            window.location.href = '/admin/dashboard'
          } else {
            window.location.href = '/'
          }
          return
        }

        if (finalProfile?.role === 'admin' || finalProfile?.role === 'superadmin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/'
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    
    setResendLoading(true)
    setError(null)
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      
      if (resendError) throw resendError
      
      setResendSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email')
    } finally {
      setResendLoading(false)
    }
  }

  // Check for verification success or errors in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')
    const errorParam = params.get('error')
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in to your account.')
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/login')
    }
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  // Fetch site settings
  useEffect(() => {
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

    fetchSiteSettings()
  }, [supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center">
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

          <h2 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Or{' '}
            <Link href="/register" className="font-medium text-black hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
              {error.includes('confirm') && email && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="mt-2 text-black font-semibold hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : resendSuccess ? 'Confirmation email sent!' : 'Resend confirmation email'}
                </button>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="font-medium text-black hover:underline">
              Terms and Conditions
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}