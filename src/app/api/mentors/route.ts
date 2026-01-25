import prisma from "@/lib/prisma"

// GET - Fetch all active mentors (public endpoint)
export async function GET() {
  try {
    const mentors = await prisma.mentor.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        role: true,
        workplace: true,
        education: true,
        institution: true,
        image: true,
        experience: true,
        specialties: true,
        achievements: true,
        bio: true,
        displayOrder: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return Response.json({ mentors })
  } catch (error) {
    console.error("Error fetching public mentors:", error)
    return Response.json({ error: "Failed to fetch mentors" }, { status: 500 })
  }
}
