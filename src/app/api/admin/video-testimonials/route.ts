import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import { getR2ObjectInfo, getR2PublicUrl } from "@/lib/r2Upload"
import {
  VIDEO_TESTIMONIAL_KEY_PREFIX,
  VIDEO_TESTIMONIAL_MAX_BYTES,
  cleanText,
  isAllowedVideoType,
} from "@/lib/videoTestimonials"

export const runtime = "nodejs"

// GET /api/admin/video-testimonials - all video testimonials, including hidden ones
export async function GET() {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const videos = await prisma.videoTestimonial.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ videos })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return NextResponse.json(
        { error: "The VideoTestimonial table does not exist yet. Apply the AES migration 20261117000000_video_testimonials to the database." },
        { status: 503 },
      )
    }
    console.error("Failed to load video testimonials:", error)
    return NextResponse.json({ error: "Failed to load video testimonials" }, { status: 500 })
  }
}

// POST /api/admin/video-testimonials - save details for a video already uploaded to R2
export async function POST(request: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const body = await request.json()
    const key = typeof body.key === "string" ? body.key : ""
    const name = cleanText(body.name, 120)

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 })
    }
    if (!key.startsWith(VIDEO_TESTIMONIAL_KEY_PREFIX) || key.includes("..") || key.length > 200) {
      return NextResponse.json({ error: "Invalid video reference." }, { status: 400 })
    }

    // Make sure the upload really finished before saving it.
    const object = await getR2ObjectInfo(key)
    if (!object) {
      return NextResponse.json({ error: "The video was not found in storage. Please upload it again." }, { status: 400 })
    }
    if (!isAllowedVideoType(object.contentType)) {
      return NextResponse.json({ error: "Uploaded file is not a supported video type." }, { status: 400 })
    }
    if (object.size > VIDEO_TESTIMONIAL_MAX_BYTES) {
      return NextResponse.json({ error: "Video is too large. Maximum size is 500MB." }, { status: 400 })
    }

    const last = await prisma.videoTestimonial.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    })

    const video = await prisma.videoTestimonial.create({
      data: {
        name,
        designation: cleanText(body.designation, 160),
        program: cleanText(body.program, 120),
        description: cleanText(body.description, 1000),
        videoKey: key,
        videoUrl: getR2PublicUrl(key),
        mimeType: object.contentType,
        fileSize: object.size,
        isVisible: body.isVisible !== false,
        displayOrder: (last?.displayOrder ?? -1) + 1,
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "This video has already been saved." }, { status: 409 })
    }
    console.error("Failed to save video testimonial:", error)
    return NextResponse.json({ error: "Failed to save video testimonial" }, { status: 500 })
  }
}
