import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { allowedEmails } from '@/lib/adminConfig';
import type { Session } from 'next-auth';

export default async function AdminPage() {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-700">Welcome back, {session.user.name}!</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Programs</h3>
              <p className="text-3xl font-bold text-blue-700">6</p>
              <p className="text-sm text-blue-600 mt-1">Active tutoring programs</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Availability</h3>
              <p className="text-3xl font-bold text-green-700">✓</p>
              <p className="text-sm text-green-600 mt-1">Management system</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Email System</h3>
              <p className="text-3xl font-bold text-purple-700">✓</p>
              <p className="text-sm text-purple-600 mt-1">QStash notifications</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/admin/availability"
              className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Manage Availability</h3>
                  <p className="text-blue-100">Set available time slots for all programs</p>
                </div>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </Link>

            <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg p-6 opacity-75">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Booking Management</h3>
                  <p className="text-gray-200">View and manage student bookings</p>
                  <p className="text-sm text-gray-300 mt-2">Coming Soon</p>
                </div>
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Programs List */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Academic Tutoring',
                'College Prep',
                'SAT Coaching',
                'Research Program',
                'Olympiads',
                'Profile Building'
              ].map((program) => (
                <div key={program} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{program}</h3>
                  <p className="text-sm text-gray-700 mt-1 font-medium">Active program</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}