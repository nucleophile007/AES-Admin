// src/app/api/admin/events/[id]/registrations/[regId]/check-in/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// POST /api/admin/events/:id/registrations/:regId/check-in - Check-in attendee
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; regId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const registration = await prisma.eventRegistration.update({
      where: { id: parseInt(params.regId) },
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
