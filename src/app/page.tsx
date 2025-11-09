"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, Users, GraduationCap, UserCircle, BookOpen, MessageSquareQuote } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check admin access and redirect if needed
  useEffect(() => {
    if (status === 'loading') return
    
    // If no session at all, redirect to sign in
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // If session exists but email is not authorized, redirect to unauthorized
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com']
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Check admin access before rendering dashboard
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com']

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
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
              href="/admin/testimonials"
              className="block bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg p-6 hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Manage Testimonials</h3>
                  <p className="text-pink-100">Review and approve student testimonials</p>
                </div>
                <MessageSquareQuote className="w-8 h-8 text-pink-200" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
