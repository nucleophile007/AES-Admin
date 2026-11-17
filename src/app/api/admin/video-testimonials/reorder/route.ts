import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"

// PUT /api/admin/video-testimonials/reorder - body { ids: number[] } in the new display order
export async function PUT(request: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const { ids } = await request.json()
    const orderedIds = Array.isArray(ids) ? ids.map(Number) : []
    if (
      orderedIds.length === 0 ||
      orderedIds.some((id) => !Number.isInteger(id) || id <= 0) ||
      new Set(orderedIds).size !== orderedIds.length
    ) {
      return NextResponse.json({ error: "A list of unique video testimonial IDs is required" }, { status: 400 })
    }

    const found = await prisma.videoTestimonial.count({ where: { id: { in: orderedIds } } })
    if (found !== orderedIds.length) {
      return NextResponse.json({ error: "One or more video testimonials were not found" }, { status: 404 })
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.videoTestimonial.update({ where: { id }, data: { displayOrder: index } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reorder video testimonials:", error)
    return NextResponse.json({ error: "Failed to reorder video testimonials" }, { status: 500 })
  }
}
