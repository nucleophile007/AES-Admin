import nodemailer from 'nodemailer'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function handler(req: Request) {
  try {
    const { parentEmail, parentName, studentName, program, preferredTime } = await req.json()

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: parentEmail,
      subject: `🎉 Session Approved - ${studentName} | ACHARYA`,
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .booking-details { background-color: #ecfdf5; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
        .detail-label { font-weight: bold; color: #065f46; }
        .detail-value { color: #1e293b; }
        .footer { background-color: #1e293b; color: white; padding: 20px; text-align: center; }
        .success-badge { background-color: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-badge">✅ APPROVED</div>
            <h1>Session Confirmed!</h1>
            <p style="color: white; margin: 10px 0; opacity: 0.9;">ACHARYA Educational Services</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b;">Dear ${parentName},</h2>
            
            <p>Great news! Your session request has been <strong>approved</strong>. We're excited to work with ${studentName}!</p>
            
            <div class="booking-details">
                <h3 style="color: #065f46; margin-top: 0;">📋 Session Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Student:</span>
                    <span class="detail-value">${studentName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Program:</span>
                    <span class="detail-value">${program}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Scheduled Time:</span>
                    <span class="detail-value">${preferredTime}</span>
                </div>
            </div>
            
            <p>🎯 <strong>What's Next?</strong> Our team will contact you shortly with the meeting details and any preparation materials.</p>
            
            <p>If you have any questions, please contact us:</p>
            <p>📞 <strong>(209) 920-7147</strong> | 📧 <strong>acharya.folsom@gmail.com</strong></p>
            
            <p style="color: #64748b;">Best regards,<br>
            <strong>The ACHARYA Team</strong></p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;"><strong>ACHARYA Educational Services</strong></p>
            <p style="margin: 5px 0; opacity: 0.8;">Empowering Students • Building Futures</p>
            <p style="margin: 5px 0; opacity: 0.6;">© 2025 ACHARYA Educational Services. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Approval email job failed', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
