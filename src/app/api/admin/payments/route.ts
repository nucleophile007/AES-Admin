import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'
import prisma from '@/lib/prisma';

// @ts-ignore - Prisma extension types
const db = prisma as any;

// GET: Fetch all payment records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get filter params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        Student: {
          select: {
            email: true,
            parentEmail: true,
          },
        },
        Enrollment: {
          select: {
            program: true,
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// PATCH: Update payment status
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      );
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : null,
      },
    });

    return NextResponse.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
