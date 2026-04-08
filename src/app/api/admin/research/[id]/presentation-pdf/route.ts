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
    const research = await prisma.research.findUnique({
      where: { id: researchId },
      select: { presentationPdfFilename: true },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    if (!research.presentationPdfFilename) {
      return NextResponse.json(
        { error: "No presentation PDF associated with this research" },
        { status: 404 }
      )
    }

    const presentationPath = `${researchId}/${research.presentationPdfFilename}`
    const { error: deleteError } = await supabaseServer.storage
      .from("research-ppt")
      .remove([presentationPath])

    if (deleteError) {
      console.error("Error deleting presentation PDF from storage:", deleteError)
    }

    const updatedResearch = await prisma.research.update({
      where: { id: researchId },
      data: {
        presentationPdfFilename: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Presentation PDF deleted successfully",
      research: updatedResearch,
    })
  } catch (error) {
    console.error("Delete presentation PDF error:", error)
    return NextResponse.json(
      { error: "Failed to delete presentation PDF" },
      { status: 500 }
    )
  }
}