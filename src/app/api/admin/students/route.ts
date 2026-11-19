import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

interface EnrollmentInput {
  program: string
  subject: string
  teacherIds: number[]
}

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
      include: {
        enrollments: {
          select: {
            id: true,
            program: true,
            subject: true,
            isActive: true,
          },
          orderBy: { startDate: "desc" },
        },
        teacherLinks: {
          select: {
            program: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
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
    const normalizeGraduationYear = (value: unknown) => {
      if (value === undefined || value === null || value === "") {
        return { value: null as number | null }
      }

      const parsed = Number(value)
      if (!Number.isInteger(parsed)) {
        return { error: "Graduation year must be a whole number" }
      }

      if (parsed < 2000 || parsed > 2100) {
        return { error: "Graduation year must be between 2000 and 2100" }
      }

      return { value: parsed }
    }

    const body = await request.json()
    const { 
      name, 
      email, 
      grade, 
      graduationYear,
      schoolName, 
      program, 
      parentName, 
      parentEmail, 
      parentPhone,
      subject,
      teacherId,
      teacherIds
    } = body
    const enrollmentInputs: EnrollmentInput[] = Array.isArray(body.enrollments) && body.enrollments.length > 0
      ? body.enrollments
      : [{ program, subject, teacherIds: Array.isArray(teacherIds) ? teacherIds : [teacherId] }]
    const enrollments: EnrollmentInput[] = enrollmentInputs.map((enrollment: {
      program?: unknown
      subject?: unknown
      teacherIds?: unknown
      teacherId?: unknown
    }) => ({
      program: typeof enrollment.program === "string" ? enrollment.program.trim() : "",
      subject: typeof enrollment.subject === "string" ? enrollment.subject.trim() : "",
      teacherIds: Array.from(new Set<number>(
        (Array.isArray(enrollment.teacherIds) ? enrollment.teacherIds : [enrollment.teacherId])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )) as number[],
    }))
    
    // Validate required fields
    if (!name || !email || !grade || !schoolName || !parentName || !parentEmail || !parentPhone ||
        enrollments.length === 0 ||
        enrollments.some((enrollment) => !enrollment.program || !enrollment.subject || enrollment.subject.trim() === "Other" || enrollment.teacherIds.length === 0)) {
      return NextResponse.json(
        { error: "All fields are required for every program enrollment" },
        { status: 400 }
      )
    }

    const graduationYearResult = normalizeGraduationYear(graduationYear)
    if (graduationYearResult.error) {
      return NextResponse.json(
        { error: graduationYearResult.error },
        { status: 400 }
      )
    }

    // Verify teacher exists
    const selectedTeacherIds = Array.from(new Set(enrollments.flatMap((enrollment) => enrollment.teacherIds)))
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: selectedTeacherIds } },
      select: { id: true },
    })

    if (teachers.length !== selectedTeacherIds.length) {
      return NextResponse.json({ error: "One or more selected teachers were not found" }, { status: 404 })
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
    console.log("Creating student with data:", { name, email, grade, graduationYear: graduationYearResult.value, schoolName, program, subject, teacherId })
    
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
          graduationYear: graduationYearResult.value,
          schoolName,
          program: enrollments[0].program,
          parentName,
          parentEmail,
          parentPhone,
          parentAccountId: parentAccount.id
          // password: null by default
          // isActivated: false by default
        }
      })

      const createdEnrollments = []
      const teacherStudents = []
      for (const enrollmentInput of enrollments) {
        const enrollment = await tx.enrollment.create({
          data: {
            studentId: student.id,
            program: enrollmentInput.program,
            subject: enrollmentInput.subject,
            isActive: true
          }
        })
        createdEnrollments.push(enrollment)
        const links = await Promise.all(
          enrollmentInput.teacherIds.map((selectedTeacherId) =>
            tx.teacherStudent.create({
              data: {
                teacherId: selectedTeacherId,
                studentId: student.id,
                program: enrollmentInput.program,
              },
            })
          )
        )
        teacherStudents.push(...links)
      }

      return { student, enrollments: createdEnrollments, teacherStudents, parentAccount }
    })
    
    console.log("Student created successfully:", result.student.id)
    console.log("Enrollments created:", result.enrollments.map((enrollment) => enrollment.id))
    console.log("Teacher-Student links created:", result.teacherStudents.map((link) => link.id))
    
    return NextResponse.json({ 
      student: result.student,
      parentAccount: result.parentAccount,
      enrollments: result.enrollments,
      enrollment: result.enrollments[0],
      teacherLink: result.teacherStudents[0],
      teacherLinks: result.teacherStudents,
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