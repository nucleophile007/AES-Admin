import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import { analyzePDF } from "@/lib/pdfParser"

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
    // Fetch research details
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      select: {
        title: true,
        pdfFilename: true,
      },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    if (!research.pdfFilename) {
      return NextResponse.json(
        { error: "No PDF file uploaded for this research" },
        { status: 400 }
      )
    }

    // Update status to pending
    await prisma.research.update({
      where: { id: researchId },
      data: { extractionStatus: 'pending' },
    })

    // Download PDF from Supabase
    const storagePath = `${researchId}/${research.pdfFilename}`
    const { data: pdfData, error: downloadError } = await supabaseServer.storage
      .from("research-pdf")
      .download(storagePath)

    if (downloadError || !pdfData) {
      console.error("PDF download error:", downloadError)
      
      // Update status to failed
      await prisma.research.update({
        where: { id: researchId },
        data: { extractionStatus: 'failed' },
      })

      return NextResponse.json(
        { error: "Failed to download PDF from storage" },
        { status: 500 }
      )
    }

    // Convert Blob to Buffer
    const pdfBuffer = Buffer.from(await pdfData.arrayBuffer())

    // Extract content
    try {
      console.log(`Re-extracting content for research: ${research.title}`)
      const extractedContent = await analyzePDF(pdfBuffer, research.title)

      // Update database with extracted content
      await prisma.research.update({
        where: { id: researchId },
        data: {
          extractedContent: extractedContent as any,
          abstract: extractedContent.abstract,
          keywords: extractedContent.keywords,
          extractedAt: new Date(),
          extractionStatus: 'completed',
        },
      })

      console.log(`✓ Re-extraction completed successfully`)

      return NextResponse.json({
        success: true,
        message: "Content extracted successfully",
        extraction: {
          status: 'completed',
          sectionsCount: extractedContent.sections.length,
          keywordsCount: extractedContent.keywords.length,
          hasAbstract: !!extractedContent.abstract,
          extractedAt: new Date().toISOString(),
        },
        data: {
          abstract: extractedContent.abstract,
          keywords: extractedContent.keywords,
          sections: extractedContent.sections,
        },
      })

    } catch (extractionError) {
      console.error('Re-extraction failed:', extractionError)

      // Update status to failed
      await prisma.research.update({
        where: { id: researchId },
        data: { extractionStatus: 'failed' },
      })

      return NextResponse.json(
        {
          error: "Content extraction failed",
          details: extractionError instanceof Error ? extractionError.message : "Unknown error",
        },
        { status: 500 }
      )
    }

  } catch (err) {
    console.error("Re-extraction error:", err)
    return NextResponse.json(
      { error: "Re-extraction failed" },
      { status: 500 }
    )
  }
}
