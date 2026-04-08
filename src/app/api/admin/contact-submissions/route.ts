import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/admin/contact-submissions
export async function GET(request: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    const where: { status?: string; source?: string } = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (source && source !== 'all') {
      where.source = source
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({
      submissions,
      count: submissions.length,
    })
  } catch (error) {
    console.error('Failed to fetch contact submissions:', error)
    return Response.json({ error: 'Failed to fetch contact submissions' }, { status: 500 })
  }
}
