"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, MessageSquare, Filter, CheckCircle, Loader2, Star, Eye } from "lucide-react"

interface Feedback {
  id: number
  parentId: number | null
  parentName: string | null
  parentEmail: string | null
  studentName: string | null
  grade: string | null
  school: string | null
  programs: string[]
  heardAbout: string | null
  beforeAfterExpectations: string | null
  childExperience: string | null
  successStory: string | null
  overallExperience: string | null
  studentRating: number | null
  schedulingRating: number | null
  wouldRecommend: string | null
  consentToFeature: boolean
  favoriteThingToShare: string | null
  suggestions: string | null
  message: string | null
  rating: number | null
  status: string
  response: string | null
  isApproved: boolean
  isVisible: boolean
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [expandedPrograms, setExpandedPrograms] = useState<Record<number, boolean>>({})
  const normalizedSearchTerm = useMemo(
    () => deferredSearchTerm.trim().toLowerCase(),
    [deferredSearchTerm],
  )
  const filteredData = useMemo(() => {
    let filtered = data

    if (selectedStatus !== "all") {
      if (selectedStatus === "approved") {
        filtered = filtered.filter((feedback) => feedback.isApproved)
      } else if (selectedStatus === "pending") {
        filtered = filtered.filter((feedback) => !feedback.isApproved)
      }
    }

    if (normalizedSearchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          (feedback.parentName && feedback.parentName.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.studentName && feedback.studentName.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.childExperience && feedback.childExperience.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.school && feedback.school.toLowerCase().includes(normalizedSearchTerm)),
      )
    }

    return filtered
  }, [data, normalizedSearchTerm, selectedStatus])

  // Check admin access and redirect if needed
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Auto-sync and fetch feedback when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    // Auto-sync on page load, then fetch feedback
    syncFromSheet()
  }, [session, status])

  const syncFromSheet = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      
      const response = await fetch('/api/admin/parent-testimonials/sync', {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to sync from Google Sheets')
      
      const result = await response.json()
      
      if (result.stats) {
        const { imported, skipped, errors } = result.stats
        setSyncMessage(`Synced: ${imported} imported, ${skipped} skipped, ${errors} errors`)
      }
      
      // After syncing, fetch the updated feedback
      await fetchFeedback()
    } catch (err) {
      console.error('Sync error:', err)
      // Still try to fetch feedback even if sync fails
      await fetchFeedback()
    } finally {
      setSyncing(false)
    }
  }

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const url = `/api/admin/parent-testimonials`
      const res = await fetch(url)
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load parent testimonials")
      }
      
      const json = await res.json()
      setData(json || [])
    } catch (e: any) {
      console.error('Failed to load parent testimonials:', e.message)
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (id: number, isApproved: boolean) => {
    setActionLoading(prev => ({ ...prev, [`status-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/parent-testimonials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isApproved }),
      })
      
      if (!res.ok) throw new Error('Failed to update testimonial status')
      
      await res.json()
      await fetchFeedback()
    } catch (e: any) {
      console.error(e)
      alert(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const viewFullContent = (title: string, content: string) => {
    setViewingContent({ title, content })
  }

  // Check admin access before rendering dashboard
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {syncing ? 'Syncing from Google Sheets...' : 'Loading feedback...'}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
  }

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    reviewed: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parent Testimonials</h1>
                <p className="text-sm text-gray-700">Review and approve testimonials from parents</p>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sync message display */}
        {syncMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {syncMessage}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search by parent name, student name, school, or experience..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          {filteredData.length !== data.length && (
            <div className="mt-4 text-sm text-gray-800 font-medium">
              Showing {filteredData.length} of {data.length} feedback entries
            </div>
          )}
        </div>
      </div>

      {/* Parent Testimonials Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-gray-900 font-semibold text-lg">No parent testimonials found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">No testimonials have been submitted yet</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Student Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Programs</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Before/After</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Child's Experience</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Success Story</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Overall Experience</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Scheduling</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Parent Name</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((pt, index) => (
                    <tr 
                      key={pt.id} 
                      className={`transition-all duration-150 hover:bg-blue-50 hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-gray-900 font-medium">
                            {pt.submittedAt ? new Date(pt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {pt.submittedAt ? new Date(pt.submittedAt).getFullYear() : ''}
                          </div>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">{pt.studentName || 'N/A'}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              {pt.grade || 'N/A'}
                            </span>
                            <span className="text-gray-600">{pt.school || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Programs */}
                      <td className="px-6 py-4 text-sm">
                        {pt.programs && pt.programs.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {expandedPrograms[pt.id] ? (
                              // Show all programs when expanded
                              <>
                                {pt.programs.map((program, idx) => (
                                  <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                                    {program}
                                  </span>
                                ))}
                                <button
                                  onClick={() => setExpandedPrograms(prev => ({ ...prev, [pt.id]: false }))}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                  Show less
                                </button>
                              </>
                            ) : (
                              // Show first program and +X more button
                              <>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                                  {pt.programs[0]}
                                </span>
                                {pt.programs.length > 1 && (
                                  <button
                                    onClick={() => setExpandedPrograms(prev => ({ ...prev, [pt.id]: true }))}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer"
                                  >
                                    +{pt.programs.length - 1} more
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No programs</span>
                        )}
                      </td>

                      {/* Before/After */}
                      <td className="px-6 py-4 text-sm max-w-xs">
                        {pt.beforeAfterExpectations ? (
                          <button
                            onClick={() => viewFullContent('Before/After Expectations', pt.beforeAfterExpectations!)}
                            className="text-left hover:text-blue-600 line-clamp-2 text-gray-700 hover:underline transition-colors"
                          >
                            {pt.beforeAfterExpectations}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">No data</span>
                        )}
                      </td>

                      {/* Child's Experience */}
                      <td className="px-6 py-4 text-sm max-w-xs">
                        {pt.childExperience ? (
                          <button
                            onClick={() => viewFullContent("Child's Experience", pt.childExperience!)}
                            className="text-left hover:text-blue-600 line-clamp-2 text-gray-700 hover:underline transition-colors"
                          >
                            {pt.childExperience}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">No data</span>
                        )}
                      </td>

                      {/* Success Story */}
                      <td className="px-6 py-4 text-sm max-w-xs">
                        {pt.successStory ? (
                          <button
                            onClick={() => viewFullContent('Success Story', pt.successStory!)}
                            className="text-left hover:text-blue-600 line-clamp-2 text-gray-700 hover:underline transition-colors"
                          >
                            {pt.successStory}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">No data</span>
                        )}
                      </td>

                      {/* Overall Experience */}
                      <td className="px-6 py-4 text-sm max-w-xs">
                        {pt.overallExperience ? (
                          <button
                            onClick={() => viewFullContent('Overall Experience', pt.overallExperience!)}
                            className="text-left hover:text-blue-600 line-clamp-2 text-gray-700 hover:underline transition-colors"
                          >
                            {pt.overallExperience}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">No data</span>
                        )}
                      </td>

                      {/* Student Rating */}
                      <td className="px-6 py-4 text-sm text-center">
                        {pt.studentRating ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 shadow-sm">
                              <Star className="w-3.5 h-3.5 mr-1 fill-yellow-500 text-yellow-500" />
                              {pt.studentRating}/5
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Scheduling Rating */}
                      <td className="px-6 py-4 text-sm text-center">
                        {pt.schedulingRating ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300 shadow-sm">
                            {pt.schedulingRating}/5
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Parent Name */}
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium text-gray-900">{pt.parentName || 'Unknown'}</span>
                      </td>

                      {/* Approved Toggle */}
                      <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                        <button
                          onClick={() => updateFeedbackStatus(pt.id, !pt.isApproved)}
                          disabled={actionLoading[`status-${pt.id}`]}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                            pt.isApproved
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-green-200'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-gray-200'
                          }`}
                        >
                          {actionLoading[`status-${pt.id}`] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              {pt.isApproved ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Approve
                                </>
                              )}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
