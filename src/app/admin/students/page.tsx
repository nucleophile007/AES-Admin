"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, GraduationCap, Filter, CheckCircle, Loader2, X, Plus, Mail } from "lucide-react"

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
  isActivated: boolean
  createdAt: string
  updatedAt: string
}

export default function StudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Student[]>([])
  const [filteredData, setFilteredData] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Form states for new student
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    schoolName: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    program: "",
    subject: "",
    teacherId: ""
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<Array<{id: number, name: string, email: string, programs: string[]}>>([])
  const [teachersLoading, setTeachersLoading] = useState(false)

  // Enrollment form states for existing students
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState<Student | null>(null)
  const [enrollmentData, setEnrollmentData] = useState({
    program: "",
    subject: "",
    teacherId: ""
  })
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)

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

    fetchStudents()
    fetchTeachers()
  }, [session, status])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/students")
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load data")
      }
      
      const json = await res.json()
      setData(json.students || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    setTeachersLoading(true)
    try {
      const res = await fetch("/api/admin/teachers")
      if (res.ok) {
        const json = await res.json()
        setTeachers(json.teachers || [])
      }
    } catch (e) {
      console.error("Failed to fetch teachers:", e)
    } finally {
      setTeachersLoading(false)
    }
  }

  useEffect(() => {
    let filtered = data
    
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedProgram !== "all") {
      filtered = filtered.filter((student) => 
        student.program === selectedProgram
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, selectedProgram, data])

  const sendActivationEmail = async (id: number, email: string) => {
    setActionLoading(prev => ({ ...prev, [`activate-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/students/${id}/send-activation`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    
    // Validate form
    if (!formData.name.trim() || !formData.email.trim() || !formData.program.trim() || 
        !formData.grade.trim() || !formData.schoolName.trim() || 
        !formData.parentName.trim() || !formData.parentEmail.trim() || !formData.parentPhone.trim() ||
        !formData.subject.trim() || !formData.teacherId.trim()) {
      setFormError("All fields are required")
      setFormLoading(false)
      return
    }
    
    try {
      const res = await fetch("/api/admin/students", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error('API Error:', error)
        throw new Error(error.error || error.message || error.details || 'Failed to create student')
      }
      
      const newStudent = await res.json()
      
      // Add to our data and reset form
      setData(prev => [newStudent.student, ...prev])
      setFormData({
        name: "",
        email: "",
        grade: "",
        schoolName: "",
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        program: "",
        subject: "",
        teacherId: ""
      })
      setShowForm(false)
      
      // Send activation email
      if (newStudent.student?.id) {
        await sendActivationEmail(newStudent.student.id, newStudent.student.email)
      }
      
    } catch (e: any) {
      console.error(e)
      setFormError(e.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnrollmentLoading(true)
    setEnrollmentError(null)
    
    if (!selectedStudentForEnrollment) {
      setEnrollmentError("No student selected")
      setEnrollmentLoading(false)
      return
    }

    // Validate form
    if (!enrollmentData.program.trim() || !enrollmentData.subject.trim() || !enrollmentData.teacherId.trim()) {
      setEnrollmentError("All fields are required")
      setEnrollmentLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/admin/students/${selectedStudentForEnrollment.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error('Enrollment API Error:', error)
        throw new Error(error.error || error.message || error.details || 'Failed to add enrollment')
      }
      
      const result = await res.json()
      
      // Reset form
      setEnrollmentData({
        program: "",
        subject: "",
        teacherId: ""
      })
      setShowEnrollmentForm(false)
      setSelectedStudentForEnrollment(null)
      
      alert(`Successfully enrolled ${selectedStudentForEnrollment.name} in ${enrollmentData.program} - ${enrollmentData.subject}`)
      
    } catch (e: any) {
      console.error(e)
      setEnrollmentError(e.message)
    } finally {
      setEnrollmentLoading(false)
    }
  }

  const openEnrollmentForm = (student: Student) => {
    setSelectedStudentForEnrollment(student)
    setEnrollmentData({
      program: "",
      subject: "",
      teacherId: ""
    })
    setEnrollmentError(null)
    setShowEnrollmentForm(true)
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

  // Get all unique programs from student data
  const programs = Array.from(new Set(data.map(student => student.program)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading student data...</p>
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
              <div className="bg-green-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <p className="text-sm text-gray-700">Add and manage students</p>
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
                {showForm ? 'Cancel' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Student Form */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Student</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    id="grade"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter school name"
                    value={formData.schoolName}
                    onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <input
                    type="text"
                    id="program"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student program (e.g., SAT, ACT)"
                    value={formData.program}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter subject (e.g., Math, English)"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Mentor/Teacher
                  </label>
                  <select
                    id="teacherId"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.teacherId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                    required
                  >
                    <option value="">Select a teacher...</option>
                    {teachersLoading ? (
                      <option disabled>Loading teachers...</option>
                    ) : (
                      teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.programs.join(', ')}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Parent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        id="parentName"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter parent name"
                        value={formData.parentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        id="parentEmail"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter parent email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        id="parentPhone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter parent phone"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
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
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Enrollment Form Modal */}
      {showEnrollmentForm && selectedStudentForEnrollment && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Enrollment for {selectedStudentForEnrollment.name}
              </h2>
              <button
                onClick={() => {
                  setShowEnrollmentForm(false)
                  setSelectedStudentForEnrollment(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnrollmentSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="enrollProgram" className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <input
                    type="text"
                    id="enrollProgram"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter program (e.g., SAT, ACT)"
                    value={enrollmentData.program}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, program: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="enrollSubject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="enrollSubject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter subject (e.g., Math, English)"
                    value={enrollmentData.subject}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="enrollTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Teacher
                  </label>
                  <select
                    id="enrollTeacher"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={enrollmentData.teacherId}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, teacherId: e.target.value }))}
                    required
                  >
                    <option value="">Select a teacher...</option>
                    {teachersLoading ? (
                      <option disabled>Loading teachers...</option>
                    ) : (
                      teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.programs.join(', ')}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {enrollmentError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {enrollmentError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnrollmentForm(false)
                    setSelectedStudentForEnrollment(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollmentLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  {enrollmentLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Enrollment
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
                placeholder="Search by name, email, parent or school..."
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
              Showing {filteredData.length} of {data.length} students
            </div>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No students found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">Start by adding your first student</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((student, idx) => (
                    <tr key={student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-600">
                          Grade {student.grade} • {student.schoolName}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">{student.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-800">{student.parentName}</div>
                        <div className="text-xs text-gray-600">{student.parentEmail}</div>
                        <div className="text-xs text-gray-600">{student.parentPhone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {student.program}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {student.isActivated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Activated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Pending Activation
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!student.isActivated && (
                            <button
                              onClick={() => sendActivationEmail(student.id, student.email)}
                              disabled={actionLoading[`activate-${student.id}`]}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              {actionLoading[`activate-${student.id}`] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Send Activation
                                </div>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openEnrollmentForm(student)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            <div className="flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              Add Enrollment
                            </div>
                          </button>
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