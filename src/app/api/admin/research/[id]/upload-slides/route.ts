import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import sharp from "sharp"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminAuth()
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.statusCode || 403 }
    )
  }

  const { id: researchId } = await params

  try {
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      select: { id: true },
    })

    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json(
        { error: "No images uploaded" },
        { status: 400 }
      )
    }

    let order = 1
    let uploadedCount = 0

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue
      }

      const buffer = Buffer.from(await file.arrayBuffer())

      // OPTIONAL watermark
      const watermarkSvg = `
        <svg width="400" height="80">
          <text x="0" y="50"
            font-size="48"
            fill="gray"
            opacity="0.25">
            © Acharyaes.com
          </text>
        </svg>
      `

      const processed = await sharp(buffer)
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            gravity: "southeast",
          },
        ])
        .png()
        .toBuffer()

      const storagePath = `${researchId}/slide-${order}.png`

      const { error } = await supabaseServer.storage
        .from("research-slides")
        .upload(storagePath, processed, {
          contentType: "image/png",
          upsert: true,
        })

      if (error) {
        throw error
      }

      order++
      uploadedCount++
    }

    return NextResponse.json({
      success: true,
      message: "Slides uploaded successfully",
      uploadedCount,
    })
  } catch (err) {
    console.error("Upload slides error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
