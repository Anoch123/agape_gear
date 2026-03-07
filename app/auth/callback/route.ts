import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const errorDescription = searchParams.get('error_description')

  // If there's an error from Supabase
  if (errorDescription) {
    console.error('Auth error:', errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.headers.get('cookie')?.split('; ').map(c => {
              const [key, ...v] = c.split('=')
              return { name: key, value: v.join('=') }
            }) || []
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.headers.append(
                'Set-Cookie',
                `${name}=${value}; Path=${options?.path || '/'}; HttpOnly=${
                  options?.httpOnly ? 'true' : 'false'
                }; SameSite=${options?.sameSite || 'lax'}; Max-Age=${options?.maxAge || ''}`
              )
            })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Session exchange error:', error.message)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      // Success - redirect to home or intended page
      return NextResponse.redirect(`${origin}${next}`)
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=No confirmation code provided`)
}
