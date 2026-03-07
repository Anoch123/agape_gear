// app/api/register/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, emailTemplates } from '@/lib/email'

// Create admin client with service role key (bypasses RLS and email confirmation)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Create user with Supabase Admin API
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'customer',
        verificationToken: verificationToken,
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)

      if (
        createError.message?.includes('already been registered') ||
        createError.message?.includes('already exists') ||
        createError.code === '23505'
      ) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    if (!user.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.user.id,
        email: email,
        full_name: fullName,
        role: 'customer',
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Continue anyway - user is created
    }

    // Send custom verification email
    const template = emailTemplates.customerVerifyEmail(fullName, verificationToken)

    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
      },
      verificationToken,
    })
  } catch (error: any) {
    console.error('Error in register API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}