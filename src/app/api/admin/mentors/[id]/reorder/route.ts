import { NextRequest } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"

// PATCH - Reorder mentor (move up or down)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const { id } = await context.params
    const mentorId = Number(id)
    const { direction } = await req.json()

    if (direction !== 'up' && direction !== 'down') {
      return Response.json({ error: "Invalid direction" }, { status: 400 })
    }

    const currentMentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      select: { displayOrder: true }
    })

    if (!currentMentor) {
      return Response.json({ error: "Mentor not found" }, { status: 404 })
    }

    // Find adjacent mentor
    const adjacentMentor = await prisma.mentor.findFirst({
      where: {
        displayOrder: direction === 'up' 
          ? { lt: currentMentor.displayOrder }
          : { gt: currentMentor.displayOrder }
      },
      orderBy: {
        displayOrder: direction === 'up' ? 'desc' : 'asc'
      }
    })

    if (!adjacentMentor) {
      return Response.json({ error: "Cannot move further" }, { status: 400 })
    }

    // Swap display orders
    await prisma.$transaction([
      prisma.mentor.update({
        where: { id: mentorId },
        data: { displayOrder: adjacentMentor.displayOrder }
      }),
      prisma.mentor.update({
        where: { id: adjacentMentor.id },
        data: { displayOrder: currentMentor.displayOrder }
      })
    ])

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error reordering mentor:", error)
    return Response.json({ error: "Failed to reorder mentor" }, { status: 500 })
  }
}
