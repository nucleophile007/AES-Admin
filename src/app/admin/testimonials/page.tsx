'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, User, Users, Calendar, Mail, Phone, School, GraduationCap } from 'lucide-react'

interface Student {
  id: number
  name: string
  email: string
  grade: string
  schoolName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  program: string
}

interface Testimonial {
  id: number
  content: string
  authorType: string
  authorName: string
  isApproved: boolean
  isVisible: boolean
  createdAt: string
  updatedAt: string
  student: Student
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [authorFilter, setAuthorFilter] = useState<'all' | 'student' | 'parent'>('all')

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/testimonials')
      if (!response.ok) throw new Error('Failed to fetch testimonials')
      const data = await response.json()
      setTestimonials(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleApproval = async (testimonialId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialId,
          isApproved: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update testimonial')

      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, isApproved: !currentStatus } : t
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update testimonial')
    }
  }

  const filteredTestimonials = testimonials.filter(t => {
    const statusMatch = filter === 'all' || 
                       (filter === 'approved' && t.isApproved) ||
                       (filter === 'pending' && !t.isApproved)
    
    const authorMatch = authorFilter === 'all' || t.authorType === authorFilter
    
    return statusMatch && authorMatch
  })

  const stats = {
    total: testimonials.length,
    approved: testimonials.filter(t => t.isApproved).length,
    pending: testimonials.filter(t => !t.isApproved).length,
    fromStudents: testimonials.filter(t => t.authorType === 'student').length,
    fromParents: testimonials.filter(t => t.authorType === 'parent').length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Testimonials</h1>
        <p className="text-gray-600">Review and approve testimonials from students and parents</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <XCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">From Students</p>
              <p className="text-2xl font-bold text-purple-600">{stats.fromStudents}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">From Parents</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.fromParents}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({testimonials.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending ({stats.pending})
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Author Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAuthorFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  authorFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAuthorFilter('student')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  authorFilter === 'student'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setAuthorFilter('parent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  authorFilter === 'parent'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Parents
              </button>
            </div>
          </div>
        </div>
        {filteredTestimonials.length > 0 && (
          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredTestimonials.length} testimonial{filteredTestimonials.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Testimonials List */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No testimonials found matching the current filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
                testimonial.isApproved ? 'border-green-500' : 'border-orange-500'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      testimonial.authorType === 'student' ? 'bg-purple-100' : 'bg-indigo-100'
                    }`}>
                      {testimonial.authorType === 'student' ? (
                        <User className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Users className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{testimonial.authorName}</h3>
                      <p className="text-sm text-gray-500 capitalize">{testimonial.authorType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      testimonial.isApproved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {testimonial.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Testimonial Content */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
                </div>

                {/* Student Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Student Name</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Student Email</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Grade</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">School</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.schoolName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Parent Name</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.parentName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Parent Email</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.parentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Parent Phone</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.parentPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Program</p>
                        <p className="text-sm font-medium text-gray-900">{testimonial.student.program}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(testimonial.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => toggleApproval(testimonial.id, testimonial.isApproved)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      testimonial.isApproved
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {testimonial.isApproved ? (
                      <>
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Disapprove
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
