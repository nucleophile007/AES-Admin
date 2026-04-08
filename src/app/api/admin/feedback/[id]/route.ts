import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// PATCH /api/admin/feedback/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const { status, response } = await request.json()
    
    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id }
    })

    if (!existingFeedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === "reviewed" || status === "resolved") {
        updateData.reviewedAt = new Date()
      }
    }
    if (response !== undefined) {
      updateData.response = response
    }

    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ feedback: updatedFeedback }, { status: 200 })
  } catch (error) {
    console.error("Failed to update feedback:", error)
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 })
  }
}

