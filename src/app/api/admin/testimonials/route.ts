import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// @ts-ignore - Prisma extension types issue with testimonial model
const db = prisma as any

// GET /api/admin/testimonials - Fetch all testimonials
export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testimonials = await db.testimonial.findMany({
      include: {
        Student: {
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
        submittedAt: 'desc',
      },
    })

    // Transform and merge Student relation with direct fields
    const transformedTestimonials = testimonials.map((testimonial: any) => ({
      ...testimonial,
      // Use linked Student data if available, otherwise use direct fields
      student: testimonial.Student || {
        id: null,
        name: testimonial.studentName || 'N/A',
        email: null,
        grade: testimonial.grade || 'N/A',
        schoolName: testimonial.school || 'N/A',
        parentName: null,
        parentEmail: null,
        parentPhone: null,
        program: testimonial.programs?.join(', ') || 'N/A',
      },
      Student: undefined, // Remove uppercase field
    }))

    return NextResponse.json(transformedTestimonials)
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
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testimonialId, isApproved, isVisible } = body

    if (!testimonialId) {
      return NextResponse.json(
        { error: 'testimonialId is required' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}
    if (typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved
    }
    if (typeof isVisible === 'boolean') {
      updateData.isVisible = isVisible
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one of isApproved or isVisible must be provided' },
        { status: 400 }
      )
    }

    const updatedTestimonial = await db.testimonial.update({
      where: { id: testimonialId },
      data: updateData,
      include: {
        Student: {
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

// PUT /api/admin/testimonials - Update any testimonial field
export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testimonialId, ...updateData } = body

    if (!testimonialId) {
      return NextResponse.json(
        { error: 'testimonialId is required' },
        { status: 400 }
      )
    }

    // Remove undefined and empty string values
    const cleanedData: any = {}
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        cleanedData[key] = value
      }
    })

    // Handle updatedAt timestamp
    cleanedData.updatedAt = new Date()

    if (Object.keys(cleanedData).length === 1) { // Only updatedAt
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      )
    }

    const updatedTestimonial = await db.testimonial.update({
      where: { id: testimonialId },
      data: cleanedData,
      include: {
        Student: {
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

// DELETE /api/admin/testimonials - Delete a testimonial
export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testimonialId = searchParams.get('id')

    if (!testimonialId) {
      return NextResponse.json(
        { error: 'testimonialId is required' },
        { status: 400 }
      )
    }

    await db.testimonial.delete({
      where: { id: parseInt(testimonialId) },
    })

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
}
