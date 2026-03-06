'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, User, Users, Calendar, Mail, Phone, School, GraduationCap, Eye, EyeOff, MessageSquareQuote, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

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
  submittedAt: string | null
  studentName: string | null
  grade: string | null
  school: string | null
  programs: string[]
  rating: number | null
  beforeExpectations: string | null
  afterChanges: string | null
  successStory: string | null
  consentToFeature: boolean
  videoLink: string | null
  contentApproved: boolean
  ratingApproved: boolean
  beforeAfterApproved: boolean
  successStoryApproved: boolean
  programsApproved: boolean
  student: Student
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [authorFilter, setAuthorFilter] = useState<'all' | 'student' | 'parent'>('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Auto-sync on page load, then fetch testimonials
    syncFromSheet()
  }, [])

  const syncFromSheet = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      
      const response = await fetch('/api/admin/testimonials/sync', {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to sync from Google Sheets')
      
      const result = await response.json()
      
      if (result.stats) {
        const { imported, skipped, errors } = result.stats
        setSyncMessage(`Synced: ${imported} imported, ${skipped} skipped, ${errors} errors`)
      }
      
      // After syncing, fetch the updated testimonials
      await fetchTestimonials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

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

      const data = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, isApproved: !currentStatus } : t
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update testimonial')
    }
  }

  const toggleVisibility = async (testimonialId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialId,
          isVisible: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update testimonial visibility')

      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, isVisible: !currentStatus } : t
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update testimonial visibility')
    }
  }

  const toggleSectionApproval = async (testimonialId: number, section: string) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}/toggle-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      })

      if (!response.ok) throw new Error('Failed to toggle section approval')

      const data = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, [section]: data[section] } : t
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle section approval')
    }
  }

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setEditFormData({
      content: testimonial.content || '',
      authorName: testimonial.authorName || '',
      authorType: testimonial.authorType || 'student',
      studentName: testimonial.studentName || '',
      grade: testimonial.grade || '',
      school: testimonial.school || '',
      programs: testimonial.programs?.join(', ') || '',
      rating: testimonial.rating || '',
      beforeExpectations: testimonial.beforeExpectations || '',
      afterChanges: testimonial.afterChanges || '',
      successStory: testimonial.successStory || '',
      videoLink: testimonial.videoLink || '',
    })
  }

  const closeEditModal = () => {
    setEditingTestimonial(null)
    setEditFormData({})
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTestimonial) return

    try {
      setSaving(true)
      
      // Process programs array
      const programsArray = editFormData.programs
        ? editFormData.programs.split(',').map((p: string) => p.trim()).filter(Boolean)
        : []

      // Build update payload
      const updatePayload: any = {
        testimonialId: editingTestimonial.id,
        content: editFormData.content,
        authorName: editFormData.authorName,
        authorType: editFormData.authorType,
        studentName: editFormData.studentName,
        grade: editFormData.grade,
        school: editFormData.school,
        programs: programsArray,
        rating: editFormData.rating ? parseInt(editFormData.rating) : null,
        beforeExpectations: editFormData.beforeExpectations,
        afterChanges: editFormData.afterChanges,
        successStory: editFormData.successStory,
        videoLink: editFormData.videoLink,
      }

      const response = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) throw new Error('Failed to update testimonial')

      const result = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === editingTestimonial.id ? { ...t, ...result.testimonial, student: t.student } : t
      ))
      
      closeEditModal()
      alert('Testimonial updated successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update testimonial')
    } finally {
      setSaving(false)
    }
  }

  const deleteTestimonial = async (testimonialId: number, authorName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the testimonial from ${authorName}?\n\nNote: This will only delete from the database. You'll need to manually delete the row from the Google Sheet.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/testimonials?id=${testimonialId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete testimonial')

      // Update local state by removing the deleted testimonial
      setTestimonials(testimonials.filter(t => t.id !== testimonialId))
      
      alert('Testimonial deleted successfully. Please remember to delete the corresponding row from the Google Sheet.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete testimonial')
    }
  }

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const viewFullContent = (title: string, content: string) => {
    setViewingContent({ title, content })
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
    // fromParents: testimonials.filter(t => t.authorType === 'parent').length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">
            {syncing ? 'Syncing from Google Sheets...' : 'Loading testimonials...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MessageSquareQuote className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Student Testimonials</h1>
                <p className="text-sm text-gray-700">Review and approve testimonials from students</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={syncFromSheet}
                disabled={syncing}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
                  syncing 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {syncing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync from Sheet
                  </>
                )}
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {syncMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {syncMessage}
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
                Approved ({testimonials.filter(t => t.isApproved).length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pending ({testimonials.filter(t => !t.isApproved).length})
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
              {/* <button
                onClick={() => setAuthorFilter('parent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  authorFilter === 'parent'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Parents
              </button> */}
            </div>
          </div>
        </div>
        {filteredTestimonials.length > 0 && (
          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredTestimonials.length} testimonial{filteredTestimonials.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Student Testimonials Table */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No testimonials found matching the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade/School</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Before/After</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Story</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTestimonials.map((testimonial) => (
                  <React.Fragment key={testimonial.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRowExpansion(testimonial.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedRows.has(testimonial.id) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${
                            testimonial.authorType === 'student' ? 'bg-purple-100' : 'bg-indigo-100'
                          }`}>
                            {testimonial.authorType === 'student' ? (
                              <User className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Users className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{testimonial.authorName}</div>
                            <div className="text-xs text-gray-500 capitalize">{testimonial.authorType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{testimonial.student.grade}</div>
                        <div className="text-xs text-gray-500">{testimonial.student.schoolName}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSectionApproval(testimonial.id, 'contentApproved')}
                            className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                              testimonial.contentApproved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}
                            title={testimonial.contentApproved ? 'Approved' : 'Not approved'}
                          >
                            {testimonial.contentApproved ? '✓' : '○'}
                          </button>
                          <button
                            onClick={() => viewFullContent('Experience Description', testimonial.content || '')}
                            className="text-sm text-gray-600 truncate hover:text-blue-600 text-left"
                          >
                            {testimonial.content?.substring(0, 50)}...
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {testimonial.rating && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSectionApproval(testimonial.id, 'ratingApproved')}
                              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                                testimonial.ratingApproved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}
                              title={testimonial.ratingApproved ? 'Approved' : 'Not approved'}
                            >
                              {testimonial.ratingApproved ? '✓' : '○'}
                            </button>
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm font-medium">{testimonial.rating}</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {testimonial.programs && testimonial.programs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {testimonial.programs.map((program, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                {program}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {(testimonial.beforeExpectations || testimonial.afterChanges) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSectionApproval(testimonial.id, 'beforeAfterApproved')}
                              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                                testimonial.beforeAfterApproved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}
                              title={testimonial.beforeAfterApproved ? 'Approved' : 'Not approved'}
                            >
                              {testimonial.beforeAfterApproved ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => {
                                const combined = [
                                  testimonial.beforeExpectations && `Before: ${testimonial.beforeExpectations}`,
                                  testimonial.afterChanges && `After: ${testimonial.afterChanges}`
                                ].filter(Boolean).join('\n\n')
                                viewFullContent('Before/After Expectations', combined)
                              }}
                              className="text-sm text-gray-600 truncate hover:text-blue-600 text-left"
                            >
                              {(testimonial.beforeExpectations || testimonial.afterChanges || '').substring(0, 50)}...
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {testimonial.successStory && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSectionApproval(testimonial.id, 'successStoryApproved')}
                              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                                testimonial.successStoryApproved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                              }`}
                              title={testimonial.successStoryApproved ? 'Approved' : 'Not approved'}
                            >
                              {testimonial.successStoryApproved ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => viewFullContent('Success Story', testimonial.successStory || '')}
                              className="text-sm text-gray-600 truncate hover:text-blue-600 text-left"
                            >
                              {testimonial.successStory.substring(0, 50)}...
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {testimonial.submittedAt 
                          ? new Date(testimonial.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleApproval(testimonial.id, testimonial.isApproved)}
                            className={`px-3 py-1.5 rounded text-xs font-medium ${
                              testimonial.isApproved
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                          >
                            {testimonial.isApproved ? 'Approved' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openEditModal(testimonial)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                            title="Edit testimonial"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTestimonial(testimonial.id, testimonial.authorName)}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50"
                            title="Delete testimonial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedRows.has(testimonial.id) && (
                      <tr key={`${testimonial.id}-details`} className="bg-gray-50">
                        <td colSpan={10} className="px-4 py-6">
                          <div className="space-y-4">
                            {/* Full Content */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Experience Description</h4>
                              <p className="text-sm text-gray-600 leading-relaxed italic">"{testimonial.content}"</p>
                            </div>

                            {/* Programs List */}
                            {testimonial.programs && testimonial.programs.length > 0 && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Programs Enrolled</h4>
                                <div className="flex flex-wrap gap-2">
                                  {testimonial.programs.map((program, idx) => (
                                    <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                      {program}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Before/After */}
                            {(testimonial.beforeExpectations || testimonial.afterChanges) && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Before/After Expectations</h4>
                                <div className="space-y-3">
                                  {testimonial.beforeExpectations && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">BEFORE:</p>
                                      <p className="text-sm text-gray-600 leading-relaxed">{testimonial.beforeExpectations}</p>
                                    </div>
                                  )}
                                  {testimonial.afterChanges && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">AFTER:</p>
                                      <p className="text-sm text-gray-600 leading-relaxed">{testimonial.afterChanges}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Success Story */}
                            {testimonial.successStory && (
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Success Story</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{testimonial.successStory}</p>
                              </div>
                            )}

                            {/* Student Details */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Details</h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Email:</span>
                                  <span className="ml-2 font-medium">{testimonial.student.email || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Parent Name:</span>
                                  <span className="ml-2 font-medium">{testimonial.student.parentName || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Parent Email:</span>
                                  <span className="ml-2 font-medium">{testimonial.student.parentEmail || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Parent Phone:</span>
                                  <span className="ml-2 font-medium">{testimonial.student.parentPhone || 'N/A'}</span>
                                </div>
                                {testimonial.consentToFeature && (
                                  <div>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                      ⭐ Consent to Feature
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Content Modal */}
      {viewingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{viewingContent.title}</h3>
              <button
                onClick={() => setViewingContent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingContent.content}</p>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewingContent(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Testimonial Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Testimonial</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border-b pb-4">
                  <h4 className="text-md font-semibold text-black mb-4">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Author Name *</label>
                      <input
                        type="text"
                        value={editFormData.authorName}
                        onChange={(e) => setEditFormData({ ...editFormData, authorName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Author Type *</label>
                      <select
                        value={editFormData.authorType}
                        onChange={(e) => setEditFormData({ ...editFormData, authorType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      >
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Student Name</label>
                      <input
                        type="text"
                        value={editFormData.studentName}
                        onChange={(e) => setEditFormData({ ...editFormData, studentName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Grade</label>
                      <input
                        type="text"
                        value={editFormData.grade}
                        onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">School</label>
                      <input
                        type="text"
                        value={editFormData.school}
                        onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={editFormData.rating}
                        onChange={(e) => setEditFormData({ ...editFormData, rating: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Fields */}
                <div className="border-b pb-4">
                  <h4 className="text-md font-semibold text-black mb-4">Content</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Experience Description *</label>
                      <textarea
                        value={editFormData.content}
                        onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Before Expectations</label>
                      <textarea
                        value={editFormData.beforeExpectations}
                        onChange={(e) => setEditFormData({ ...editFormData, beforeExpectations: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">After Changes</label>
                      <textarea
                        value={editFormData.afterChanges}
                        onChange={(e) => setEditFormData({ ...editFormData, afterChanges: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Success Story</label>
                      <textarea
                        value={editFormData.successStory}
                        onChange={(e) => setEditFormData({ ...editFormData, successStory: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div>
                  <h4 className="text-md font-semibold text-black mb-4">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-black mb-1">Programs (comma-separated)</label>
                      <input
                        type="text"
                        value={editFormData.programs}
                        onChange={(e) => setEditFormData({ ...editFormData, programs: e.target.value })}
                        placeholder="e.g., Math Olympiad, Science Research"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-black mb-1">Video Link</label>
                      <input
                        type="url"
                        value={editFormData.videoLink}
                        onChange={(e) => setEditFormData({ ...editFormData, videoLink: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
