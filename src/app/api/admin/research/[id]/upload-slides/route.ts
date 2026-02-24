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

      // Get image dimensions
      const metadata = await sharp(buffer).metadata()
      const width = metadata.width!
      const height = metadata.height!

      // Create watermark SVG with dynamic sizing based on image dimensions
      const fontSize = Math.min(width, height) * 0.1 // 10% of smallest dimension
      const watermarkSvg = `
        <svg width="${width}" height="${height}">
          <text
            x="50%"
            y="50%"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            font-weight="bold"
            fill="rgb(128, 128, 128)"
            fill-opacity="0.5"
            text-anchor="middle"
            dominant-baseline="middle"
            transform="rotate(-45 ${width/2} ${height/2})"
          >
            © Acharyaes.com
          </text>
        </svg>
      `

      // Apply watermark
      const processed = await sharp(buffer)
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            top: 0,
            left: 0,
          },
        ])
        .png()
        .toBuffer()

      const fileName = `slide-${order}.png`
      const storagePath = `${researchId}/${fileName}`

      await supabaseServer.storage
        .from("research-slides")
        .upload(storagePath, processed, {
          contentType: "image/png",
          upsert: true,
        })

      // Save only filename in DB (not public URL)
      await prisma.slide.create({
        data: {
          researchId,
          imageFilename: fileName,
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
