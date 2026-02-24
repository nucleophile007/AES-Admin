import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { allowedEmails } from '@/lib/adminConfig';
import type { Session } from 'next-auth';
import { Calendar, Users, GraduationCap, UserCircle, BookOpen, MessageSquare, Receipt, MessageSquareQuote, Award, CalendarDays } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-blue-100 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
                  Acharya Admin
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Admin Dashboard
                </h1>
                <p className="text-gray-700">
                  Welcome back, <span className="font-semibold text-blue-700">{session.user.name}</span>!
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-4 py-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 mr-1" />
                <span className="text-xs font-medium text-gray-800">
                  All systems <span className="font-semibold text-green-700">online</span>
                </span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/admin/availability"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Manage Availability</h3>
                  <p className="text-sm text-gray-600">
                    Set available time slots for all programs
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5" />
                    Scheduling
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner group-hover:bg-blue-700 transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/session-approval"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Session Approval</h3>
                  <p className="text-sm text-gray-600">
                    View and approve session requests
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5" />
                    High Priority
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-inner group-hover:bg-blue-600 transition-colors">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/students"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Students</h3>
                  <p className="text-sm text-gray-600">
                    Manage student accounts and activations
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5" />
                    Student Hub
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner group-hover:bg-blue-700 transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/teachers"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Teachers</h3>
                  <p className="text-sm text-gray-600">
                    Manage teacher accounts and programs
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5" />
                    Mentors
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-inner group-hover:bg-blue-600 transition-colors">
                  <UserCircle className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/enrollments"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Enrollments</h3>
                  <p className="text-sm text-gray-600">
                    Manage student enrollments and access
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5" />
                    Access Control
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner group-hover:bg-blue-700 transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/feedback"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Parent Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Review and respond to parent feedback
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5" />
                    Engagement
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-inner group-hover:bg-blue-600 transition-colors">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/transaction-receipts"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Transaction Receipts</h3>
                  <p className="text-sm text-gray-600">
                    Review and verify payment receipts
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1.5" />
                    Finance
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner group-hover:bg-blue-700 transition-colors">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/testimonials"
              className="group block rounded-xl p-6 bg-white border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Manage Testimonials</h3>
                  <p className="text-sm text-gray-600">
                    Review and approve student testimonials
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5" />
                    Social Proof
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-inner group-hover:bg-blue-600 transition-colors">
                  <MessageSquareQuote className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/mentors"
              className="group block rounded-xl p-6 bg-white border border-purple-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Mentor Profiles</h3>
                  <p className="text-sm text-gray-600">
                    Manage mentor profiles and information
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mr-1.5" />
                    Featured Content
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-inner group-hover:bg-purple-700 transition-colors">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </Link>

            <Link 
              href="/admin/events"
              className="group block rounded-xl p-6 bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Events Management</h3>
                  <p className="text-sm text-gray-600">
                    Create and manage events with registrations
                  </p>
                  <span className="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mr-1.5" />
                    New Feature ✨
                  </span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-inner group-hover:bg-emerald-700 transition-colors">
                  <CalendarDays className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
