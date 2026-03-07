import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=Invalid verification link`)
  }

  try {
    // The verification token should be validated against the user's record
    // Since we're using custom tokens, we need to verify through Supabase Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the user by checking their metadata for the verification token
    // First, get all users (in production, you'd want a better approach)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.redirect(`${origin}/login?error=Verification failed`)
    }

    // Find user with matching verification token in metadata
    // Note: In production, you should store the token in a dedicated table
    const user = users.users.find(u => 
      u.user_metadata?.verificationToken === token
    )

    if (!user) {
      console.log('No user found with token:', token)
      return NextResponse.redirect(`${origin}/login?error=Invalid or expired verification link`)
    }

    // Update user to mark email as verified (if not already)
    if (!user.email_confirmed_at) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      )

      if (updateError) {
        console.error('Error confirming email:', updateError)
        return NextResponse.redirect(`${origin}/login?error=Verification failed`)
      }
    }

    // Success - redirect to login with success message
    return NextResponse.redirect(`${origin}/login?verified=true`)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(`${origin}/login?error=Verification failed`)
  }
}
