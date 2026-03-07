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

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        // Check user role - try direct query first
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist, try to create it
        if (!profile || profileError) {
          // Try to create profile manually
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || null,
              role: 'customer'
            }, { onConflict: 'id' })
            .select('role')
            .single()
          
          if (newProfile) {
            profile = newProfile
          } else {
            // If still no profile, try to fetch again
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single()
            
            if (retryProfile) {
              profile = retryProfile
            }
          }
        }

        // If still no profile, show setup instructions
        if (!profile) {
          await supabase.auth.signOut()
          throw new Error('Profile not found. Please contact administrator to set up your account. Make sure you have completed email verification.')
        }

        if (profile?.role === 'admin' || profile?.role === 'superadmin') {
          router.push('/admin/dashboard')
        } else {
          // Sign out if not admin
          await supabase.auth.signOut()
          throw new Error('You do not have admin access. Please contact the administrator to request admin privileges.')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your admin credentials
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:z-10 sm:text-sm"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Admin Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-sm text-gray-400 hover:text-white">
              ← Back to Customer Login
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
