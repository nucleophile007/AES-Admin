import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch research by slug
    const research = await prisma.research.findUnique({
      where: { slug },
    })

    // Return 404 if not found
    if (!research) {
      return NextResponse.json(
        { 
          success: false,
          error: "Research not found" 
        },
        { status: 404 }
      )
    }

    // Only return published research publicly
    if (!research.published) {
      return NextResponse.json(
        { 
          success: false,
          error: "Research not available" 
        },
        { status: 404 }
      )
    }

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        id: research.id,
        slug: research.slug,
        title: research.title,
        author: research.author,
        description: research.description,
        abstract: research.abstract,
        keywords: research.keywords,
        extractedContent: research.extractedContent,
        extractedAt: research.extractedAt,
        extractionStatus: research.extractionStatus,
        createdAt: research.createdAt,
        published: research.published,
        meta: {
          hasPresentationPdf: !!research.presentationPdfFilename,
          hasPDF: !!research.pdfFilename,
          hasExtractedContent: !!research.extractedContent,
        },
        presentationPdfFilename: research.presentationPdfFilename,
      },
    }

    // Return response with CORS headers for cross-origin access
    return NextResponse.json(responseData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Error fetching research metadata:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch research data" 
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
