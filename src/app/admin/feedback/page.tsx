"use client"

import { useEffect, useState } from "react"
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
  const [filteredData, setFilteredData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null)

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

  // Fetch feedback when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetchFeedback()
  }, [session, status, selectedStatus])

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

  useEffect(() => {
    let filtered = data
    
    // Filter by status
    if (selectedStatus !== "all") {
      if (selectedStatus === "approved") {
        filtered = filtered.filter(f => f.isApproved)
      } else if (selectedStatus === "pending") {
        filtered = filtered.filter(f => !f.isApproved)
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          (feedback.parentName && feedback.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (feedback.studentName && feedback.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (feedback.childExperience && feedback.childExperience.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (feedback.school && feedback.school.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, data, selectedStatus])

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
          <p className="text-gray-600">Loading feedback...</p>
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No parent testimonials found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">No testimonials have been submitted yet</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programs</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heard About</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Before/After</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child's Experience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Story</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Experience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduling Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommend</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Favorite Thing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((pt) => (
                    <tr key={pt.id} className="hover:bg-gray-50">
                      {/* Timestamp */}
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {pt.submittedAt ? new Date(pt.submittedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Student Info */}
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{pt.studentName || 'N/A'}</div>
                          <div className="text-gray-500">{pt.grade || 'N/A'}</div>
                          <div className="text-gray-500">{pt.school || 'N/A'}</div>
                        </div>
                      </td>

                      {/* Programs */}
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {pt.programs && pt.programs.length > 0 ? (
                            pt.programs.map((program, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                {program}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* Heard About */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.heardAbout ? (
                          <button
                            onClick={() => viewFullContent('How They Heard About Us', pt.heardAbout!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.heardAbout}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Before/After */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.beforeAfterExpectations ? (
                          <button
                            onClick={() => viewFullContent('Before/After Expectations', pt.beforeAfterExpectations!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.beforeAfterExpectations}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Child's Experience */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.childExperience ? (
                          <button
                            onClick={() => viewFullContent("Child's Experience", pt.childExperience!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.childExperience}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Success Story */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.successStory ? (
                          <button
                            onClick={() => viewFullContent('Success Story', pt.successStory!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.successStory}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Overall Experience */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.overallExperience ? (
                          <button
                            onClick={() => viewFullContent('Overall Experience', pt.overallExperience!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.overallExperience}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Student Rating */}
                      <td className="px-4 py-3 text-sm text-center">
                        {pt.studentRating ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {pt.studentRating}/5
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Scheduling Rating */}
                      <td className="px-4 py-3 text-sm text-center">
                        {pt.schedulingRating ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {pt.schedulingRating}/5
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Would Recommend */}
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {pt.wouldRecommend || 'N/A'}
                      </td>

                      {/* Consent */}
                      <td className="px-4 py-3 text-sm text-center">
                        {pt.consentToFeature ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-gray-400">✗</span>
                        )}
                      </td>

                      {/* Favorite Thing */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.favoriteThingToShare ? (
                          <button
                            onClick={() => viewFullContent('Favorite Thing', pt.favoriteThingToShare!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.favoriteThingToShare}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Suggestions */}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        {pt.suggestions ? (
                          <button
                            onClick={() => viewFullContent('Suggestions', pt.suggestions!)}
                            className="text-left hover:text-blue-600 line-clamp-2"
                          >
                            {pt.suggestions}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Parent Name */}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {pt.parentName || 'N/A'}
                      </td>

                      {/* Approved Toggle */}
                      <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                        <button
                          onClick={() => updateFeedbackStatus(pt.id, !pt.isApproved)}
                          disabled={actionLoading[`status-${pt.id}`]}
                          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                            pt.isApproved
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {actionLoading[`status-${pt.id}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            pt.isApproved ? 'Approved' : 'Approve'
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

