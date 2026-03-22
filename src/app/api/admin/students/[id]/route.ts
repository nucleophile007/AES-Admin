import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/students/[id]
export async function GET(
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
    const id = parseInt(paramId)
    
    // Get student by ID
    const student = await prisma.student.findUnique({
      where: { id }
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    return NextResponse.json({ student }, { status: 200 })
  } catch (error) {
    console.error("Failed to get student:", error)
    return NextResponse.json({ error: "Failed to get student" }, { status: 500 })
  }
}

// PATCH /api/admin/students/[id] - Update student details
export async function PATCH(
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
    const id = parseInt(paramId)
    if (Number.isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }

    const data = await request.json()

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const blockedFields = [
      "id",
      "password",
      "isActivated",
      "parentAccountId",
      "createdAt",
      "updatedAt"
    ]
    const attemptedBlockedFields = Object.keys(data).filter((key) => blockedFields.includes(key))

    if (attemptedBlockedFields.length > 0) {
      return NextResponse.json(
        {
          error: `These fields cannot be updated: ${attemptedBlockedFields.join(", ")}`
        },
        { status: 400 }
      )
    }

    const toTrimmedString = (value: unknown) => {
      if (typeof value !== "string") return null
      const trimmed = value.trim()
      return trimmed.length ? trimmed : null
    }

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

    const studentUpdateData: {
      name?: string
      email?: string
      grade?: string
      graduationYear?: number | null
      schoolName?: string
      program?: string
    } = {}
    const parentUpdateDataForStudent: Record<string, string> = {}
    const parentAccountUpdateData: Record<string, string> = {}

    if ("name" in data) {
      const value = toTrimmedString(data.name)
      if (!value) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
      }
      studentUpdateData.name = value
    }

    if ("email" in data) {
      const value = toTrimmedString(data.email)?.toLowerCase()
      if (!value) {
        return NextResponse.json({ error: "Student email is required" }, { status: 400 })
      }
      studentUpdateData.email = value
    }

    if ("grade" in data) {
      const value = toTrimmedString(data.grade)
      if (!value) {
        return NextResponse.json({ error: "Grade is required" }, { status: 400 })
      }
      studentUpdateData.grade = value
    }

    if ("graduationYear" in data) {
      const graduationYearResult = normalizeGraduationYear(data.graduationYear)
      if (graduationYearResult.error) {
        return NextResponse.json({ error: graduationYearResult.error }, { status: 400 })
      }
      studentUpdateData.graduationYear = graduationYearResult.value
    }

    if ("schoolName" in data) {
      const value = toTrimmedString(data.schoolName)
      if (!value) {
        return NextResponse.json({ error: "School name is required" }, { status: 400 })
      }
      studentUpdateData.schoolName = value
    }

    if ("program" in data) {
      const value = toTrimmedString(data.program)
      if (!value) {
        return NextResponse.json({ error: "Program is required" }, { status: 400 })
      }
      studentUpdateData.program = value
    }

    if ("parentName" in data) {
      const value = toTrimmedString(data.parentName)
      if (!value) {
        return NextResponse.json({ error: "Parent name is required" }, { status: 400 })
      }
      parentUpdateDataForStudent.parentName = value
      parentAccountUpdateData.name = value
    }

    if ("parentEmail" in data) {
      const value = toTrimmedString(data.parentEmail)?.toLowerCase()
      if (!value) {
        return NextResponse.json({ error: "Parent email is required" }, { status: 400 })
      }
      parentUpdateDataForStudent.parentEmail = value
      parentAccountUpdateData.email = value
    }

    if ("parentPhone" in data) {
      const value = toTrimmedString(data.parentPhone)
      if (!value) {
        return NextResponse.json({ error: "Parent phone is required" }, { status: 400 })
      }
      parentUpdateDataForStudent.parentPhone = value
      parentAccountUpdateData.phone = value
    }

    if (
      Object.keys(studentUpdateData).length === 0 &&
      Object.keys(parentUpdateDataForStudent).length === 0
    ) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      )
    }
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        parentAccount: true
      }
    })
    
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (typeof studentUpdateData.email === "string" && studentUpdateData.email !== existingStudent.email) {
      const existingEmail = await prisma.student.findUnique({
        where: { email: studentUpdateData.email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: "Student with this email already exists" },
          { status: 409 }
        )
      }
    }

    if (
      parentAccountUpdateData.email &&
      existingStudent.parentAccountId
    ) {
      const existingParentAccount = await prisma.parentAccount.findUnique({
        where: { email: parentAccountUpdateData.email }
      })

      if (
        existingParentAccount &&
        existingParentAccount.id !== existingStudent.parentAccountId
      ) {
        return NextResponse.json(
          { error: "Parent account with this email already exists" },
          { status: 409 }
        )
      }
    }
    
    // Update student
    const updateResult = await prisma.$transaction(async (tx) => {
      let updatedParentAccount = null

      if (
        existingStudent.parentAccountId &&
        Object.keys(parentAccountUpdateData).length > 0
      ) {
        updatedParentAccount = await tx.parentAccount.update({
          where: { id: existingStudent.parentAccountId },
          data: parentAccountUpdateData
        })
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          ...studentUpdateData,
          ...parentUpdateDataForStudent
        }
      })

      return { updatedStudent, updatedParentAccount }
    })
    
    return NextResponse.json(
      {
        student: updateResult.updatedStudent,
        parentAccount: updateResult.updatedParentAccount
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A record with this email already exists" },
        { status: 409 }
      )
    }

    console.error("Failed to update student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

// DELETE /api/admin/students/[id] - Delete student
export async function DELETE(
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
    const id = parseInt(paramId)
    if (Number.isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 })
    }
    
    const deleteResult = await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.student.findUnique({
        where: { id },
        select: {
          id: true,
          parentAccountId: true
        }
      })

      if (!existingStudent) {
        return { notFound: true as const }
      }

      await tx.student.delete({
        where: { id: existingStudent.id }
      })

      let deletedParentAccount = false
      let parentAccountId: number | null = existingStudent.parentAccountId

      if (existingStudent.parentAccountId) {
        const remainingStudents = await tx.student.count({
          where: { parentAccountId: existingStudent.parentAccountId }
        })

        if (remainingStudents === 0) {
          await tx.parentAccount.delete({
            where: { id: existingStudent.parentAccountId }
          })
          deletedParentAccount = true
        }
      }

      return {
        notFound: false as const,
        deletedStudentId: existingStudent.id,
        parentAccountId,
        deletedParentAccount
      }
    })

    if (deleteResult.notFound) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    return NextResponse.json(
      {
        success: true,
        deletedStudentId: deleteResult.deletedStudentId,
        parentAccountId: deleteResult.parentAccountId,
        deletedParentAccount: deleteResult.deletedParentAccount
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to delete student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}