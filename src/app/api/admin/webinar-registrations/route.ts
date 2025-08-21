import { checkAdminAuth } from '@/lib/adminAuth'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  // Validate admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    // Fetch webinar registrations from the database
    const registrations = await prisma.webinarRegistration.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const totalCount = registrations.length
    const pendingCount = registrations.filter(r => !r.approved).length
    const approvedCount = registrations.filter(r => r.approved).length

    return Response.json({ 
      registrations,
      totalCount,
      pendingCount,
      approvedCount,
      adminUser: authResult.session?.user?.email
    })
  } catch (error) {
    console.error('Error fetching webinar registrations:', error)
    return Response.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
