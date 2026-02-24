import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/teachers/[id]
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
    
    // Get teacher by ID
    const teacher = await prisma.teacher.findUnique({
      where: { id }
    })
    
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    
    return NextResponse.json({ teacher }, { status: 200 })
  } catch (error) {
    console.error("Failed to get teacher:", error)
    return NextResponse.json({ error: "Failed to get teacher" }, { status: 500 })
  }
}

// PATCH /api/admin/teachers/[id] - Update teacher details
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
    
    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id }
    })
    
    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    
    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data
    })
    
    return NextResponse.json({ teacher: updatedTeacher }, { status: 200 })
  } catch (error) {
    console.error("Failed to update teacher:", error)
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 })
  }
}

// DELETE /api/admin/teachers/[id] - Delete teacher
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
    
    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id }
    })
    
    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    
    // Delete teacher
    await prisma.teacher.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Failed to delete teacher:", error)
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 })
  }
}