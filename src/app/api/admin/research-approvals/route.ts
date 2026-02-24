import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"

export async function GET() {
  // 1️⃣ Admin authentication
  const auth = await checkAdminAuth()
  if (!auth.success) {
    return Response.json(
      { error: auth.error },
      { status: auth.statusCode || 403 }
    )
  }

  // 2️⃣ Fetch ONLY pending requests
  const requests = await prisma.accessRequest.findMany({
    where: {
      approved: false,
    },
    include: {
      Research: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // 3️⃣ Return to frontend
  return Response.json({ requests })
}
