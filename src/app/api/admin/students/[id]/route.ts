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
    const data = await request.json()
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })
    
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data
    })
    
    return NextResponse.json({ student: updatedStudent }, { status: 200 })
  } catch (error) {
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
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })
    
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Delete student
    await prisma.student.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Failed to delete student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}