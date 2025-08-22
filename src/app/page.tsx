"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Users, Phone, Filter, CheckCircle, Loader2, X } from "lucide-react"


interface WebinarRegistration {
  id: number
  email: string
  parentName: string
  parentEmail: string
  parentPhone: string
  studentName: string
  grade: string
  schoolName: string
  program: string
  preferredTime: string
  createdAt: string
  approved: boolean
  adminEmail: string | null
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<WebinarRegistration[]>([])
  const [filteredData, setFilteredData] = useState<WebinarRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [approving, setApproving] = useState<Set<number>>(new Set())

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
    if (!session.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch data when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetch("/api/admin/webinar-registrations")
      .then((res) => {
        if (res.status === 403) {
          throw new Error("Not authorized")
        }
        if (!res.ok) {
          throw new Error("Failed to load data")
        }
        return res.json()
      })
      .then((json) => {
        setData(json.registrations || [])
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [session, status])

  useEffect(() => {
    let filtered = data.filter(
      (reg) =>
        reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.schoolName.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (selectedProgram !== "all") {
      filtered = filtered.filter((reg) => reg.program === selectedProgram)
    }

    setFilteredData(filtered)
  }, [searchTerm, selectedProgram, data])

  // Check admin access before rendering dashboard
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com']

  if (!session.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
  }

  const programs = [...new Set(data.map((reg) => reg.program))]

  const approve = async (id: number) => {
    setApproving(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/registration/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      })
      if (!res.ok) throw new Error('Approve failed')
      const json = await res.json()
      const updated = json.registration as WebinarRegistration
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved, adminEmail: updated.adminEmail } : r))
    } catch (e) {
      console.error(e)
      alert('Approve failed')
    } finally {
      setApproving(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const unapprove = async (id: number) => {
    setApproving(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/registration/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Unapprove failed')
      }
      
      const json = await res.json()
      const updated = json.registration as WebinarRegistration
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved, adminEmail: updated.adminEmail } : r))
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Unapprove failed')
    } finally {
      setApproving(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    )
  }
  
  if (error === "Not authorized") return <p className="p-6 text-red-600 font-medium">Not authorized to view this page.</p>
  if (error) return <p>{error}</p>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Webinar Registrations</h1>
                <p className="text-sm text-gray-700">Manage and view all registration data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/availability"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Manage Availability
              </Link>
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-700">
                  Total Registrations: <span className="font-bold">{data.length}</span>
                </span>
              </div>
            </div>
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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
              >
                <option value="all">All Programs</option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {filteredData.length !== data.length && (
            <div className="mt-4 text-sm text-gray-800 font-medium">
              Showing {filteredData.length} of {data.length} registrations
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No registrations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-16 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact Info</th>
                    <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student Details</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
                    <th className="w-36 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Registered</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admin</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((reg, idx) => (
                    <tr key={reg.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-3 text-sm font-medium">#{reg.id}</td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 text-sm truncate">{reg.parentName}</div>
                          <div className="text-xs text-gray-700 truncate">{reg.parentEmail}</div>
                          <div className="text-xs text-gray-700 flex items-center">
                            <Phone className="h-3 w-3 mr-1 flex-shrink-0" /> 
                            <span className="truncate">{reg.parentPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 text-sm truncate">{reg.studentName}</div>
                          <div className="text-xs text-gray-700">Grade {reg.grade}</div>
                          <div className="text-xs text-gray-700 truncate">{reg.schoolName}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 truncate">
                          {reg.program}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        <div className="truncate">{reg.preferredTime}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 font-medium">
                        <div className="truncate">
                          {new Date(reg.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {reg.approved ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded text-xs">
                            <CheckCircle className="w-3 h-3"/>
                            <span className="hidden sm:inline">Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                            <span className="hidden sm:inline">Pending</span>
                            <span className="sm:hidden">•</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {reg.adminEmail ? (
                          <div className="text-xs text-gray-600 truncate" title={reg.adminEmail}>
                            {reg.adminEmail.split('@')[0]}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          {!reg.approved ? (
                            <button
                              className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${approving.has(reg.id) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                              disabled={approving.has(reg.id)}
                              onClick={() => approve(reg.id)}
                              title="Approve registration"
                            >
                              {approving.has(reg.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="hidden lg:inline">Approve</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                                approving.has(reg.id) || (reg.adminEmail !== session?.user?.email) 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                              disabled={approving.has(reg.id) || (reg.adminEmail !== session?.user?.email)}
                              onClick={() => unapprove(reg.id)}
                              title={
                                reg.adminEmail !== session?.user?.email 
                                  ? "Only the approving admin can remove approval" 
                                  : "Remove approval"
                              }
                            >
                              {approving.has(reg.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-3 w-3" />
                                  <span className="hidden lg:inline">Remove</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
