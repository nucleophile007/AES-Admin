import Link from 'next/link';
import { CalendarDays, CheckSquare, GraduationCap, MessageSquare, Receipt, Users } from 'lucide-react';
import AdminTopBar from '@/components/admin/AdminTopBar';
import StatCard from '@/components/admin/StatCard';
import DashboardModules from '@/components/admin/DashboardModules';
import type { ModuleBadge } from '@/components/admin/ModuleCard';

export type DashboardCounts = {
  students: number | null;
  pendingBookings: number | null;
  pendingReceipts: number | null;
  newFeedback: number | null;
};

type DashboardViewProps = {
  user: { name?: string | null; email?: string | null; image?: string | null };
  counts: DashboardCounts;
};

export default function DashboardView({ user, counts }: DashboardViewProps) {
  const { students, pendingBookings, pendingReceipts, newFeedback } = counts;

  const badges: Record<string, ModuleBadge> = {};
  if (pendingBookings) badges['mentor-calendar'] = { count: pendingBookings, label: 'pending' };
  if (pendingReceipts) badges['transaction-receipts'] = { count: pendingReceipts, label: 'to review' };
  if (newFeedback) badges['feedback'] = { count: newFeedback, label: 'new' };

  const firstName = (user.name || '').trim().split(/\s+/)[0] || 'there';

  return (
    <div className="min-h-screen bg-canvas">
      <AdminTopBar name={user.name} email={user.email} image={user.image} />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative mt-8 overflow-hidden rounded-2xl bg-brand-950 px-6 py-8 text-white shadow-pop sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_80%_at_95%_10%,rgba(59,95,219,0.45),transparent_70%),radial-gradient(40%_70%_at_0%_100%,rgba(39,71,192,0.35),transparent_70%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'linear-gradient(to left, black, transparent 70%)',
              WebkitMaskImage: 'linear-gradient(to left, black, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Admin dashboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {firstName}</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-100/80 sm:text-base">
                Manage sessions, people, payments and website content for Acharya Educational Services from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/session-approval"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold-400 px-4 text-sm font-semibold text-brand-950 shadow-[0_6px_20px_-6px_rgba(244,190,74,0.6)] transition hover:bg-gold-300"
              >
                <Users className="h-4 w-4" />
                Session approvals
              </Link>
              <Link
                href="/admin/tasks"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                <CheckSquare className="h-4 w-4" />
                Task board
              </Link>
            </div>
          </div>
        </section>

        {/* Key numbers */}
        <section aria-label="Overview" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Students"
            value={students}
            hint="Registered student accounts"
            href="/admin/students"
            icon={GraduationCap}
          />
          <StatCard
            label="Booking requests"
            value={pendingBookings}
            hint={pendingBookings ? 'Waiting for mentor approval' : 'Nothing pending'}
            href="/admin/mentor-calendar"
            icon={CalendarDays}
            attention
          />
          <StatCard
            label="Receipts to review"
            value={pendingReceipts}
            hint={pendingReceipts ? 'Payments awaiting verification' : 'All receipts reviewed'}
            href="/admin/transaction-receipts"
            icon={Receipt}
            attention
          />
          <StatCard
            label="New feedback"
            value={newFeedback}
            hint={newFeedback ? 'Parent feedback not yet reviewed' : 'Inbox is clear'}
            href="/admin/feedback"
            icon={MessageSquare}
            attention
          />
        </section>

        {/* Modules */}
        <section className="mt-10">
          <DashboardModules
            badges={badges}
            storageKey={`acharya-admin:dashboard-layout:v2:${(user.email || 'admin').toLowerCase()}`}
          />
        </section>
      </main>
    </div>
  );
}
