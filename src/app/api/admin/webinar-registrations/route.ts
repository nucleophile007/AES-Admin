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
    const adminEmail = authResult.session!.user!.email!

    // Helper function to parse preferred time
    function parsePreferred(preferredTime: string): { date: string | null; time: string | null } {
      if (!preferredTime) return { date: null, time: null }
      const parts = preferredTime.split(' at ')
      if (parts.length !== 2) return { date: null, time: null }
      const [date, time] = parts
      return { date, time }
    }

    // Fetch all webinar registrations
    const allRegistrations = await prisma.webinarRegistration.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Get admin's availability days to check what they can see
    const adminAvailability = await prisma.availabilityDay.findMany({
      where: { adminEmail }
    })

    // Filter registrations to only show those where:
    // 1. The admin has availability for that date/time/program, OR
    // 2. The admin has already approved this registration
    const relevantRegistrations = allRegistrations.filter(reg => {
      // If admin already approved it, always show it
      if (reg.approved && reg.adminEmail === adminEmail) {
        return true
      }

      // Parse the registration's preferred time
      const { date, time } = parsePreferred(reg.preferredTime)
      if (!date || !time || !reg.program) {
        return false
      }

      // Check if admin has availability for this date/time/program
      const availabilityDay = adminAvailability.find(day => 
        day.date === date && day.program === reg.program
      )

      if (!availabilityDay) {
        return false
      }

      // Check if the specific time slot is available
      const availableTimes = (availabilityDay.times as string[]) || []
      return availableTimes.includes(time)
    })

    const totalCount = relevantRegistrations.length
    const pendingCount = relevantRegistrations.filter(r => !r.approved).length
    const approvedCount = relevantRegistrations.filter(r => r.approved).length

    return Response.json({ 
      registrations: relevantRegistrations,
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
