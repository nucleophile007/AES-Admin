import { NextRequest } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"

// DELETE - Delete mentor
export async function DELETE(
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

    await prisma.mentor.delete({
      where: { id: mentorId }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting mentor:", error)
    return Response.json({ error: "Failed to delete mentor" }, { status: 500 })
  }
}
