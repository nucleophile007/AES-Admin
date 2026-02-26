import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"
import slugify from "slugify"

export async function POST(req: NextRequest) {
  // 🔐 Admin auth
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const body = await req.json()
    const { title, description, author, grade, school, category, createdAt, studentId } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!createdAt) {
      return NextResponse.json(
        { error: "Research date is required" },
        { status: 400 }
      )
    }

    // Validate createdAt is a valid date
    const parsedDate = new Date(createdAt)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (category && !["IGNITE", "ELEVATE", "TRANSFORM"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be IGNITE, ELEVATE, or TRANSFORM" },
        { status: 400 }
      )
    }

    // Validate studentId if provided
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: parseInt(studentId) },
      })
      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        )
      }
    }

    const slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    })

    // Prevent duplicate slug
    const existing = await prisma.research.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Research with same title already exists" },
        { status: 409 }
      )
    }

    const research = await prisma.research.create({
      data: {
        id: crypto.randomUUID(),
        title,
        slug,
        description,
        author,
        grade: grade || null,
        school: school || null,
        category: category || null,
        createdAt: parsedDate,
        studentId: studentId ? parseInt(studentId) : null,
        pdfFilename: null,
      },
    })

    return NextResponse.json({ research }, { status: 201 })
  } catch (err) {
    console.error("Create research error:", err)
    return NextResponse.json(
      { error: "Failed to create research" },
      { status: 500 }
    )
  }
}
