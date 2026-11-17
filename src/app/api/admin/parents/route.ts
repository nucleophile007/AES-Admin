import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

const isAdmin = async () => {
  const session = await auth()
  return Boolean(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })

  try {
    const parents = await prisma.parentAccount.findMany({
      include: {
        students: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ parents })
  } catch (error) {
    console.error("Failed to get parents:", error)
    return NextResponse.json({ error: "Failed to get parents" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 })

  try {
    const { id, name, email, phone } = await request.json()
    const parentId = Number(id)
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
    const normalizedPhone = typeof phone === "string" ? phone.trim() : ""

    if (!Number.isInteger(parentId) || parentId <= 0 || !normalizedName || !normalizedEmail) {
      return NextResponse.json({ error: "Parent ID, name, and email are required" }, { status: 400 })
    }

    const parent = await prisma.parentAccount.findUnique({ where: { id: parentId } })
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 })

    const duplicate = await prisma.parentAccount.findUnique({ where: { email: normalizedEmail } })
    if (duplicate && duplicate.id !== parentId) {
      return NextResponse.json({ error: "Another parent already uses this email" }, { status: 409 })
    }

    const updatedParent = await prisma.$transaction(async (tx) => {
      const updated = await tx.parentAccount.update({
        where: { id: parentId },
        data: { name: normalizedName, email: normalizedEmail, phone: normalizedPhone || null },
        include: { students: { select: { id: true, name: true, email: true } } },
      })
      await tx.student.updateMany({
        where: { parentAccountId: parentId },
        data: { parentName: normalizedName, parentEmail: normalizedEmail, parentPhone: normalizedPhone },
      })
      return updated
    })

    return NextResponse.json({ parent: updatedParent })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Another parent already uses this email" }, { status: 409 })
    }
    console.error("Failed to update parent:", error)
    return NextResponse.json({ error: "Failed to update parent" }, { status: 500 })
  }
}
