// src/app/api/admin/events/[id]/unpublish/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/unpublish - Remove event from website
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
        isPublished: false,
        isFeatured: false, // Also unfeature when unpublishing
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Event unpublished successfully",
      event,
    })
  } catch (error) {
    console.error("Error unpublishing event:", error)
    return NextResponse.json(
      { error: "Failed to unpublish event" },
      { status: 500 }
    )
  }
}
