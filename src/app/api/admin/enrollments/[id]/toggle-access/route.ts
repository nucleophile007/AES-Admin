import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { access } = body

    if (!access || (access !== 'blocked' && access !== 'unblocked')) {
      return NextResponse.json(
        { error: 'Invalid access value. Must be "blocked" or "unblocked"' },
        { status: 400 }
      )
    }

    // Update enrollment access
    const enrollment = await prisma.enrollment.update({
      where: {
        id: parseInt(id),
      },
      data: {
        access: access,
      },
      include: {
        student: {
          select: {
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Enrollment ${access} successfully`,
      enrollment,
    })
  } catch (error) {
    console.error('Error updating enrollment access:', error)
    return NextResponse.json(
      { error: 'Failed to update enrollment access' },
      { status: 500 }
    )
  }
}
