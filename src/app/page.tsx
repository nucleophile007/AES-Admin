"use client"

import { useEffect, useState } from "react"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Search, Users, Phone, Filter, CheckCircle, Loader2, LogIn, X } from "lucide-react"


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
}

export default function AdminPage() {
  const { data: session, status } = useSession()

  const [data, setData] = useState<WebinarRegistration[]>([])
  const [filteredData, setFilteredData] = useState<WebinarRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [approving, setApproving] = useState<Set<number>>(new Set())

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "loading") return // Still loading
    
    if (status === "unauthenticated") {
      signIn("google")
      return
    }
    
    if (status !== 'authenticated') return

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
  }, [status])

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
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved } : r))
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
      if (!res.ok) throw new Error('Unapprove failed')
      const json = await res.json()
      const updated = json.registration as WebinarRegistration
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved } : r))
    } catch (e) {
      console.error(e)
      alert('Unapprove failed')
    } finally {
      setApproving(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <LogIn className="w-16 h-16 text-blue-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Access Required
          </h1>
          
          <p className="text-gray-600 mb-6">
            Please sign in with your authorized Google account to access the admin panel.
          </p>
          
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
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
                <p className="text-sm text-gray-500">Manage and view all registration data</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
            <div className="mt-4 text-sm text-gray-600">
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No registrations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((reg, idx) => (
                    <tr key={reg.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{reg.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-medium">{reg.parentName}</div>
                          <div className="text-sm text-gray-500">{reg.parentEmail}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" /> {reg.parentPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-medium">{reg.studentName}</div>
                          <div className="text-sm text-gray-500">Grade {reg.grade}</div>
                          <div className="text-sm text-gray-500">{reg.schoolName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {reg.program}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{reg.preferredTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reg.approved ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded text-xs"><CheckCircle className="w-3 h-3"/> Approved</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {!reg.approved ? (
                            <button
                              className={`text-sm px-3 py-1 rounded inline-flex items-center gap-2 ${approving.has(reg.id) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                              disabled={approving.has(reg.id)}
                              onClick={() => approve(reg.id)}
                            >
                              {approving.has(reg.id) ? (<><Loader2 className="h-4 w-4 animate-spin" /> Approving...</>) : (<><CheckCircle className="h-4 w-4" /> Approve</>)}
                            </button>
                          ) : (
                            <button
                              className={`text-sm px-3 py-1 rounded inline-flex items-center gap-2 ${approving.has(reg.id) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                              disabled={approving.has(reg.id)}
                              onClick={() => unapprove(reg.id)}
                            >
                              {approving.has(reg.id) ? (<><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>) : (<><X className="h-4 w-4" /> Unapprove</>)}
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
