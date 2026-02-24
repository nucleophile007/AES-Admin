// src/app/api/events/[id]/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// POST /api/events/:id/register - Register for an event (public)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    const body = await req.json()

    // Validate event exists and is published
    const event = await prisma.generalEvent.findUnique({
      where: { id: eventId, isPublished: true },
      include: {
        _count: {
          select: { EventRegistration: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if registration is open
    if (
      event.registrationDeadline &&
      new Date(event.registrationDeadline) < new Date()
    ) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 }
      )
    }

    // Check if event is full
    if (
      event.maxParticipants &&
      event._count.EventRegistration >= event.maxParticipants
    ) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Calculate payment amount
    let paymentAmount = event.registrationFee || 0
    if (
      event.earlyBirdFee &&
      event.earlyBirdDeadline &&
      new Date(event.earlyBirdDeadline) > new Date()
    ) {
      paymentAmount = event.earlyBirdFee
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        studentName: body.studentName,
        studentEmail: body.studentEmail,
        studentPhone: body.studentPhone || null,
        studentGrade: body.studentGrade || null,
        schoolName: body.schoolName || null,
        parentName: body.parentName,
        parentEmail: body.parentEmail,
        parentPhone: body.parentPhone || null,
        specialRequirements: body.specialRequirements || null,
        howDidYouHear: body.howDidYouHear || null,
        customFieldResponses: body.customFieldResponses || null,
        paymentAmount: event.requiresPayment ? paymentAmount : 0,
        paymentStatus: event.requiresPayment ? "pending" : "not-required",
        registrationStatus: "pending",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(
      {
        message: "Registration successful",
        registration: {
          id: registration.id,
          studentName: registration.studentName,
          studentEmail: registration.studentEmail,
          paymentAmount: registration.paymentAmount,
          paymentStatus: registration.paymentStatus,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating registration:", error)

    // Handle unique constraint violation (duplicate registration)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already registered for this event" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create registration" },
      { status: 500 }
    )
  }
}
