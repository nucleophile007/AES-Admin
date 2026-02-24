// src/app/api/admin/events/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/duplicate - Duplicate an event
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const originalEvent = await prisma.generalEvent.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!originalEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Create duplicate with "Copy of" prefix and unpublished
    const duplicateEvent = await prisma.generalEvent.create({
      data: {
        title: `Copy of ${originalEvent.title}`,
        description: originalEvent.description,
        category: originalEvent.category,
        eventDate: originalEvent.eventDate,
        eventTime: originalEvent.eventTime,
        location: originalEvent.location,
        image: originalEvent.image,
        maxParticipants: originalEvent.maxParticipants,
        registrationDeadline: originalEvent.registrationDeadline,
        status: "upcoming",
        isPublished: false, // Duplicates start as draft
        isFeatured: false,
        targetAudience: originalEvent.targetAudience,
        requirements: originalEvent.requirements,
        agenda: originalEvent.agenda,
        speakers: originalEvent.speakers as any,
        tags: originalEvent.tags,
        contactEmail: originalEvent.contactEmail,
        contactPhone: originalEvent.contactPhone,
        registrationFormConfig: originalEvent.registrationFormConfig as any,
        customFields: originalEvent.customFields as any,
        registrationFee: originalEvent.registrationFee,
        earlyBirdFee: originalEvent.earlyBirdFee,
        earlyBirdDeadline: originalEvent.earlyBirdDeadline,
        requiresPayment: originalEvent.requiresPayment,
        createdBy: session.user.email,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Event duplicated successfully",
      event: duplicateEvent,
    })
  } catch (error) {
    console.error("Error duplicating event:", error)
    return NextResponse.json(
      { error: "Failed to duplicate event" },
      { status: 500 }
    )
  }
}
