import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import { createPresignedUploadUrl } from "@/lib/r2Upload"
import {
  VIDEO_TESTIMONIAL_KEY_PREFIX,
  VIDEO_TESTIMONIAL_MAX_BYTES,
  VIDEO_TESTIMONIAL_TYPES,
  isAllowedVideoType,
} from "@/lib/videoTestimonials"

export const runtime = "nodejs"

// POST /api/admin/video-testimonials/upload-url
// Returns a short-lived URL the browser uses to PUT the video directly into the R2 bucket.
export async function POST(request: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const { contentType, fileSize } = await request.json()

    if (!isAllowedVideoType(contentType)) {
      return NextResponse.json({ error: "Only MP4, WebM or MOV videos are allowed." }, { status: 400 })
    }
    if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "A valid file size is required." }, { status: 400 })
    }
    if (fileSize > VIDEO_TESTIMONIAL_MAX_BYTES) {
      return NextResponse.json({ error: "Video is too large. Maximum size is 500MB." }, { status: 400 })
    }

    // Server-generated key: never trust the client's file name for the storage path.
    const key = `${VIDEO_TESTIMONIAL_KEY_PREFIX}${Date.now()}-${randomUUID()}.${VIDEO_TESTIMONIAL_TYPES[contentType]}`
    const { uploadUrl } = await createPresignedUploadUrl(key, contentType)

    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error("Failed to create video upload URL:", error)
    return NextResponse.json({ error: "Could not prepare the video upload." }, { status: 500 })
  }
}
