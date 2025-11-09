import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { allowedEmails } from '@/lib/adminConfig';
import type { Session } from 'next-auth';
import { Calendar, Users, GraduationCap, UserCircle, BookOpen } from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/admin/availability"
              className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Manage Availability</h3>
                  <p className="text-blue-100">Set available time slots for all programs</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </Link>

            <Link 
              href="/admin/session-approval"
              className="block bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Session Approval</h3>
                  <p className="text-purple-100">View and approve session requests</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </Link>

            <Link 
              href="/admin/students"
              className="block bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Students</h3>
                  <p className="text-green-100">Manage student accounts and activations</p>
                </div>
                <GraduationCap className="w-8 h-8 text-green-200" />
              </div>
            </Link>

            <Link 
              href="/admin/teachers"
              className="block bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Teachers</h3>
                  <p className="text-orange-100">Manage teacher accounts and programs</p>
                </div>
                <UserCircle className="w-8 h-8 text-orange-200" />
              </div>
            </Link>

            <Link 
              href="/admin/enrollments"
              className="block bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Enrollments</h3>
                  <p className="text-indigo-100">Manage student enrollments and access</p>
                </div>
                <BookOpen className="w-8 h-8 text-indigo-200" />
              </div>
            </Link>
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