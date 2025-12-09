"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, MessageSquare, Filter, CheckCircle, Loader2, Star, Eye } from "lucide-react"

interface Feedback {
  id: number
  parentId: number
  parentName: string
  parentEmail: string
  message: string
  rating: number | null
  status: string
  response: string | null
  createdAt: string
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
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [responseText, setResponseText] = useState("")
  const [showResponseModal, setShowResponseModal] = useState(false)

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
      const url = selectedStatus !== "all" 
        ? `/api/admin/feedback?status=${selectedStatus}`
        : `/api/admin/feedback`
      const res = await fetch(url)
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load feedback")
      }
      
      const json = await res.json()
      setData(json.feedback || [])
    } catch (e: any) {
      console.error('Failed to load feedback:', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = data
    
    if (searchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          feedback.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.parentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, data])

  const updateFeedbackStatus = async (id: number, newStatus: string) => {
    setActionLoading(prev => ({ ...prev, [`status-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update feedback status')
      
      await res.json()
      await fetchFeedback()
    } catch (e: any) {
      console.error(e)
      alert(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const submitResponse = async (id: number) => {
    if (!responseText.trim()) {
      alert("Response cannot be empty")
      return
    }

    setActionLoading(prev => ({ ...prev, [`response-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          response: responseText,
          status: 'resolved'
        }),
      })
      
      if (!res.ok) throw new Error('Failed to submit response')
      
      await res.json()
      setShowResponseModal(false)
      setResponseText("")
      setSelectedFeedback(null)
      await fetchFeedback()
    } catch (e: any) {
      console.error(e)
      alert(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`response-${id}`]: false }))
    }
  }

  const openResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setResponseText(feedback.response || "")
    setShowResponseModal(true)
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
              <div className="bg-pink-600 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Parent Feedback</h1>
                <p className="text-sm text-gray-700">Review and respond to parent feedback</p>
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
                placeholder="Search by parent name, email, or message..."
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
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
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

      {/* Feedback List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No feedback found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">No feedback has been submitted yet</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredData.map((feedback) => (
                <div key={feedback.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{feedback.parentName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[feedback.status as keyof typeof statusColors] || statusColors.new}`}>
                          {feedback.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback.parentEmail}</p>
                      {feedback.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < feedback.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-600">({feedback.rating}/5)</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{feedback.message}</p>
                  </div>

                  {feedback.response && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                      <p className="text-blue-800 whitespace-pre-wrap">{feedback.response}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {feedback.status === "new" && (
                      <button
                        onClick={() => updateFeedbackStatus(feedback.id, "reviewed")}
                        disabled={actionLoading[`status-${feedback.id}`]}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      >
                        {actionLoading[`status-${feedback.id}`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Mark as Reviewed"
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => openResponseModal(feedback)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      {feedback.response ? "Edit Response" : "Add Response"}
                    </button>
                    {feedback.status !== "resolved" && (
                      <button
                        onClick={() => updateFeedbackStatus(feedback.id, "resolved")}
                        disabled={actionLoading[`status-${feedback.id}`]}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        {actionLoading[`status-${feedback.id}`] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Mark as Resolved"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Response</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Responding to: {selectedFeedback.parentName} ({selectedFeedback.parentEmail})</p>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false)
                  setResponseText("")
                  setSelectedFeedback(null)
                }}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => submitResponse(selectedFeedback.id)}
                disabled={actionLoading[`response-${selectedFeedback.id}`]}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
              >
                {actionLoading[`response-${selectedFeedback.id}`] && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

