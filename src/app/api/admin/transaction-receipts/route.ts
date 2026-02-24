import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// GET /api/admin/transaction-receipts
export async function GET(request: NextRequest) {
  // Verify admin permissions
  const session = await auth()
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // Filter by status: pending, verified, rejected

    const where = status && status !== "all" ? { status } : {}

    // Get all transaction receipts from the database
    const receipts = await prisma.transactionReceipt.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    })
    
    return NextResponse.json({ receipts }, { status: 200 })
  } catch (error) {
    console.error("Failed to get transaction receipts:", error)
    return NextResponse.json({ error: "Failed to get transaction receipts" }, { status: 500 })
  }
}

