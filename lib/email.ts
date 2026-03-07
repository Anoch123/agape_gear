import nodemailer from "nodemailer"

// Helper to check if SMTP is properly configured
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER)
}

// Create transporter using environment variables
// For Gmail, use: host = "smtp.gmail.com" and port = 465
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST?.replace(/['"]/g, '') || "",
  port: parseInt((process.env.SMTP_PORT || "465").replace(/['"]/g, '')),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === '465' || process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER?.replace(/['"]/g, '') || "",
    pass: process.env.SMTP_PASSWORD?.replace(/['"]/g, '') || "",
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Skip email if SMTP not configured
    if (!isSmtpConfigured()) {
      console.log("SMTP not configured - skipping email send. Would send to:", to)
      console.log("SMTP_HOST:", process.env.SMTP_HOST)
      console.log("SMTP_USER:", process.env.SMTP_USER)
      return { success: true }
    }

    // Verify connection before sending
    console.log("Verifying SMTP connection...")
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST?.replace(/['"]/g, ''),
      port: process.env.SMTP_PORT?.replace(/['"]/g, ''),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER?.replace(/['"]/g, ''),
    })
    
    await transporter.verify()
    console.log("SMTP connection verified")

    // Send the email
    await transporter.sendMail({
      from: (process.env.SMTP_FROM || process.env.SMTP_USER || '').replace(/['"]/g, ''),
      to,
      subject,
      html,
    })

    console.log(`Email sent successfully to: ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error("Email sending failed:", error)
    console.error("Error message:", error.message)
    console.error("Error code:", error.code)
    return { success: false, error: error.message || error }
  }
}

// Email templates
export const emailTemplates = {
  
  // Employee verification (existing)
  verifyEmail: (employeeName: string, email: string, tempPassword: string) => ({
    subject: `Welcome to Agape Gear. Please Verify Your Email, ${employeeName}!`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>Welcome to Agape Gear! Please verify your email address by clicking the link below:</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?email=${encodeURIComponent(email)}">Verify Email</a></p>
      <p>Your temporary password is: <strong>${tempPassword}</strong></p>
      <p>Please change your password after logging in for the first time.</p>
      <p>Best regards,<br/>The Agape Gear Team</p>
    `,
  }),

  // Customer verification (new - for customer registration)
  customerVerifyEmail: (customerName: string, verificationToken: string) => ({
    subject: `Welcome to Agape Gear! Please Verify Your Email`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #000; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Agape Gear</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${customerName},</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for registering with Agape Gear! We're excited to have you as a customer.
          </p>
          <p style="color: #555; line-height: 1.6;">
            Please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}" 
               style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #555; line-height: 1.6;">
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            <span style="color: #007bff;">${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}</span>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you didn't create an account with Agape Gear, please ignore this email.
          </p>
        </div>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Agape Gear. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }),
}
