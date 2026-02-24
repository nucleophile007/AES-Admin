// src/app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/events - List all events with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const isPublished = searchParams.get("isPublished")
    const isFeatured = searchParams.get("isFeatured")
    const search = searchParams.get("search")

    const where: any = {}
    
    if (status) where.status = status
    if (category) where.category = category
    if (isPublished !== null) where.isPublished = isPublished === "true"
    if (isFeatured !== null) where.isFeatured = isFeatured === "true"
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const events = await prisma.generalEvent.findMany({
      where,
      include: {
        EventRegistration: {
          select: {
            id: true,
            registrationStatus: true,
            paymentStatus: true,
            paymentAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Add registration stats to each event
    const eventsWithStats = events.map((event) => {
      const registrations = event.EventRegistration
      const totalRegistrations = registrations.length
      const confirmedRegistrations = registrations.filter(
        (r) => r.registrationStatus === "confirmed"
      ).length
      const totalPayments = registrations
        .filter((r) => r.paymentStatus === "completed")
        .reduce((sum, r) => sum + (r.paymentAmount || 0), 0)
      const pendingPayments = registrations.filter(
        (r) => r.paymentStatus === "pending"
      ).length

      return {
        ...event,
        stats: {
          totalRegistrations,
          confirmedRegistrations,
          totalPayments,
          pendingPayments,
          spotsRemaining: event.maxParticipants
            ? event.maxParticipants - totalRegistrations
            : null,
        },
      }
    })

    return NextResponse.json(eventsWithStats)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

// POST /api/admin/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "category",
      "eventDate",
      "eventTime",
      "location",
    ]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const event = await prisma.generalEvent.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        eventDate: new Date(body.eventDate),
        eventTime: body.eventTime,
        location: body.location,
        image: body.image || null,
        maxParticipants: body.maxParticipants || null,
        registrationDeadline: body.registrationDeadline
          ? new Date(body.registrationDeadline)
          : null,
        status: body.status || "upcoming",
        isPublished: body.isPublished || false,
        isFeatured: body.isFeatured || false,
        targetAudience: body.targetAudience || null,
        requirements: body.requirements || null,
        agenda: body.agenda || null,
        speakers: body.speakers || null,
        tags: body.tags || [],
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        registrationFormConfig: body.registrationFormConfig || null,
        customFields: body.customFields || null,
        registrationFee: body.registrationFee || 0,
        earlyBirdFee: body.earlyBirdFee || null,
        earlyBirdDeadline: body.earlyBirdDeadline
          ? new Date(body.earlyBirdDeadline)
          : null,
        requiresPayment: body.requiresPayment || false,
        createdBy: session.user.email,
        publishedBy: body.isPublished ? session.user.email : null,
        publishedAt: body.isPublished ? new Date() : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}
