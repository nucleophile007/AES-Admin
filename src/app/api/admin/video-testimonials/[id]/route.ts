import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import { deleteFromR2 } from "@/lib/r2Upload"
import { cleanText } from "@/lib/videoTestimonials"

export const runtime = "nodejs"

const parseId = async (params: Promise<{ id: string }>) => {
  const id = Number((await params).id)
  return Number.isInteger(id) && id > 0 ? id : null
}

// PATCH /api/admin/video-testimonials/[id] - edit details or show/hide
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  const id = await parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid video testimonial ID" }, { status: 400 })

  try {
    const body = await request.json()
    const data: {
      name?: string
      designation?: string | null
      program?: string | null
      description?: string | null
      isVisible?: boolean
    } = {}

    if ("name" in body) {
      const name = cleanText(body.name, 120)
      if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 })
      data.name = name
    }
    if ("designation" in body) data.designation = cleanText(body.designation, 160)
    if ("program" in body) data.program = cleanText(body.program, 120)
    if ("description" in body) data.description = cleanText(body.description, 1000)
    if ("isVisible" in body) {
      if (typeof body.isVisible !== "boolean") {
        return NextResponse.json({ error: "isVisible must be true or false" }, { status: 400 })
      }
      data.isVisible = body.isVisible
    }

    const existing = await prisma.videoTestimonial.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: "Video testimonial not found" }, { status: 404 })

    const video = await prisma.videoTestimonial.update({ where: { id }, data })
    return NextResponse.json({ video })
  } catch (error) {
    console.error("Failed to update video testimonial:", error)
    return NextResponse.json({ error: "Failed to update video testimonial" }, { status: 500 })
  }
}

// DELETE /api/admin/video-testimonials/[id] - remove the entry and its file in R2
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  const id = await parseId(params)
  if (!id) return NextResponse.json({ error: "Invalid video testimonial ID" }, { status: 400 })

  try {
    const video = await prisma.videoTestimonial.findUnique({ where: { id } })
    if (!video) return NextResponse.json({ error: "Video testimonial not found" }, { status: 404 })

    await prisma.videoTestimonial.delete({ where: { id } })

    let fileDeleted = true
    try {
      await deleteFromR2(video.videoKey)
    } catch (error) {
      // The entry is already gone from the site; a leftover file only costs storage.
      fileDeleted = false
      console.error(`Video testimonial ${id} deleted, but its R2 file could not be removed:`, error)
    }

    return NextResponse.json({ success: true, fileDeleted })
  } catch (error) {
    console.error("Failed to delete video testimonial:", error)
    return NextResponse.json({ error: "Failed to delete video testimonial" }, { status: 500 })
  }
}
