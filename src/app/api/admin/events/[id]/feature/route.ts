// src/app/api/admin/events/[id]/feature/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/feature - Feature event on homepage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const isFeatured = body.isFeatured ?? true

    // If featuring, ensure event is published
    const currentEvent = await prisma.generalEvent.findUnique({
      where: { id: parseInt(id) },
      select: { isPublished: true },
    })

    if (isFeatured && !currentEvent?.isPublished) {
      return NextResponse.json(
        { error: "Cannot feature an unpublished event" },
        { status: 400 }
      )
    }

    const event = await prisma.generalEvent.update({
      where: { id: parseInt(id) },
      data: {
        isFeatured,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: isFeatured
        ? "Event featured on homepage"
        : "Event removed from featured",
      event,
    })
  } catch (error) {
    console.error("Error featuring event:", error)
    return NextResponse.json(
      { error: "Failed to feature event" },
      { status: 500 }
    )
  }
}
