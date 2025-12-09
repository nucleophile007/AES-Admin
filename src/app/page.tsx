import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { allowedEmails } from '@/lib/adminConfig';
import type { Session } from 'next-auth';
import { Calendar, Users, GraduationCap, UserCircle, BookOpen, MessageSquare, Receipt, MessageSquareQuote } from "lucide-react";

export default async function HomePage() {
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

            <Link 
              href="/admin/feedback"
              className="block bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg p-6 hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Parent Feedback</h3>
                  <p className="text-pink-100">Review and respond to parent feedback</p>
                </div>
                <MessageSquare className="w-8 h-8 text-pink-200" />
              </div>
            </Link>

            <Link 
              href="/admin/transaction-receipts"
              className="block bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-6 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Transaction Receipts</h3>
                  <p className="text-emerald-100">Review and verify payment receipts</p>
                </div>
                <Receipt className="w-8 h-8 text-emerald-200" />
              </div>
            </Link>

            <Link 
              href="/admin/testimonials"
              className="block bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-6 hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Manage Testimonials</h3>
                  <p className="text-teal-100">Review and approve student testimonials</p>
                </div>
                <MessageSquareQuote className="w-8 h-8 text-teal-200" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
