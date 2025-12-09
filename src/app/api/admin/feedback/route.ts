import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/feedback
export async function GET(request: NextRequest) {
  // Verify admin permissions
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // Filter by status: new, reviewed, resolved

    const where = status && status !== "all" ? { status } : {}

    // Get all feedback from the database
    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    })
    
    return NextResponse.json({ feedback }, { status: 200 })
  } catch (error) {
    console.error("Failed to get feedback:", error)
    return NextResponse.json({ error: "Failed to get feedback" }, { status: 500 })
  }
}

