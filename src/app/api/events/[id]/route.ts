// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/events/:id - Get single published event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.generalEvent.findUnique({
      where: {
        id: parseInt(id),
        isPublished: true, // Only published events
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        eventDate: true,
        eventTime: true,
        location: true,
        image: true,
        maxParticipants: true,
        registrationDeadline: true,
        targetAudience: true,
        requirements: true,
        agenda: true,
        speakers: true,
        tags: true,
        contactEmail: true,
        contactPhone: true,
        registrationFee: true,
        earlyBirdFee: true,
        earlyBirdDeadline: true,
        requiresPayment: true,
        isFeatured: true,
        customFields: true,
        registrationFormConfig: true,
        _count: {
          select: {
            EventRegistration: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if registration is open
    const now = new Date()
    const registrationOpen = event.registrationDeadline
      ? new Date(event.registrationDeadline) > now
      : true

    const isFull =
      event.maxParticipants !== null &&
      event._count.EventRegistration >= event.maxParticipants

    return NextResponse.json({
      ...event,
      registrationCount: event._count.EventRegistration,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.EventRegistration
        : null,
      isFull,
      registrationOpen: registrationOpen && !isFull,
    })
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}
