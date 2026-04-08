// src/app/api/admin/events/[id]/registrations/[regId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// PUT /api/admin/events/:id/registrations/:regId - Update registration
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { regId } = await params

    const body = await req.json()

    const registration = await prisma.eventRegistration.update({
      where: { id: parseInt(regId) },
      data: {
        ...(body.registrationStatus && {
          registrationStatus: body.registrationStatus,
        }),
        ...(body.paymentStatus && { paymentStatus: body.paymentStatus }),
        ...(body.paymentAmount !== undefined && {
          paymentAmount: body.paymentAmount,
        }),
        ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
        ...(body.certificateIssued !== undefined && {
          certificateIssued: body.certificateIssued,
        }),
        ...(body.transactionId !== undefined && {
          transactionId: body.transactionId,
        }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(registration)
  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/events/:id/registrations/:regId - Delete registration
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { regId } = await params

    await prisma.eventRegistration.delete({
      where: { id: parseInt(regId) },
    })

    return NextResponse.json({
      message: "Registration deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting registration:", error)
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    )
  }
}
