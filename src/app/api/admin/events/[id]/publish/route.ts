// src/app/api/admin/events/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/publish - Publish event to website
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.generalEvent.update({
      where: { id: parseInt(id) },
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
