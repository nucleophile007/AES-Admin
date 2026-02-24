// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/events - Public endpoint to fetch published events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get("featured")
    const category = searchParams.get("category")
    const limit = searchParams.get("limit")

    const where: any = {
      isPublished: true,
      eventDate: {
        gte: new Date(), // Only future events
      },
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (category) {
      where.category = category
    }

    const events = await prisma.generalEvent.findMany({
      where,
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
      orderBy: featured === "true" ? { publishedAt: "desc" } : { eventDate: "asc" },
      take: limit ? parseInt(limit) : undefined,
    })

    // Add spots remaining to each event
    const eventsWithAvailability = events.map((event) => ({
      ...event,
      registrationCount: event._count.EventRegistration,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.EventRegistration
        : null,
      isFull:
        event.maxParticipants !== null &&
        event._count.EventRegistration >= event.maxParticipants,
    }))

    return NextResponse.json(eventsWithAvailability)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}
