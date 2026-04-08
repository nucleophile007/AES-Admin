import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params

    const research = await prisma.research.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        published: true,
      },
    })

    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 })
    }

    const requests = await prisma.accessRequest.findMany({
      where: { researchId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        reason: true,
        approved: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ research, requests })
  } catch (error) {
    console.error("Failed to fetch research access requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch access requests" },
      { status: 500 }
    )
  }
}