import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid parent ID" }, { status: 400 })

    const parent = await prisma.parentAccount.findUnique({ where: { id } })
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 })

    const token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    await prisma.activationRequest.upsert({
      where: { email_role: { email: parent.email, role: "PARENT" } },
      update: { token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), isUsed: false, userId: parent.id },
      create: { email: parent.email, role: "PARENT", token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), userId: parent.id },
    })

    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const response = await fetch(`${protocol}://${host || "localhost:3000"}/api/jobs/send-activation-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: parent.email, name: parent.name, token, role: "PARENT" }),
    })
    if (!response.ok) return NextResponse.json({ error: "Failed to send parent activation email" }, { status: 500 })

    await prisma.parentAccount.update({ where: { id }, data: { isActivated: false } })
    return NextResponse.json({ success: true, message: "Parent activation email sent successfully" })
  } catch (error) {
    console.error("Failed to resend parent activation:", error)
    return NextResponse.json({ error: "Failed to resend parent activation" }, { status: 500 })
  }
}
