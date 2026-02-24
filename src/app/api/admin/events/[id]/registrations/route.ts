// src/app/api/admin/events/[id]/registrations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

// GET /api/admin/events/:id/registrations - Get all registrations for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: parseInt(params.id) },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(registrations)
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    )
  }
}
