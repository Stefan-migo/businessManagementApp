import { Resend } from 'resend'

// Gracefully handle missing API key for development
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not configured. Email notifications will be disabled.')
}

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Email configuration
export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || 'noreply@daluzconsciente.com',
  replyTo: 'contacto@daluzconsciente.com',
  domain: process.env.NEXT_PUBLIC_APP_URL || 'https://daluzconsciente.com'
}

// Email types
export type EmailType = 
  | 'order-confirmation'
  | 'payment-success'
  | 'payment-failed'
  | 'membership-welcome'
  | 'newsletter-subscription'
  | 'contact-form'
  | 'password-reset'

// Base email interface
export interface BaseEmailData {
  to: string | string[]
  subject: string
  type: EmailType
}

// Send email utility
export async function sendEmail(data: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}) {
  // Check if Resend is configured
  if (!resend) {
    console.warn('⚠️  Resend not configured, skipping email send')
    return { success: false, error: 'Resend not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: emailConfig.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      reply_to: data.replyTo || emailConfig.replyTo,
    })

    console.log('Email sent successfully:', result.data?.id)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Batch email sending
export async function sendBatchEmails(emails: Array<{
  to: string
  subject: string
  html: string
  text?: string
}>) {
  const results = []
  
  for (const email of emails) {
    const result = await sendEmail(email)
    results.push({ email: email.to, ...result })
    
    // Add delay between emails to avoid rate limiting
    if (emails.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
} 