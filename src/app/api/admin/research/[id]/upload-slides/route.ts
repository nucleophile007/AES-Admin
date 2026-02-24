import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import sharp from "sharp"
import { createCanvas } from "canvas"

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

      // Create watermark using canvas (works in production without system fonts)
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')
      
      // Calculate font size based on image diagonal
      const diagonal = Math.sqrt(width * width + height * height)
      const fontSize = Math.floor(diagonal * 0.06)
      
      // Prepare canvas for rotated text
      ctx.translate(width / 2, height / 2)
      ctx.rotate(-45 * Math.PI / 180)
      
      // Set text style
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = 'rgba(128, 128, 128, 0.35)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Draw watermark text
      ctx.fillText('© Acharyaes.com', 0, 0)
      
      // Convert canvas to buffer
      const watermarkBuffer = canvas.toBuffer('image/png')

      // Apply watermark
      const processed = await sharp(buffer)
        .composite([
          {
            input: watermarkBuffer,
            top: 0,
            left: 0,
            blend: "over",
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
