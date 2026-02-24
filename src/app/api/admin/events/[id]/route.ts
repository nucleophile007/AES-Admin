// src/app/api/admin/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// GET /api/admin/events/:id - Get single event with registrations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.generalEvent.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        EventRegistration: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/events/:id - Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const event = await prisma.generalEvent.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category }),
        ...(body.eventDate && { eventDate: new Date(body.eventDate) }),
        ...(body.eventTime && { eventTime: body.eventTime }),
        ...(body.location && { location: body.location }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.maxParticipants !== undefined && {
          maxParticipants: body.maxParticipants,
        }),
        ...(body.registrationDeadline !== undefined && {
          registrationDeadline: body.registrationDeadline
            ? new Date(body.registrationDeadline)
            : null,
        }),
        ...(body.status && { status: body.status }),
        ...(body.isPublished !== undefined && {
          isPublished: body.isPublished,
        }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.targetAudience !== undefined && {
          targetAudience: body.targetAudience,
        }),
        ...(body.requirements !== undefined && {
          requirements: body.requirements,
        }),
        ...(body.agenda !== undefined && { agenda: body.agenda }),
        ...(body.speakers !== undefined && { speakers: body.speakers }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.contactEmail !== undefined && {
          contactEmail: body.contactEmail,
        }),
        ...(body.contactPhone !== undefined && {
          contactPhone: body.contactPhone,
        }),
        ...(body.registrationFormConfig !== undefined && {
          registrationFormConfig: body.registrationFormConfig,
        }),
        ...(body.customFields !== undefined && {
          customFields: body.customFields,
        }),
        ...(body.registrationFee !== undefined && {
          registrationFee: body.registrationFee,
        }),
        ...(body.earlyBirdFee !== undefined && {
          earlyBirdFee: body.earlyBirdFee,
        }),
        ...(body.earlyBirdDeadline !== undefined && {
          earlyBirdDeadline: body.earlyBirdDeadline
            ? new Date(body.earlyBirdDeadline)
            : null,
        }),
        ...(body.requiresPayment !== undefined && {
          requiresPayment: body.requiresPayment,
        }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/events/:id - Delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.generalEvent.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}
