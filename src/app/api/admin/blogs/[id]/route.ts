import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'
import prisma from '@/lib/prisma'

// GET - Fetch single blog
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            schoolName: true,
          },
        },
      },
    })

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error('Error fetching blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    )
  }
}

// PATCH - Update blog
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      abstract,
      externalUrl,
      studentId,
      studentPhoto,
      publicationYear,
      publicationMonth,
      isApproved,
      published,
    } = body

    // Check if blog exists
    const existingBlog = await prisma.blog.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingBlog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    // Validation for month if provided
    if (publicationMonth !== undefined && (publicationMonth < 1 || publicationMonth > 12)) {
      return NextResponse.json(
        { error: 'Publication month must be between 1 and 12' },
        { status: 400 }
      )
    }

    // URL validation if provided
    if (externalUrl) {
      try {
        new URL(externalUrl)
      } catch {
        return NextResponse.json(
          { error: 'Invalid external URL format' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (abstract !== undefined) updateData.abstract = abstract
    if (externalUrl !== undefined) updateData.externalUrl = externalUrl
    if (studentId !== undefined) updateData.studentId = studentId || null
    if (studentPhoto !== undefined) updateData.studentPhoto = studentPhoto
    if (publicationYear !== undefined) updateData.publicationYear = parseInt(publicationYear)
    if (publicationMonth !== undefined) updateData.publicationMonth = parseInt(publicationMonth)
    if (published !== undefined) updateData.published = published

    // Handle approval status change
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved
      // Set approvedAt timestamp if being approved
      if (isApproved && !existingBlog.isApproved) {
        updateData.approvedAt = new Date()
      }
      // Clear approvedAt if being unapproved
      if (!isApproved && existingBlog.isApproved) {
        updateData.approvedAt = null
      }
    }

    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            schoolName: true,
          },
        },
      },
    })

    return NextResponse.json(blog)
  } catch (error) {
    console.error('Error updating blog:', error)
    return NextResponse.json(
      { error: 'Failed to update blog', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete blog
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await params
    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) },
    })

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      )
    }

    await prisma.blog.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    )
  }
}
