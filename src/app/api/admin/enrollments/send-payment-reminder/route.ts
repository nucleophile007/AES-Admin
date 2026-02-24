import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'
import { uploadToR2 } from '@/lib/r2Upload'

// @ts-ignore - Prisma extension types
const db = prisma as any;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const enrollmentId = parseInt(formData.get('enrollmentId') as string)
    const studentId = parseInt(formData.get('studentId') as string)
    const studentEmail = formData.get('studentEmail') as string
    const parentEmail = formData.get('parentEmail') as string
    const program = formData.get('program') as string
    const subject = formData.get('subject') as string
    const paymentInfo = formData.get('paymentInfo') as string
    const amount = formData.get('amount') as string
    const dueDate = formData.get('dueDate') as string
    const file = formData.get('file') as File | null

    // Validate required fields
    if (!enrollmentId || !studentId || !parentEmail || !paymentInfo || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get student details from enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Handle file upload to R2 if file exists
    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null

    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const uniqueFileName = `payment-receipts/${timestamp}-${sanitizedName}`
        const uploadResult = await uploadToR2(buffer, uniqueFileName, file.type)
        fileUrl = uploadResult.fileUrl
        fileName = uploadResult.fileName
        fileSize = uploadResult.fileSize
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        )
      }
    }

    // Create Payment record in database
    const payment = await db.payment.create({
      data: {
        enrollmentId,
        studentId,
        studentEmail,
        studentName: enrollment.student.name || studentEmail,
        parentName: enrollment.student.parentName || 'Parent',
        parentEmail,
        parentPhone: enrollment.student.parentPhone || null,
        program,
        subject,
        paymentInfo,
        amount,
        dueDate: new Date(dueDate),
        fileUrl,
        fileName,
        fileSize,
        status: 'pending',
        sentAt: new Date(),
      },
    })

    // Format the due date
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Prepare file attachment section for email
    const fileAttachmentSection = fileUrl ? `
      <div style="background-color: #dbeafe; padding: 15px; margin: 20px 0; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #1e40af;">Attached Document:</h3>
        <p style="margin: 10px 0;">
          <a href="${fileUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: bold;">
            📎 ${fileName}
          </a>
        </p>
        <p style="margin: 0; font-size: 14px; color: #1e40af;">Click the link above to view or download the invoice/receipt.</p>
      </div>
    ` : ''

    // Prepare email content
    const emailSubject = `Payment Reminder - ${program} (${subject})`
    const emailHtml = `
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
          .payment-info {
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
          .due-date {
            color: #dc2626;
            font-weight: bold;
            font-size: 16px;
          }
          .amount {
            color: #059669;
            font-weight: bold;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">U-ACHIEVE</h1>
            <p style="margin: 10px 0 0 0;">Payment Reminder</p>
          </div>
          
          <div class="content">
            <p>Dear ${enrollment.student.parentName || 'Parent/Guardian'},</p>
            
            <p>This is a friendly reminder regarding the payment for your child's enrollment in our program.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Student:</span>
                <span class="value">${enrollment.student.name || studentEmail}</span>
              </div>
              <div class="info-row">
                <span class="label">Student Email:</span>
                <span class="value">${studentEmail}</span>
              </div>
              <div class="info-row">
                <span class="label">Program:</span>
                <span class="value">${program}</span>
              </div>
              <div class="info-row">
                <span class="label">Subject:</span>
                <span class="value">${subject}</span>
              </div>
            </div>
            
            <div class="payment-info">
              <h3 style="margin-top: 0; color: #92400e;">Payment Details:</h3>
              <div style="margin: 10px 0;">
                <span class="label">Amount:</span>
                <br>
                <span class="amount">${amount}</span>
              </div>
              <p style="white-space: pre-wrap; margin: 15px 0;">${paymentInfo}</p>
              
              <div style="margin-top: 15px;">
                <span class="label">Payment Due Date:</span>
                <br>
                <span class="due-date">${formattedDueDate}</span>
              </div>
            </div>

            ${fileAttachmentSection}
            
            <p>We kindly request that you complete the payment by the due date mentioned above to ensure uninterrupted access to the program.</p>
            
            <p>If you have already made the payment, please disregard this reminder. If you have any questions or concerns regarding this payment, please don't hesitate to contact us.</p>
            
            <p>Thank you for your continued support and trust in our programs.</p>
            
            <div class="footer">
              <p><strong>U-ACHIEVE Admin Team</strong></p>
              <p>This is an automated reminder. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      console.log('Sending payment reminder via SMTP:', smtpHost)
      
      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })

      // Send email
      const info = await transporter.sendMail({
        from: smtpFrom || smtpUser,
        to: parentEmail,
        subject: emailSubject,
        html: emailHtml,
      })

      console.log('Payment reminder email sent successfully! MessageId:', info.messageId)

      return NextResponse.json({
        message: 'Payment reminder sent successfully',
        messageId: info.messageId,
        paymentId: payment.id,
        enrollmentId,
      })
    } else {
      // Fallback: Just log the email (for development)
      console.log('SMTP not configured. Email content:')
      console.log('To:', parentEmail)
      console.log('Subject:', emailSubject)
      console.log('Body:', emailHtml)

      return NextResponse.json({
        message: 'Payment reminder logged (SMTP not configured)',
        paymentId: payment.id,
        enrollmentId,
      })
    }
  } catch (error) {
    console.error('Error sending payment reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send payment reminder' },
      { status: 500 }
    )
  }
}
