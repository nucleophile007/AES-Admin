import { NextRequest, NextResponse } from "next/server"
import { auth } from '@/auth'
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// PATCH /api/admin/transaction-receipts/[id]
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
    const { status, adminNotes } = await request.json()
    
    // Check if receipt exists
    const existingReceipt = await prisma.transactionReceipt.findUnique({
      where: { id }
    })

    if (!existingReceipt) {
      return NextResponse.json({ error: "Transaction receipt not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === "verified" || status === "rejected") {
        updateData.reviewedAt = new Date()
      }
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    // Update transaction receipt
    const updatedReceipt = await prisma.transactionReceipt.update({
      where: { id },
      data: updateData
    })

    // Send email notification if status changed to verified or rejected
    if (status && (status === "verified" || status === "rejected")) {
      try {
        // Determine the base URL for API calls
        const host = request.headers.get("host")
        const protocol = request.headers.get("x-forwarded-proto") || "http"
        const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000"
        
        console.log("Sending transaction receipt status email via:", `${baseUrl}/api/jobs/send-transaction-receipt-status-email`)
        
        // Send the email via our email API route
        const emailRes = await fetch(`${baseUrl}/api/jobs/send-transaction-receipt-status-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: updatedReceipt.parentEmail,
            parentName: updatedReceipt.parentName,
            amount: updatedReceipt.amount,
            transactionDate: updatedReceipt.transactionDate,
            transactionId: updatedReceipt.transactionId,
            status: status,
            adminNotes: adminNotes || undefined
          })
        })
        
        // Log email result but don't fail the request if email fails
        if (!emailRes.ok) {
          try {
            const errorData = await emailRes.text()
            console.error("Failed to send transaction receipt status email:", errorData)
          } catch (parseError) {
            console.error("Failed to send transaction receipt status email. Status:", emailRes.status)
          }
        } else {
          try {
            const emailResult = await emailRes.json()
            console.log("Transaction receipt status email sent successfully:", emailResult)
          } catch (parseError) {
            console.log("Transaction receipt status email sent (response couldn't be parsed)")
          }
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error("Failed to send transaction receipt status email:", emailError)
      }
    }

    return NextResponse.json({ receipt: updatedReceipt }, { status: 200 })
  } catch (error) {
    console.error("Failed to update transaction receipt:", error)
    return NextResponse.json({ error: "Failed to update transaction receipt" }, { status: 500 })
  }
}

