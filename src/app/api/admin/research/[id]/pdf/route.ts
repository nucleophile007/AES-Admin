import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"

export async function DELETE(
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
    // Fetch research to get PDF filename
    const research = await prisma.research.findUnique({
      where: { id: researchId },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    if (!research.pdfFilename) {
      return NextResponse.json(
        { error: "No PDF file associated with this research" },
        { status: 404 }
      )
    }

    // Delete from Supabase storage
    const pdfPath = `${researchId}/${research.pdfFilename}`
    const { error: deleteError } = await supabaseServer.storage
      .from("research-pdf")
      .remove([pdfPath])

    if (deleteError) {
      console.error("Error deleting PDF from storage:", deleteError)
      // Continue with DB update even if storage delete fails
    }

    // Update research record to remove PDF references
    const updatedResearch = await prisma.research.update({
      where: { id: researchId },
      data: {
        pdfFilename: null,
        extractedContent: undefined,
        extractionStatus: null,
        extractedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "PDF deleted successfully",
      research: updatedResearch,
    })
  } catch (err) {
    console.error("Delete PDF error:", err)
    return NextResponse.json(
      { error: "Failed to delete PDF" },
      { status: 500 }
    )
  }
}
