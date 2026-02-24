import nodemailer from "nodemailer"
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"

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
    const {
      email,
      name,
      researchTitle,
      researchSlug,
    } = await req.json()

    const researchUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/research/${researchSlug}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `✅ Research Access Approved | ACHARYA`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
    }
    .header {
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .badge {
      background: #16a34a;
      color: white;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: bold;
      display: inline-block;
      margin-bottom: 12px;
    }
    .content {
      padding: 30px 20px;
      color: #1e293b;
    }
    .cta {
      display: inline-block;
      margin-top: 20px;
      background-color: #facc15;
      color: #000;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
    }
    .footer {
      background-color: #1e293b;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 13px;
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      <div class="badge">ACCESS GRANTED</div>
      <h1>Research Access Approved</h1>
      <p style="color:white; opacity:0.9;">ACHARYA Research Portal</p>
    </div>

    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>

      <p>
        Your request to access the research titled:
      </p>

      <p style="font-size:18px; font-weight:bold;">
        ${researchTitle}
      </p>

      <p>
        has been <strong>approved</strong>.
      </p>

      <p>
        You can now view:
      </p>
      <ul>
        <li>📊 Full PowerPoint slides</li>
        <li>📄 Technical PDF report</li>
      </ul>

      <a href="${researchUrl}" class="cta">
        Open Research Page
      </a>

      <p style="margin-top:20px; color:#64748b;">
        Please refresh the page if it is already open.
      </p>

      <p>
        Best regards,<br />
        <strong>Team ACHARYA</strong>
      </p>
    </div>

    <div class="footer">
      <p><strong>ACHARYA Educational Services</strong></p>
      <p style="opacity:0.8;">Empowering Students • Building Futures</p>
      <p style="opacity:0.6;">© 2025 ACHARYA. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error("Research approval email failed", err)
    return Response.json({ error: "Failed" }, { status: 500 })
  }
}

export const POST = verifySignatureAppRouter(handler)
