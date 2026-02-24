import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import { PDFDocument, rgb, degrees } from "pdf-lib"

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

    // Read PDF and add watermark to each page
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(fileBuffer)
    const pages = pdfDoc.getPages()

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize()
      
      // Draw watermark text diagonally across the page
      page.drawText("© Acharyaes.com", {
        x: width / 2 - 150,
        y: height / 2,
        size: 60,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.3,
        rotate: degrees(45),
      })
    }

    // Save watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save()

    const fileName = `${Date.now()}-${file.name}`
    const storagePath = `${researchId}/${fileName}`

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

    // Save only filename in DB (not full path)
    await prisma.research.update({
      where: { id: researchId },
      data: { pdfFilename: fileName },
    })

    return NextResponse.json({
      success: true,
      message: "PDF uploaded successfully",
      pdfFilename: fileName,
    })
  } catch (err) {
    console.error("Upload PDF error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
