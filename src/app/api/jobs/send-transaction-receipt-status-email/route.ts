import { NextRequest, NextResponse } from "next/server"
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// POST /api/jobs/send-transaction-receipt-status-email
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
    
    const { email, parentName, amount, transactionDate, transactionId, status, adminNotes } = body;
    
    if (!email || !parentName || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Build email content based on status
    const isVerified = status === "verified"
    const subject = isVerified 
      ? `Transaction Receipt Verified - Payment of $${amount}`
      : `Transaction Receipt Rejected - Payment of $${amount}`
    
    const statusColor = isVerified ? "#10b981" : "#ef4444"
    const statusIcon = isVerified ? "✅" : "❌"
    const statusText = isVerified ? "Verified" : "Rejected"
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .status-box {
            background-color: ${isVerified ? '#d1fae5' : '#fee2e2'};
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid ${statusColor};
            border-radius: 4px;
            text-align: center;
          }
          .status-box h2 {
            margin: 0;
            color: ${statusColor};
            font-size: 24px;
          }
          .info-box {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
          }
          .info-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #4b5563;
          }
          .value {
            color: #1f2937;
          }
          .amount {
            color: #059669;
            font-weight: bold;
            font-size: 18px;
          }
          .admin-notes {
            background-color: #fef3c7;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .contact-info {
            background-color: #dbeafe;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Acharya Education</h1>
            <p style="margin: 10px 0 0 0;">Transaction Receipt Status Update</p>
          </div>
          
          <div class="content">
            <p>Dear ${parentName},</p>
            
            <div class="status-box">
              <h2>${statusIcon} ${statusText}</h2>
              <p style="margin: 10px 0 0 0; color: #4b5563;">
                Your transaction receipt has been ${status === "verified" ? "verified and approved" : "rejected"}
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1e40af;">Transaction Details:</h3>
              <div class="info-row">
                <span class="label">Amount:</span>
                <span class="amount">$${amount}</span>
              </div>
              <div class="info-row">
                <span class="label">Transaction Date:</span>
                <span class="value">${transactionDate}</span>
              </div>
              ${transactionId ? `
              <div class="info-row">
                <span class="label">Transaction ID:</span>
                <span class="value" style="font-family: monospace;">${transactionId}</span>
              </div>
              ` : ''}
            </div>

            ${adminNotes ? `
            <div class="admin-notes">
              <h3 style="margin-top: 0; color: #92400e;">Admin Notes:</h3>
              <p style="white-space: pre-wrap; margin: 0;">${adminNotes}</p>
            </div>
            ` : ''}

            ${status === "rejected" ? `
            <div class="contact-info">
              <h3 style="margin-top: 0; color: #1e40af;">Need Help?</h3>
              <p>If you have any questions or concerns about this rejection, please don't hesitate to contact our admin team. We're here to help resolve any issues.</p>
              <p style="margin: 10px 0 0 0;"><strong>You can reach out to the admin team to discuss this matter.</strong></p>
            </div>
            ` : `
            <p style="background-color: #d1fae5; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
              <strong>✓ Your payment has been successfully verified!</strong> Thank you for your payment. This transaction has been recorded in our system.
            </p>
            `}
            
            <p>Thank you for your continued support and trust in our programs.</p>
            
            <div class="footer">
              <p><strong>Acharya Education Team</strong></p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Development mode - just log the email info (unless email is configured)
    const hasEmailConfig = process.env.RESEND_API_KEY || process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST
    
    if (process.env.NODE_ENV !== 'production' && !hasEmailConfig) {
      console.log('\n========== TRANSACTION RECEIPT STATUS EMAIL (DEV MODE) ==========')
      console.log(`To: ${email} (${parentName})`)
      console.log(`Status: ${status}`)
      console.log(`Amount: $${amount}`)
      console.log(`Transaction Date: ${transactionDate}`)
      if (transactionId) console.log(`Transaction ID: ${transactionId}`)
      if (adminNotes) console.log(`Admin Notes: ${adminNotes}`)
      console.log('============================================================\n')
      
      return NextResponse.json({ 
        success: true, 
        message: "Transaction receipt status email logged (dev mode - no email sent)",
        dev: true
      }, { status: 200 });
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

        return NextResponse.json({ 
          success: true, 
          provider: "resend",
          messageId: data?.id 
        }, { status: 200 });
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
        console.log(`Sending transaction receipt status email via SMTP: ${smtpHost}:${smtpPort}`)
        
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
        
        console.log(`Transaction receipt status email sent successfully! MessageId: ${info.messageId}`)

        return NextResponse.json({ 
          success: true, 
          provider: "nodemailer",
          messageId: info.messageId 
        }, { status: 200 });
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
    return NextResponse.json({ 
      success: true, 
      warning: "No email provider configured, but notification was generated"
    }, { status: 200 });
  } catch (error) {
    console.error("Error sending transaction receipt status email:", error)
    return NextResponse.json({ 
      error: "Failed to process transaction receipt status email request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

