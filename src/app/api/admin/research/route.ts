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
    const { title, description, author } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
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
        createdAt: new Date(),
        description,
        author,
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
