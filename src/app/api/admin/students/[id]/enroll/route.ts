import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/students/[id]/enroll
// Add a new enrollment for an existing student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { id: paramId } = await params
    const studentId = parseInt(paramId)
    const { program, subject, teacherId } = await request.json()
    
    // Validate required fields
    if (!program || !subject || !teacherId) {
      return NextResponse.json(
        { error: "Program, subject, and teacher are required" },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) }
    })

    if (!teacher) {
      return NextResponse.json({ error: "Selected teacher not found" }, { status: 404 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_program_subject: {
          studentId,
          program,
          subject
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this program and subject" },
        { status: 409 }
      )
    }

    // Create enrollment and teacher-student link in a transaction
    console.log("Adding enrollment:", { studentId, program, subject, teacherId })
    
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          program,
          subject,
          isActive: true
        }
      })

      // 2. Check if teacher-student link already exists for this program
      const existingTeacherLink = await tx.teacherStudent.findUnique({
        where: {
          teacherId_studentId_program: {
            teacherId: parseInt(teacherId),
            studentId,
            program
          }
        }
      })

      let teacherStudent
      if (existingTeacherLink) {
        // If link exists, just return it
        teacherStudent = existingTeacherLink
        console.log("Teacher-Student link already exists:", existingTeacherLink.id)
      } else {
        // Create new teacher-student link
        teacherStudent = await tx.teacherStudent.create({
          data: {
            teacherId: parseInt(teacherId),
            studentId,
            program
          }
        })
        console.log("Teacher-Student link created:", teacherStudent.id)
      }

      return { enrollment, teacherStudent }
    })
    
    console.log("Enrollment added successfully:", result.enrollment.id)
    
    return NextResponse.json({ 
      success: true,
      enrollment: result.enrollment,
      teacherLink: result.teacherStudent,
      message: `Successfully enrolled ${student.name} in ${program} - ${subject}`
    }, { status: 201 })
    
  } catch (error) {
    console.error("Failed to add enrollment:", error)
    return NextResponse.json({ 
      error: "Failed to add enrollment",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
