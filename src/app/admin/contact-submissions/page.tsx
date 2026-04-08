"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Inbox, Search, Filter, Loader2, RefreshCw } from "lucide-react"

interface ContactSubmission {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: string | null
  programInterest: string | null
  subject: string
  message: string
  preferredContact: string | null
  studentName: string | null
  studentGrade: string | null
  status: string
  source: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
}

function getStatusClass(status: string) {
  const s = status.toLowerCase()
  if (s === "new") return "bg-blue-100 text-blue-800"
  if (s === "contacted") return "bg-yellow-100 text-yellow-800"
  if (s === "resolved" || s === "closed") return "bg-green-100 text-green-800"
  return "bg-gray-100 text-gray-800"
}

export default function ContactSubmissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedSource, setSelectedSource] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const fetchSubmissions = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const query = new URLSearchParams()
      if (selectedStatus !== "all") query.set("status", selectedStatus)
      if (selectedSource !== "all") query.set("source", selectedSource)

      const url = query.toString()
        ? `/api/admin/contact-submissions?${query.toString()}`
        : "/api/admin/contact-submissions"

      const res = await fetch(url)
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load contact submissions")
      }

      const json = await res.json()
      setData(json.submissions || [])
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return
    fetchSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email, selectedStatus, selectedSource])

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const q = searchTerm.toLowerCase()
    return data.filter((submission) =>
      submission.fullName.toLowerCase().includes(q) ||
      submission.email.toLowerCase().includes(q) ||
      (submission.phone || "").toLowerCase().includes(q) ||
      (submission.role || "").toLowerCase().includes(q) ||
      (submission.programInterest || "").toLowerCase().includes(q) ||
      submission.subject.toLowerCase().includes(q) ||
      submission.message.toLowerCase().includes(q) ||
      (submission.studentName || "").toLowerCase().includes(q)
    )
  }, [data, searchTerm])

  const statusOptions = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.status))).sort()
  }, [data])

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.source))).sort()
  }, [data])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading contact submissions...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error === "Not authorized") {
    return <p className="p-6 text-red-600 font-medium">Not authorized to view this page.</p>
  }

  if (error) {
    return <p className="p-6 text-red-600 font-medium">{error}</p>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Inbox className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
                <p className="text-sm text-gray-700">Review messages submitted from the public site</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchSubmissions(true)}
                disabled={refreshing}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
                  refreshing
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search by name, email, phone, subject, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="lg:w-52 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:w-52 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                {sourceOptions.map((sourceValue) => (
                  <option key={sourceValue} value={sourceValue}>
                    {sourceValue}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-800 font-medium">
            Showing {filteredData.length} of {data.length} submissions
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No contact submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role / Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Preferred</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((submission, idx) => (
                    <tr key={submission.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(submission.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">{submission.fullName}</div>
                        <div className="text-gray-700">{submission.email}</div>
                        <div className="text-gray-600 text-xs">{submission.phone || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{submission.role || "-"}</div>
                        <div className="text-xs text-gray-600">{submission.programInterest || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[220px] truncate">
                        {submission.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[320px]">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-left hover:text-blue-600 hover:underline line-clamp-2"
                        >
                          {submission.message}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{submission.preferredContact || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{submission.studentName || "-"}</div>
                        <div className="text-xs text-gray-600">{submission.studentGrade || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{submission.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Submission #{selectedSubmission.id} • {selectedSubmission.fullName}
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-72px)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.email}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Role</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.role || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Program Interest</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.programInterest || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Preferred Contact</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.preferredContact || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.status}</div>
                </div>
                <div>
                  <div className="text-gray-500">Source</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.source}</div>
                </div>
                <div>
                  <div className="text-gray-500">Submitted At</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedSubmission.createdAt).toLocaleString("en-US")}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Student Name</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.studentName || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Student Grade</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.studentGrade || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">IP Address</div>
                  <div className="font-medium text-gray-900">{selectedSubmission.ipAddress || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Updated At</div>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedSubmission.updatedAt).toLocaleString("en-US")}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Subject</div>
                <div className="text-sm font-medium text-gray-900">{selectedSubmission.subject}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Message</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border rounded-lg p-3">
                  {selectedSubmission.message}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">User Agent</div>
                <div className="text-xs text-gray-700 whitespace-pre-wrap break-all bg-gray-50 border rounded-lg p-3">
                  {selectedSubmission.userAgent || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
