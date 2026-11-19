import nodemailer from 'nodemailer'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
})

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character))

async function handler(request: Request) {
  try {
    const {
      parentEmail,
      parentName,
      studentName,
      program,
      preferredTime,
      cancellationReason,
    } = await request.json()

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: parentEmail,
      subject: `Session Update for ${studentName} | ACHARYA`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border:1px solid #e5eaf2;border-radius:16px;overflow:hidden;">
    <div style="background:#173b8f;padding:30px 32px;color:#ffffff;">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:1.5px;font-weight:bold;">ACHARYA EDUCATIONAL SERVICES</p>
      <h1 style="margin:0;font-size:26px;line-height:1.25;">Session update</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;">Dear ${escapeHtml(parentName)},</p>
      <p style="font-size:16px;line-height:1.6;">We are writing to let you know that the requested session for <strong>${escapeHtml(studentName)}</strong> has been cancelled.</p>
      <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e5eaf2;border-radius:12px;">
        <p style="margin:0 0 12px;color:#53627a;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Session details</p>
        <p style="margin:8px 0;"><strong>Student:</strong> ${escapeHtml(studentName)}</p>
        <p style="margin:8px 0;"><strong>Program:</strong> ${escapeHtml(program)}</p>
        <p style="margin:8px 0;"><strong>Requested time:</strong> ${escapeHtml(preferredTime)}</p>
      </div>
      <div style="margin:24px 0;padding:18px 20px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;">
        <p style="margin:0 0 8px;font-weight:bold;color:#9a3412;">Reason for cancellation</p>
        <p style="margin:0;line-height:1.6;color:#4b5563;">${escapeHtml(cancellationReason || '')}</p>
      </div>
      <p style="font-size:16px;line-height:1.6;">Please reply to this email or contact our team if you would like help selecting another time.</p>
      <p style="font-size:16px;line-height:1.6;">Warm regards,<br><strong>The ACHARYA Team</strong></p>
    </div>
    <div style="padding:20px 32px;background:#172033;color:#dbe4f3;font-size:12px;line-height:1.6;">
      ACHARYA Educational Services<br>
      (209) 920-7147 · acharya.folsom@gmail.com
    </div>
  </div>
</body>
</html>`,
    })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Cancellation email job failed:', error)
    return Response.json({ error: 'Failed to send cancellation email' }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
