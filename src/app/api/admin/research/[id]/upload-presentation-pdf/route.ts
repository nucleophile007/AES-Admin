import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import { PDFDocument } from "pdf-lib"
import { applyTiledWatermark } from "@/lib/pdfWatermark"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔐 Admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  const { id: researchId } = await params

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      )
    }

    // Get research details
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      select: { title: true, presentationPdfFilename: true },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    // Delete old presentation PDF from storage if it exists
    if (research.presentationPdfFilename) {
      const oldPdfPath = `${researchId}/${research.presentationPdfFilename}`
      console.log(`Deleting old presentation PDF from storage: ${oldPdfPath}`)
      
      const { error: deleteError } = await supabaseServer.storage
        .from("research-ppt")
        .remove([oldPdfPath])
      
      if (deleteError) {
        console.warn(`Failed to delete old presentation PDF (${oldPdfPath}):`, deleteError)
        // Continue anyway - old file may not exist
      } else {
        console.log(`✓ Old presentation PDF deleted successfully`)
      }
    }

    // Read PDF buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Add watermark to PDF
    const pdfDoc = await PDFDocument.load(fileBuffer)
    await applyTiledWatermark(pdfDoc)

    // Save watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save()
    const totalPages = pdfDoc.getPageCount()

    const fileName = `presentation-${Date.now()}-${file.name}`
    const storagePath = `${researchId}/${fileName}`

    // Upload to Supabase research-ppt bucket
    const { error } = await supabaseServer.storage
      .from("research-ppt")
      .upload(storagePath, watermarkedPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (error) {
      console.error("Presentation PDF upload error:", error)
      return NextResponse.json(
        { error: "Failed to upload presentation PDF" },
        { status: 500 }
      )
    }

    // Update database with presentation PDF filename
    await prisma.research.update({
      where: { id: researchId },
      data: {
        presentationPdfFilename: fileName,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Presentation PDF uploaded successfully",
      presentationPdfFilename: fileName,
      totalPages,
    })
  } catch (err) {
    console.error("Upload presentation PDF error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
