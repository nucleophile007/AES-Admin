// src/app/api/admin/events/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/publish - Publish event to website
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.generalEvent.update({
      where: { id: parseInt(params.id) },
      data: {
        isPublished: true,
        publishedBy: session.user.email,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Event published successfully",
      event,
    })
  } catch (error) {
    console.error("Error publishing event:", error)
    return NextResponse.json(
      { error: "Failed to publish event" },
      { status: 500 }
    )
  }
}
