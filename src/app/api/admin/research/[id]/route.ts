import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import { supabaseServer } from "@/lib/supabase-server"
import slugify from "slugify"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔐 Admin auth
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params

    const research = await prisma.research.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            AccessRequest: true,
          },
        },
      },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ research }, { status: 200 })
  } catch (err) {
    console.error("Get research error:", err)
    return NextResponse.json(
      { error: "Failed to fetch research" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔐 Admin auth
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params
    const body = await req.json()

    // Check if research exists
    const existing = await prisma.research.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: any = {}

    if (body.title !== undefined) {
      updateData.title = body.title
      // Update slug if title changed
      updateData.slug = slugify(body.title, {
        lower: true,
        strict: true,
        trim: true,
      })

      // Check for duplicate slug (if different from current)
      if (updateData.slug !== existing.slug) {
        const duplicateSlug = await prisma.research.findUnique({
          where: { slug: updateData.slug },
        })
        if (duplicateSlug) {
          return NextResponse.json(
            { error: "A research with this title already exists" },
            { status: 409 }
          )
        }
      }
    }

    if (body.description !== undefined) updateData.description = body.description
    if (body.author !== undefined) updateData.author = body.author
    if (body.grade !== undefined) updateData.grade = body.grade
    if (body.school !== undefined) updateData.school = body.school
    if (body.category !== undefined) {
      // Validate category
      if (body.category && !["IGNITE", "ELEVATE", "TRANSFORM"].includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category. Must be IGNITE, ELEVATE, or TRANSFORM" },
          { status: 400 }
        )
      }
      updateData.category = body.category
    }
    if (body.domain !== undefined) updateData.domain = body.domain
    if (body.abstract !== undefined) updateData.abstract = body.abstract
    if (body.keywords !== undefined) {
      // Ensure keywords is an array
      if (!Array.isArray(body.keywords)) {
        return NextResponse.json(
          { error: "Keywords must be an array" },
          { status: 400 }
        )
      }
      updateData.keywords = body.keywords
    }
    if (body.published !== undefined) updateData.published = body.published

    if (body.studentId !== undefined) {
      if (body.studentId === null) {
        updateData.studentId = null
      } else {
        // Validate student exists
        const student = await prisma.student.findUnique({
          where: { id: parseInt(body.studentId) },
        })
        if (!student) {
          return NextResponse.json(
            { error: "Student not found" },
            { status: 404 }
          )
        }
        updateData.studentId = parseInt(body.studentId)
      }
    }

    const research = await prisma.research.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ research }, { status: 200 })
  } catch (err) {
    console.error("Update research error:", err)
    return NextResponse.json(
      { error: "Failed to update research" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔐 Admin auth
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params

    // Fetch research for file cleanup
    const research = await prisma.research.findUnique({
      where: { id },
    })

    if (!research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      )
    }

    // Use Supabase client

    // Step 1: Delete all AccessRequest records
    await prisma.accessRequest.deleteMany({
      where: { researchId: id },
    })

    // Step 2: Delete technical report PDF from storage (if exists)
    if (research.pdfFilename) {
      const pdfPath = `${id}/${research.pdfFilename}`
      const { error: pdfDeleteError } = await supabaseServer.storage
        .from("research-pdf")
        .remove([pdfPath])

      if (pdfDeleteError) {
        console.error("Error deleting PDF from storage:", pdfDeleteError)
        // Continue with deletion even if storage delete fails
      }
    }

    // Step 3: Delete presentation PDF from storage (if exists)
    if (research.presentationPdfFilename) {
      const presentationPath = `${id}/${research.presentationPdfFilename}`
      const { error: presentationDeleteError } = await supabaseServer.storage
        .from("research-ppt")
        .remove([presentationPath])

      if (presentationDeleteError) {
        console.error("Error deleting presentation PDF from storage:", presentationDeleteError)
        // Continue with deletion even if storage delete fails
      }
    }

    // Step 4: Delete research record
    await prisma.research.delete({
      where: { id },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Research and all related data deleted successfully",
      },
      { status: 200 }
    )
  } catch (err) {
    console.error("Delete research error:", err)
    return NextResponse.json(
      { error: "Failed to delete research" },
      { status: 500 }
    )
  }
}
