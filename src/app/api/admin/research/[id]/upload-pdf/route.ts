import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"

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

    const filePath = `${researchId}/${Date.now()}-${file.name}`

    const { error } = await supabaseServer.storage
      .from("research-pdf")
      .upload(filePath, file, {
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

    // Save PDF path in DB
    await prisma.research.update({
      where: { id: researchId },
      data: { pdfPath: filePath },
    })

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully",
      pdfPath: filePath,
    })
  } catch (err) {
    console.error("Upload PDF error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
