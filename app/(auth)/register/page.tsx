'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SiteSettings {
  logo: string
  site_name?: string
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logo: '', site_name: '' })

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Use server-side API to create user with admin privileges
      // This bypasses Supabase's email confirmation
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }
      
      setSuccess(true)
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Fetch logo + site name
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

          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">
                Create your account
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-black hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : null}

        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-lg text-sm text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold text-lg mb-2">Check your email!</p>
            <p>We've sent a confirmation link to your email address. Please click the link to activate your account.</p>
            <Link href="/login" className="inline-block mt-4 text-black font-semibold hover:underline">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>

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
                minLength={6}
                placeholder="Minimum 6 characters"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>
        )}

        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="font-medium text-black hover:underline">
                Terms and Conditions
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
