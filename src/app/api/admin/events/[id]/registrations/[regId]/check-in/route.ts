// src/app/api/admin/events/[id]/registrations/[regId]/check-in/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/registrations/:regId/check-in - Check-in attendee
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, regId } = await params

    const registration = await prisma.eventRegistration.update({
      where: { id: parseInt(regId) },
      data: {
        attendanceConfirmed: true,
        checkedInAt: new Date(),
        registrationStatus: "attended",
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Attendee checked in successfully",
      registration,
    })
  } catch (error) {
    console.error("Error checking in attendee:", error)
    return NextResponse.json(
      { error: "Failed to check in attendee" },
      { status: 500 }
    )
  }
}
