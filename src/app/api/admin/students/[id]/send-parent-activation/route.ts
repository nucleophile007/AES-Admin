import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/students/[id]/send-parent-activation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { id: paramId } = await params
    const id = parseInt(paramId, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parentAccount: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    let parentAccount = student.parentAccount ?? await prisma.parentAccount.findUnique({
      where: { email: student.parentEmail }
    })

    if (!student.parentAccount && parentAccount) {
      await prisma.student.update({
        where: { id: student.id },
        data: { parentAccountId: parentAccount.id }
      })
    }

    if (!parentAccount) {
      parentAccount = await prisma.parentAccount.create({
        data: {
          name: student.parentName,
          email: student.parentEmail,
          phone: student.parentPhone
        }
      })

      await prisma.student.update({
        where: { id: student.id },
        data: { parentAccountId: parentAccount.id }
      })
    }

    if (!parentAccount) {
      return NextResponse.json({ error: "Parent account not found for this student" }, { status: 404 })
    }

    const parentActivationToken = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)

    await prisma.activationRequest.upsert({
      where: {
        email_role: {
          email: parentAccount.email,
          role: "PARENT"
        }
      },
      update: {
        token: parentActivationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        userId: parentAccount.id
      },
      create: {
        email: parentAccount.email,
        role: "PARENT",
        token: parentActivationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        userId: parentAccount.id
      }
    })

    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000"

    const parentEmailResponse = await fetch(`${baseUrl}/api/jobs/send-activation-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: parentAccount.email,
        name: parentAccount.name || student.parentName,
        token: parentActivationToken,
        role: "PARENT"
      })
    })

    if (!parentEmailResponse.ok) {
      const errorText = await parentEmailResponse.text()
      return NextResponse.json({
        error: "Failed to send parent activation email",
        details: errorText || `Email service failed with status ${parentEmailResponse.status}`
      }, { status: 500 })
    }

    await prisma.parentAccount.update({
      where: { id: parentAccount.id },
      data: { isActivated: false }
    })

    return NextResponse.json({
      success: true,
      message: "Parent activation email sent successfully",
      parentEmail: parentAccount.email
    })
  } catch (error) {
    console.error("Failed to send parent activation email:", error)
    return NextResponse.json({
      error: "Failed to send parent activation email",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
