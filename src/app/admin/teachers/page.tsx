"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, User, Filter, CheckCircle, Loader2, X, Plus, Mail } from "lucide-react"

interface Teacher {
  id: number
  name: string
  email: string
  programs: string[]
  isActive: boolean
  isActivated: boolean
  createdAt: string
  updatedAt: string
}

export default function TeachersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Teacher[]>([])
  const [filteredData, setFilteredData] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Form states for new teacher
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    programs: [""] // Start with one empty program
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  // Fetch data when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetchTeachers()
  }, [session, status])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/teachers")
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load data")
      }
      
      const json = await res.json()
      setData(json.teachers || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = data
    
    if (searchTerm) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedProgram !== "all") {
      filtered = filtered.filter((teacher) => 
        teacher.programs.includes(selectedProgram)
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, selectedProgram, data])

  const toggleTeacherStatus = async (id: number, newStatus: boolean) => {
    setActionLoading(prev => ({ ...prev, [`status-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update teacher status')
      
      const updatedTeacher = await res.json()
      
      setData(prev => 
        prev.map(teacher => 
          teacher.id === id ? { ...teacher, isActive: newStatus } : teacher
        )
      )
    } catch (e: any) {
      console.error(e)
      alert(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const sendActivationEmail = async (id: number, email: string) => {
    setActionLoading(prev => ({ ...prev, [`activate-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/teachers/${id}/send-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.message || 'Failed to send activation email')
      }
      
      const result = await res.json()
      alert(result.message || 'Activation email sent successfully')
    } catch (e: any) {
      console.error(e)
      alert(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`activate-${id}`]: false }))
    }
  }

  const handleAddProgram = () => {
    setFormData(prev => ({
      ...prev,
      programs: [...prev.programs, ""]
    }))
  }

  const handleRemoveProgram = (index: number) => {
    if (formData.programs.length <= 1) return // Keep at least one program field
    
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.filter((_, i) => i !== index)
    }))
  }

  const handleProgramChange = (index: number, value: string) => {
    const newPrograms = [...formData.programs]
    newPrograms[index] = value
    setFormData(prev => ({
      ...prev,
      programs: newPrograms
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    
    // Filter out empty programs
    const filteredPrograms = formData.programs.filter(p => p.trim() !== "")
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Name and email are required")
      setFormLoading(false)
      return
    }
    
    if (filteredPrograms.length === 0) {
      setFormError("At least one program is required")
      setFormLoading(false)
      return
    }
    
    try {
      const res = await fetch("/api/admin/teachers", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          programs: filteredPrograms
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create teacher')
      }
      
      const newTeacher = await res.json()
      
      // Add to our data and reset form
      setData(prev => [newTeacher.teacher, ...prev])
      setFormData({
        name: "",
        email: "",
        programs: [""]
      })
      setShowForm(false)
      
      // Send activation email
      if (newTeacher.teacher?.id) {
        await sendActivationEmail(newTeacher.teacher.id, newTeacher.teacher.email)
      }
      
    } catch (e: any) {
      console.error(e)
      setFormError(e.message)
    } finally {
      setFormLoading(false)
    }
  }

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

  // Get all unique programs from teachers data
  const programs = Array.from(new Set(data.flatMap(teacher => teacher.programs)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading teacher data...</p>
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
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
                <p className="text-sm text-gray-700">Add and manage teachers/mentors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                {showForm ? 'Cancel' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Teacher Form */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Teacher</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter teacher name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter teacher email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Programs
                  </label>
                  <button 
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    onClick={handleAddProgram}
                  >
                    <Plus className="w-4 h-4" />
                    Add Program
                  </button>
                </div>
                
                {formData.programs.map((program, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter program name"
                      value={program}
                      onChange={(e) => handleProgramChange(index, e.target.value)}
                      required={index === 0} // At least one program required
                    />
                    {formData.programs.length > 1 && (
                      <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-red-500"
                        onClick={() => handleRemoveProgram(index)}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            {programs.length > 0 && (
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
            )}
          </div>
          {filteredData.length !== data.length && (
            <div className="mt-4 text-sm text-gray-800 font-medium">
              Showing {filteredData.length} of {data.length} teachers
            </div>
          )}
        </div>
      </div>

      {/* Teacher List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No teachers found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">Start by adding your first teacher</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Programs</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((teacher, idx) => (
                    <tr key={teacher.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-700">{teacher.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.programs.map((program, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {program}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {teacher.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            <X className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                        {!teacher.isActivated && (
                          <span className="ml-1 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Pending Activation
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(teacher.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTeacherStatus(teacher.id, !teacher.isActive)}
                            disabled={actionLoading[`status-${teacher.id}`]}
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              teacher.isActive
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {actionLoading[`status-${teacher.id}`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : teacher.isActive ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                          
                          {!teacher.isActivated && (
                            <button
                              onClick={() => sendActivationEmail(teacher.id, teacher.email)}
                              disabled={actionLoading[`activate-${teacher.id}`]}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              {actionLoading[`activate-${teacher.id}`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Send Activation
                                </div>
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