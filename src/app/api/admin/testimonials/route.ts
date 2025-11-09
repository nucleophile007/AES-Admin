import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

// @ts-ignore - Prisma extension types issue with testimonial model
const db = prisma as any

// GET /api/admin/testimonials - Fetch all testimonials
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testimonials = await db.testimonial.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            schoolName: true,
            parentName: true,
            parentEmail: true,
            parentPhone: true,
            program: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/testimonials - Update testimonial approval status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testimonialId, isApproved } = body

    if (!testimonialId || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'testimonialId and isApproved are required' },
        { status: 400 }
      )
    }

    const updatedTestimonial = await db.testimonial.update({
      where: { id: testimonialId },
      data: { isApproved },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      testimonial: updatedTestimonial,
    })
  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    )
  }
}
