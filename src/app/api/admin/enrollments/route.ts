import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'

// Fetch all enrollments with student and teacher information 
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all enrollments with related student information
    const enrollments = await prisma.enrollment.findMany({
      select: {
        id: true,
        studentId: true,
        program: true,
        subject: true,
        access: true,
        student: {
          select: {
            id: true,
            email: true,
            parentEmail: true,
            teacherLinks: {
              include: {
                teacher: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    // Transform the data to match the expected format
    const formattedEnrollments = enrollments.map((enrollment: {
      id: number;
      studentId: number;
      program: string;
      subject: string;
      access: string;
      student: {
        email: string;
        parentEmail: string | null;
        teacherLinks: Array<{
          program: string;
          teacher: {
            name: string;
          };
        }>;
      };
    }) => ({
      id: enrollment.id,
      studentId: enrollment.studentId,
      program: enrollment.program,
      subject: enrollment.subject,
      access: enrollment.access,
      student: {
        email: enrollment.student.email,
        parentEmail: enrollment.student.parentEmail,
      },
      teacherStudents: enrollment.student.teacherLinks
        .filter((link) => link.program === enrollment.program)
        .map((link) => ({
          teacher: {
            name: link.teacher.name,
          },
        })),
    }))

    return NextResponse.json({
      enrollments: formattedEnrollments,
      count: formattedEnrollments.length
    })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
