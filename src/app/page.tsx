import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { allowedEmails } from '@/lib/adminConfig';
import prisma from '@/lib/prisma';
import DashboardView from '@/components/admin/DashboardView';

// Counts are cheap indexed queries; render fresh on every visit.
export const dynamic = 'force-dynamic';

/** A failing count shows "—" instead of breaking the whole dashboard. */
async function safeCount(query: () => Promise<number>): Promise<number | null> {
  try {
    return await query();
  } catch (error) {
    console.error('Dashboard count failed:', error);
    return null;
  }
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    redirect('/auth/signin');
  }

  const [students, pendingBookings, pendingReceipts, pendingFeedback] = await Promise.all([
    safeCount(() => prisma.student.count()),
    safeCount(() => prisma.mentorSlotBooking.count({ where: { status: 'PENDING' } })),
    safeCount(() => prisma.transactionReceipt.count({ where: { status: 'pending' } })),
    // Same rule as the Parent Feedback page's "Pending" filter: not approved yet.
    safeCount(() => prisma.feedback.count({ where: { isApproved: false } })),
  ]);

  return (
    <DashboardView
      user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
      counts={{ students, pendingBookings, pendingReceipts, pendingFeedback }}
    />
  );
}
