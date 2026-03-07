import { NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email, name, token } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Generate verification URL with token
    const verificationToken = token || Math.random().toString(36).substring(2) + Date.now().toString(36)
    
    // Get the email template
    const template = emailTemplates.customerVerifyEmail(name, verificationToken)

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Verification email sent successfully' 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send verification email', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-verification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
