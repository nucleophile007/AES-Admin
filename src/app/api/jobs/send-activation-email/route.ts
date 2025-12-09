import { NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// This endpoint will be called to send activation emails
// POST /api/jobs/send-activation-email
export async function POST(request: NextRequest) {
  try {
    // Get email data from the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json({ 
        error: "Invalid JSON in request body",
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }, { status: 400 });
    }
    
    const { email, name, token, role } = body;
    
    if (!email || !name || !token || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create activation link - use USER_SITE_URL for user-facing activation page
    // This allows students/teachers to activate on a separate user site
    const userSiteUrl = (process.env.USER_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
    const activationLink = `${userSiteUrl}/auth/activate?token=${encodeURIComponent(token)}`
    
    // Build email content
    const roleDetails = {
      TEACHER: {
        noun: "Teacher",
        description: "teacher",
        portal: "teacher portal"
      },
      STUDENT: {
        noun: "Student",
        description: "student",
        portal: "student portal"
      },
      PARENT: {
        noun: "Parent",
        description: "parent/guardian",
        portal: "parent portal"
      }
    } as const

    const roleInfo = roleDetails[(role as keyof typeof roleDetails)] ?? {
      noun: "Account",
      description: "user",
      portal: "portal"
    }

    const subject = `Activate Your ${roleInfo.noun} Account`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">Welcome to Acharya Education!</h2>
        <p>Hello ${name},</p>
        <p>You have been registered as a ${roleInfo.description} in our system. To complete your registration and set your password, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Activate Your Account
          </a>
        </div>
        
        <p><strong>Important:</strong> This link will redirect you to the ${roleInfo.portal} where you can set your password and access your account.</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you can't click the button, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; background: #f3f4f6; padding: 10px; font-size: 12px;">${activationLink}</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Acharya Education Team</p>
      </div>
    `
    
    // Development mode - just log the activation info (unless email is configured)
    const hasEmailConfig = process.env.RESEND_API_KEY || process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST
    
    if (process.env.NODE_ENV !== 'production' && !hasEmailConfig) {
      console.log('\n========== ACTIVATION EMAIL (DEV MODE) ==========')
      console.log(`To: ${email} (${name})`)
      console.log(`Role: ${role}`)
      console.log(`Token: ${token}`)
      console.log(`User Site: ${userSiteUrl}`)
      console.log(`Activation Link: ${activationLink}`)
      console.log('===============================================\n')
      
      try {
        return NextResponse.json({ 
          success: true, 
          message: "Activation info logged (dev mode - no email sent)",
          dev: true,
          activationLink
        }, { status: 200 });
      } catch (responseError) {
        console.error("Failed to create JSON response:", responseError);
        // Fallback to a simpler response if JSON serialization fails
        return new NextResponse(
          JSON.stringify({ success: true, message: "Activation email logged (dev mode)" }), 
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Try to send email using Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data, error } = await resend.emails.send({
          from: 'Acharya Education <noreply@acharyatutoring.com>',
          to: email,
          subject,
          html: htmlContent
        })

        if (error) {
          console.error("Resend API error:", error)
          throw new Error(`Resend API error: ${error.message}`)
        }

        try {
          return NextResponse.json({ 
            success: true, 
            provider: "resend",
            messageId: data?.id 
          }, { status: 200 });
        } catch (responseError) {
          console.error("Failed to create Resend JSON response:", responseError);
          // Fallback to a simpler response
          return new NextResponse(
            JSON.stringify({ success: true, provider: "resend" }), 
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (resendError) {
        console.error("Failed to send email via Resend:", resendError)
        // Fall through to try Nodemailer as backup
      }
    }
    
    // Fallback to Nodemailer if Resend fails or isn't configured
    const smtpHost = process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST
    const smtpPort = process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT
    const smtpUser = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER
    const smtpPass = process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD
    const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@acharyatutoring.com'
    
    if (smtpHost && smtpUser && smtpPass) {
      try {
        console.log(`Sending email via SMTP: ${smtpHost}:${smtpPort}`)
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || '587'),
          secure: smtpPort === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        })

        const info = await transporter.sendMail({
          from: emailFrom,
          to: email,
          subject,
          html: htmlContent
        })
        
        console.log(`Email sent successfully! MessageId: ${info.messageId}`)

        try {
          return NextResponse.json({ 
            success: true, 
            provider: "nodemailer",
            messageId: info.messageId 
          }, { status: 200 });
        } catch (responseError) {
          console.error("Failed to create Nodemailer JSON response:", responseError);
          // Fallback to a simpler response
          return new NextResponse(
            JSON.stringify({ success: true, provider: "nodemailer" }), 
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (nodemailerError) {
        console.error("Failed to send email via Nodemailer:", nodemailerError)
        return NextResponse.json({ 
          error: "Failed to send email via Nodemailer", 
          details: nodemailerError instanceof Error ? nodemailerError.message : String(nodemailerError)
        }, { status: 500 })
      }
    }

    // No email provider configured, but we're in production
    console.warn("No email provider configured in production mode")
    try {
      return NextResponse.json({ 
        success: true, 
        warning: "No email provider configured, but activation link was generated",
        activationLink
      }, { status: 200 });
    } catch (responseError) {
      console.error("Failed to create warning JSON response:", responseError);
      // Fallback to a simpler response
      return new NextResponse(
        JSON.stringify({ success: true, warning: "No email provider configured" }), 
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error sending activation email:", error)
    try {
      return NextResponse.json({ 
        error: "Failed to process activation email request",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    } catch (responseError) {
      console.error("Failed to create error JSON response:", responseError);
      // Fallback to a simpler response
      return new NextResponse(
        JSON.stringify({ error: "Failed to process activation email request" }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }
}