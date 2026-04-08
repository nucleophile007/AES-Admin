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
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json(
        { error: "No images uploaded" },
        { status: 400 }
      )
    }

    // Remove old slides (idempotent)
    await prisma.slide.deleteMany({
      where: { researchId },
    })

    let order = 1

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

      await supabaseServer.storage
        .from("research-slides")
        .upload(storagePath, processed, {
          contentType: "image/png",
          upsert: true,
        })

      await prisma.slide.create({
        data: {
          researchId,
          imageFilename: storagePath,
          order,
        },
      })

      order++
    }

    return NextResponse.json({
      success: true,
      message: "Slides uploaded successfully",
    })
  } catch (err) {
    console.error("Upload slides error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
