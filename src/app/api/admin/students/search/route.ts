import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  // 🔐 Admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    // If no query, return empty array
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ students: [] })
    }

    // Search students by name (case-insensitive, contains)
    const students = await prisma.student.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        graduationYear: true,
        schoolName: true,
      },
      take: 10, // Limit to 10 results
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Student search error:", error)
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    )
  }
}
