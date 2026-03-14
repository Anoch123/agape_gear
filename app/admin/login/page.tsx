'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!profile) {
          await supabase.auth.signOut()
          throw new Error('Profile not found.')
        }

        if (profile.role === 'admin' || profile.role === 'superadmin') {
          router.push('/admin/dashboard')
        } else {
          await supabase.auth.signOut()
          throw new Error('You do not have admin access.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">

      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">

          {/* Logo + Title inside card */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Agape Gear"
              className="mx-auto h-35 w-auto object-contain"
            />

            <p className="text-gray-500 text-sm mt-[-20px]">
              Sign in to access the admin dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-900 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>

            {/* Back */}
            <div className="text-center pt-2">
              <a
                href="/login"
                className="text-sm text-gray-500 hover:text-black transition"
              >
                ← Back to Customer Login
              </a>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}