import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import { PDFDocument } from "pdf-lib"
import { analyzePDF } from "@/lib/pdfParser"
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

    // Get research details for extraction
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      select: { title: true, pdfFilename: true },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    // Delete old PDF from storage if it exists
    if (research.pdfFilename) {
      const oldPdfPath = `${researchId}/${research.pdfFilename}`
      console.log(`Deleting old PDF from storage: ${oldPdfPath}`)
      
      const { error: deleteError } = await supabaseServer.storage
        .from("research-pdf")
        .remove([oldPdfPath])
      
      if (deleteError) {
        console.warn(`Failed to delete old PDF (${oldPdfPath}):`, deleteError)
        // Continue anyway - old file may not exist
      } else {
        console.log(`✓ Old PDF deleted successfully`)
      }
    }

    // Read PDF buffer (use original for extraction, watermarked for storage)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Set extraction status to pending
    await prisma.research.update({
      where: { id: researchId },
      data: { extractionStatus: 'pending' },
    })

    // Step 1: Extract content from original PDF (before watermarking)
    let extractedContent = null
    let abstract = null
    let keywords: string[] = []
    let extractionStatus = 'pending'

    try {
      console.log(`Starting PDF content extraction for research: ${research.title}`)
      const content = await analyzePDF(fileBuffer, research.title)
      
      extractedContent = content
      abstract = content.abstract
      keywords = content.keywords
      extractionStatus = 'completed'
      
      console.log(`✓ Content extraction completed successfully`)
    } catch (extractionError) {
      console.error('Content extraction failed:', extractionError)
      extractionStatus = 'failed'
      // Continue with upload even if extraction fails
    }

    // Step 2: Add watermark to PDF
    const pdfDoc = await PDFDocument.load(fileBuffer)
    await applyTiledWatermark(pdfDoc)

    // Save watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save()

    const fileName = `${Date.now()}-${file.name}`
    const storagePath = `${researchId}/${fileName}`

    // Step 3: Upload to Supabase
    const { error } = await supabaseServer.storage
      .from("research-pdf")
      .upload(storagePath, watermarkedPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (error) {
      console.error("PDF upload error:", error)
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      )
    }

    // Step 4: Update database with PDF filename and extracted content
    await prisma.research.update({
      where: { id: researchId },
      data: {
        pdfFilename: fileName,
        extractedContent: extractedContent as any, // Prisma Json type
        abstract,
        keywords,
        extractedAt: extractionStatus === 'completed' ? new Date() : null,
        extractionStatus,
      },
    })

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully",
      pdfFilename: fileName,
      extraction: {
        status: extractionStatus,
        sectionsCount: extractedContent?.sections?.length || 0,
        keywordsCount: keywords.length,
        hasAbstract: !!abstract,
      },
    })
  } catch (err) {
    console.error("Upload PDF error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
