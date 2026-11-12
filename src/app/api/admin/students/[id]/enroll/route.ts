import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

const isAdmin = async () => {
  const session = await auth()
  return Boolean(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))
}

const teacherIdsFrom = (values: unknown) => Array.from(new Set(
  (Array.isArray(values) ? values : [])
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0),
))

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  try {
    const studentId = Number((await params).id)
    const { program, subject, teacherId, teacherIds } = await request.json()
    const selectedTeacherIds = teacherIdsFrom(Array.isArray(teacherIds) ? teacherIds : [teacherId])
    if (!Number.isInteger(studentId) || !program || !subject || !selectedTeacherIds.length) {
      return NextResponse.json({ error: "Program, subject, and at least one teacher are required" }, { status: 400 })
    }
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    const teachers = await prisma.teacher.findMany({ where: { id: { in: selectedTeacherIds } }, select: { id: true } })
    if (teachers.length !== selectedTeacherIds.length) {
      return NextResponse.json({ error: "One or more selected mentors were not found" }, { status: 404 })
    }
    const existing = await prisma.enrollment.findUnique({ where: { studentId_program_subject: { studentId, program, subject } } })
    if (existing) return NextResponse.json({ error: "Student is already enrolled in this program and subject" }, { status: 409 })
    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({ data: { studentId, program, subject, isActive: true } })
      const teacherLinks = []
      for (const teacherId of selectedTeacherIds) {
        teacherLinks.push(await tx.teacherStudent.upsert({
          where: { teacherId_studentId_program: { teacherId, studentId, program } },
          update: {},
          create: { teacherId, studentId, program },
        }))
      }
      return { enrollment, teacherLinks }
    }, { maxWait: 10000, timeout: 15000 })
    return NextResponse.json({ success: true, ...result, teacherLink: result.teacherLinks[0] }, { status: 201 })
  } catch (error) {
    console.error("Failed to add enrollment:", error)
    return NextResponse.json({
      error: "Failed to add enrollment",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  try {
    const studentId = Number((await params).id)
    const { enrollmentId, program, subject, teacherIds } = await request.json()
    const id = Number(enrollmentId)
    const selectedTeacherIds = teacherIdsFrom(teacherIds)
    if (!Number.isInteger(studentId) || !Number.isInteger(id) || !program || !subject || !selectedTeacherIds.length) {
      return NextResponse.json({ error: "Enrollment, program, subject, and at least one teacher are required" }, { status: 400 })
    }
    const enrollment = await prisma.enrollment.findFirst({ where: { id, studentId } })
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    const teachers = await prisma.teacher.findMany({ where: { id: { in: selectedTeacherIds } }, select: { id: true } })
    if (teachers.length !== selectedTeacherIds.length) {
      return NextResponse.json({ error: "One or more selected mentors were not found" }, { status: 404 })
    }
    const duplicate = await prisma.enrollment.findFirst({ where: { studentId, program, subject, id: { not: id } }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "Another enrollment already uses this program and subject" }, { status: 409 })
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { program: true } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    const result = await prisma.$transaction(async (tx) => {
      const updatedEnrollment = await tx.enrollment.update({ where: { id }, data: { program, subject } })
      const remainingOldProgram = await tx.enrollment.count({ where: { studentId, program: enrollment.program, id: { not: id } } })
      if (!remainingOldProgram) await tx.teacherStudent.deleteMany({ where: { studentId, program: enrollment.program } })
      const teacherLinks = await Promise.all(selectedTeacherIds.map((teacherId) => tx.teacherStudent.upsert({
        where: { teacherId_studentId_program: { teacherId, studentId, program } },
        update: {},
        create: { teacherId, studentId, program },
      })))
      if (student.program === enrollment.program) await tx.student.update({ where: { id: studentId }, data: { program } })
      return { updatedEnrollment, teacherLinks }
    }, { maxWait: 10000, timeout: 15000 })
    return NextResponse.json({ success: true, enrollment: result.updatedEnrollment, teacherLinks: result.teacherLinks })
  } catch (error) {
    console.error("Failed to update enrollment:", {
      error: error instanceof Error ? error.message : String(error),
      code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    })
    return NextResponse.json({
      error: "Failed to update enrollment",
      details: error instanceof Error ? error.message : String(error),
      code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  try {
    const studentId = Number((await params).id)
    const enrollmentId = Number(request.nextUrl.searchParams.get("enrollmentId"))
    if (!Number.isInteger(studentId) || !Number.isInteger(enrollmentId)) {
      return NextResponse.json({ error: "Valid student and enrollment IDs are required" }, { status: 400 })
    }
    const enrollment = await prisma.enrollment.findFirst({ where: { id: enrollmentId, studentId } })
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    if (await prisma.enrollment.count({ where: { studentId } }) <= 1) {
      return NextResponse.json({ error: "A student must keep at least one enrollment" }, { status: 400 })
    }
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.delete({ where: { id: enrollmentId } })
      if (!await tx.enrollment.count({ where: { studentId, program: enrollment.program } })) {
        await tx.teacherStudent.deleteMany({ where: { studentId, program: enrollment.program } })
      }
      const student = await tx.student.findUnique({ where: { id: studentId }, select: { program: true } })
      if (student?.program === enrollment.program) {
        const replacement = await tx.enrollment.findFirst({ where: { studentId }, orderBy: { startDate: "asc" }, select: { program: true } })
        if (replacement) await tx.student.update({ where: { id: studentId }, data: { program: replacement.program } })
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete enrollment:", error)
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 })
  }
}
