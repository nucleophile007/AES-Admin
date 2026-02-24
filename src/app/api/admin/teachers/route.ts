import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/teachers
export async function GET() {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    // Get all teachers from the database
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })
    
    return NextResponse.json({ teachers }, { status: 200 })
  } catch (error) {
    console.error("Failed to get teachers:", error)
    return NextResponse.json({ error: "Failed to get teachers" }, { status: 500 })
  }
}

// POST /api/admin/teachers
export async function POST(request: NextRequest) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { name, email, programs } = await request.json()
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Validate programs array
    if (!programs || !Array.isArray(programs) || programs.length === 0) {
      return NextResponse.json(
        { error: "At least one program is required" },
        { status: 400 }
      )
    }

    // Check if teacher with this email already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { email }
    })

    if (existingTeacher) {
      return NextResponse.json(
        { error: "Teacher with this email already exists" },
        { status: 409 }
      )
    }

    // Create new teacher record (password is null, will be set during activation)
    const teacher = await prisma.teacher.create({
      data: {
        name,
        email,
        programs: programs // Array of programs
        // password: null by default
        // isActivated: false by default
      }
    })
    
    return NextResponse.json({ teacher }, { status: 201 })
  } catch (error) {
    console.error("Failed to create teacher:", error)
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 })
  }
}