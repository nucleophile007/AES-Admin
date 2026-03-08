import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'
import prisma from '@/lib/prisma'

// GET - Fetch all blogs with student data
export async function GET() {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const blogs = await prisma.blog.findMany({
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
      orderBy: [
        { publicationYear: 'desc' },
        { publicationMonth: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(blogs)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    )
  }
}

// POST - Create new blog
export async function POST(request: Request) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
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

    // Validation
    if (!title || !abstract || !externalUrl) {
      return NextResponse.json(
        { error: 'Title, abstract, and external URL are required' },
        { status: 400 }
      )
    }

    if (!publicationYear || !publicationMonth) {
      return NextResponse.json(
        { error: 'Publication year and month are required' },
        { status: 400 }
      )
    }

    if (publicationMonth < 1 || publicationMonth > 12) {
      return NextResponse.json(
        { error: 'Publication month must be between 1 and 12' },
        { status: 400 }
      )
    }

    // URL validation
    try {
      new URL(externalUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid external URL format' },
        { status: 400 }
      )
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        abstract,
        externalUrl,
        studentId: studentId || null,
        studentPhoto,
        publicationYear: parseInt(publicationYear),
        publicationMonth: parseInt(publicationMonth),
        isApproved: isApproved || false,
        published: published || false,
        approvedAt: isApproved ? new Date() : null,
      },
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

    return NextResponse.json(blog, { status: 201 })
  } catch (error) {
    console.error('Error creating blog:', error)
    return NextResponse.json(
      { error: 'Failed to create blog', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
