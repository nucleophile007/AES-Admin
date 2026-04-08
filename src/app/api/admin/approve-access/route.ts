// // app/api/admin/approve-access/route.ts
// import { checkAdminAuth } from "@/lib/adminAuth"
// import prisma from "@/lib/prisma"

// export async function POST(req: Request) {
//   const authResult = await checkAdminAuth()

//   if (!authResult.success) {
//     return Response.json(
//       { error: authResult.error },
//       { status: authResult.statusCode || 403 }
//     )
//   }

//   const { requestId } = await req.json()

//   if (!requestId) {
//     return Response.json({ error: "Missing requestId" }, { status: 400 })
//   }

//   await prisma.accessRequest.update({
//     where: { id: requestId },
//     data: { approved: true },
//   })

//   return Response.json({ success: true })
// }
import { NextRequest, NextResponse } from "next/server"
import { Client } from "@upstash/qstash"
import prisma from "@/lib/prisma"
import { checkAdminAuth } from "@/lib/adminAuth"

// Initialize QStash client (same pattern as your other APIs)
const qstash = process.env.QSTASH_TOKEN
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null

export async function POST(req: NextRequest) {
  // 🔐 Admin authentication
  const authResult = await checkAdminAuth()

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { requestId } = await req.json()

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      )
    }

    // 🧠 Atomic approval transaction
    const approvedRequest = await prisma.$transaction(async (tx) => {
      const accessRequest = await tx.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          research: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      })

      if (!accessRequest) {
        throw new Error("Access request not found")
      }

      if (!accessRequest.approved) {
        await tx.accessRequest.update({
          where: { id: requestId },
          data: { approved: true },
        })
      }

      return accessRequest
    })

    // 📧 Queue approval email (non-blocking)
    if (qstash) {
      try {
        await qstash.publishJSON({
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-research-approval-email`,
          body: {
            email: approvedRequest.email,
            name: approvedRequest.name,
            researchTitle: approvedRequest.research.title,
            researchSlug: approvedRequest.research.slug,
          },
        })
      } catch (emailError) {
        // Email failure should NEVER block approval
        console.error("Failed to enqueue research approval email:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Research access approved successfully",
    })
  } catch (error) {
    console.error("Approve research access error:", error)

    return NextResponse.json(
      { error: "Failed to approve research access" },
      { status: 500 }
    )
  }
}
