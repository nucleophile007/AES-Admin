import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/students
export async function GET(request: NextRequest) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    // Test connection first
    try {
      console.log("Testing database connection before querying students...")
      await prisma.$queryRaw`SELECT 1 as test`
      console.log("Database connection test passed")
    } catch (connError) {
      console.error("Database connection test failed:", connError)
      return NextResponse.json({ 
        error: "Database connection failed",
        details: connError instanceof Error ? connError.message : String(connError)
      }, { status: 500 })
    }

    // Get search parameter for filtering
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search')

    console.log("Fetching students from database...")
    
    // Build query with optional search
    const whereClause = searchTerm ? {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { email: { contains: searchTerm, mode: 'insensitive' as const } },
      ]
    } : {}

    // Get students from the database
    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      },
      take: searchTerm ? 10 : undefined // Limit results when searching
    })
    
    console.log(`Successfully retrieved ${students.length} students`)
    return NextResponse.json({ students }, { status: 200 })
  } catch (error) {
    console.error("Failed to get students:", error)
    return NextResponse.json({ 
      error: "Failed to get students", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST /api/admin/students
export async function POST(request: NextRequest) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { 
      name, 
      email, 
      grade, 
      schoolName, 
      program, 
      parentName, 
      parentEmail, 
      parentPhone,
      subject,
      teacherId
    } = await request.json()
    
    // Validate required fields
    if (!name || !email || !grade || !schoolName || !program || !parentName || !parentEmail || !parentPhone || !subject || !teacherId) {
      return NextResponse.json(
        { error: "All fields are required including subject and teacher" },
        { status: 400 }
      )
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: "Selected teacher not found" },
        { status: 404 }
      )
    }

    // Check if student with this email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this email already exists" },
        { status: 409 }
      )
    }

    // Create student, enrollment, and teacher-student link in a transaction
    console.log("Creating student with data:", { name, email, grade, schoolName, program, subject, teacherId })
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update parent account (one per email)
      let parentAccount = await tx.parentAccount.findUnique({
        where: { email: parentEmail }
      })

      if (!parentAccount) {
        parentAccount = await tx.parentAccount.create({
          data: {
            name: parentName,
            email: parentEmail,
            phone: parentPhone
          }
        })
      } else {
        parentAccount = await tx.parentAccount.update({
          where: { id: parentAccount.id },
          data: {
            name: parentName,
            phone: parentPhone ?? parentAccount.phone
          }
        })
      }

      // 2. Create student
      const student = await tx.student.create({
        data: {
          name,
          email,
          grade,
          schoolName,
          program,
          parentName,
          parentEmail,
          parentPhone,
          parentAccountId: parentAccount.id
          // password: null by default
          // isActivated: false by default
        }
      })

      // 3. Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          program,
          subject,
          isActive: true
        }
      })

      // 4. Create teacher-student link
      const teacherStudent = await tx.teacherStudent.create({
        data: {
          teacherId: parseInt(teacherId),
          studentId: student.id,
          program
        }
      })

      return { student, enrollment, teacherStudent, parentAccount }
    })
    
    console.log("Student created successfully:", result.student.id)
    console.log("Enrollment created:", result.enrollment.id)
    console.log("Teacher-Student link created:", result.teacherStudent.id)
    
    return NextResponse.json({ 
      student: result.student,
      parentAccount: result.parentAccount,
      enrollment: result.enrollment,
      teacherLink: result.teacherStudent
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create student:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ 
      error: "Failed to create student",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}