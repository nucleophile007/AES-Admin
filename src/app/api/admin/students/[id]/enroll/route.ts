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
    const { program, subject, teacherId, teacherIds } = await request.json()
    const selectedTeacherIds = Array.from(
      new Set(
        (Array.isArray(teacherIds) ? teacherIds : [teacherId])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    )
    
    // Validate required fields
    if (!program || !subject || selectedTeacherIds.length === 0) {
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
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: selectedTeacherIds } },
      select: { id: true, programs: true },
    })

    if (teachers.length !== selectedTeacherIds.length) {
      return NextResponse.json({ error: "One or more selected teachers were not found" }, { status: 404 })
    }

    const teachersForProgram = teachers.filter((teacher) => teacher.programs.includes(program))
    if (teachersForProgram.length !== teachers.length) {
      return NextResponse.json(
        { error: "Each selected teacher must be assigned to the selected program" },
        { status: 400 }
      )
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

      const teacherStudents = await Promise.all(
        selectedTeacherIds.map((selectedTeacherId) =>
          tx.teacherStudent.upsert({
            where: {
              teacherId_studentId_program: {
                teacherId: selectedTeacherId,
                studentId,
                program,
              },
            },
            update: {},
            create: {
              teacherId: selectedTeacherId,
              studentId,
              program,
            },
          })
        )
      )

      return { enrollment, teacherStudents }
    })
    
    console.log("Enrollment added successfully:", result.enrollment.id)
    
    return NextResponse.json({ 
      success: true,
      enrollment: result.enrollment,
      teacherLink: result.teacherStudents[0],
      teacherLinks: result.teacherStudents,
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
