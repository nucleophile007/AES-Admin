import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import db from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { section } = await request.json()
    const { id } = await params
    const testimonialId = parseInt(id)

    if (!section) {
      return NextResponse.json({ error: 'Section is required' }, { status: 400 })
    }

    // Valid section fields
    const validSections = ['contentApproved', 'ratingApproved', 'beforeAfterApproved', 'successStoryApproved', 'programsApproved']
    
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    // Get current value
    const testimonial = await db.testimonial.findUnique({
      where: { id: testimonialId },
      select: { [section]: true }
    })

    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }

    // Toggle the value
    const currentValue = testimonial[section as keyof typeof testimonial] as boolean
    const updated = await db.testimonial.update({
      where: { id: testimonialId },
      data: {
        [section]: !currentValue,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      [section]: updated[section as keyof typeof updated]
    })
  } catch (error) {
    console.error('Error toggling section approval:', error)
    return NextResponse.json({ error: 'Failed to toggle section approval' }, { status: 500 })
  }
}
