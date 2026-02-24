import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parentTestimonials = await prisma.feedback.findMany({
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json(parentTestimonials)
  } catch (error) {
    console.error('Error fetching parent testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent testimonials' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, isApproved } = await request.json()

    const updated = await prisma.feedback.update({
      where: { id },
      data: { 
        isApproved,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating parent testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to update parent testimonial' },
      { status: 500 }
    )
  }
}
