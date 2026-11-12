"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, GraduationCap, Filter, CheckCircle, Loader2, X, Plus, Mail, Pencil, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { getSubjectGroupsForProgram, getSubjectsForProgram, isSingleLevelProgram, PROGRAM_OPTIONS } from "@/lib/programCatalog"

interface Student {
  id: number
  name: string
  email: string
  grade: string
  graduationYear: number | null
  schoolName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  program: string
  enrollments?: Array<{ id: number; program: string; subject: string; isActive: boolean }>
  teacherLinks?: Array<{ program: string; teacher: { id: number; name: string; email: string } }>
  isActivated: boolean
  createdAt: string
  updatedAt: string
}

const getStudentPrograms = (student: Student) => Array.from(new Set(
  (student.enrollments || []).map((enrollment) => enrollment.program).concat(student.program)
))

interface EnrollmentDraft {
  program: string
  subject: string
  teacherIds: string[]
}

const STUDENTS_CACHE_KEY = "admin.students.cache.v1"
const TEACHERS_CACHE_KEY = "admin.teachers.cache.v1"

const readSessionCache = <T,>(key: string): T | null => {
  try {
    const cached = sessionStorage.getItem(key)
    return cached ? JSON.parse(cached) as T : null
  } catch {
    return null
  }
}

const writeSessionCache = <T,>(key: string, value: T) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Session storage is optional and may be unavailable in private browsing.
  }
}

function SubjectPicker({
  program,
  value,
  onChange,
}: {
  program: string
  value: string
  onChange: (value: string) => void
}) {
  const groups = getSubjectGroupsForProgram(program)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  if (isSingleLevelProgram(program)) {
    return <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">No subject selection needed</div>
  }

  if (program === "Tutoring" || program === "AES Champions") {
    return (
      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700">
            <span className={value ? "text-gray-900" : "text-gray-400"}>{value || "Select a subject..."}</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            {groups.map((group) => (
              <div key={group.name} className="border-b border-gray-100 last:border-0">
                {group.subjects.length ? (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                    >
                      <Plus className={`h-4 w-4 transition-transform ${expandedGroup === group.name ? "rotate-45" : ""}`} />
                      {group.name}
                    </button>
                    {expandedGroup === group.name && (
                      <div className="mb-1 ml-6 space-y-1">
                        {group.subjects.map((subject) => (
                          <button
                            type="button"
                            key={subject}
                            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${value === subject ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
                            onClick={(event) => {
                              onChange(subject)
                              event.currentTarget.closest("details")?.removeAttribute("open")
                            }}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className={`block w-full rounded px-2 py-2 text-left text-sm ${value === group.name ? "bg-blue-50 text-blue-700" : "font-medium text-gray-800 hover:bg-gray-50"}`}
                    onClick={(event) => {
                      onChange(group.name)
                      event.currentTarget.closest("details")?.removeAttribute("open")
                    }}
                  >
                    {group.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>
    )
  }

  return (
    <select
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
    >
      <option value="">Select a subject...</option>
      {groups.flatMap((group) => group.subjects).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
      {!getSubjectsForProgram(program).length && <option value="Other">Other (legacy/custom)</option>}
    </select>
  )
}

function MentorPicker({
  teachers,
  selectedIds,
  onChange,
  loading,
}: {
  teachers: Array<{ id: number; name: string; email: string; programs: string[] }>
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const availableTeachers = teachers
  const selectedTeachers = availableTeachers.filter((teacher) => selectedIds.includes(String(teacher.id)))

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-[42px] w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm transition ${
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <span className={selectedTeachers.length ? "text-slate-900" : "text-slate-400"}>
          {selectedTeachers.length
            ? `${selectedTeachers.length} mentor${selectedTeachers.length === 1 ? "" : "s"} selected`
            : "Select mentors"}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
          <div className="border-b border-slate-100 px-2 pb-2 text-xs text-slate-500">
            Select one or more mentors
          </div>
          {loading && <p className="px-2 py-3 text-sm text-slate-500">Loading mentors...</p>}
          {!loading && !teachers.length && <p className="px-2 py-3 text-sm text-slate-500">No mentors available.</p>}
          {teachers.map((teacher) => {
          const id = String(teacher.id)
          return (
            <label key={teacher.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={(event) => onChange(event.target.checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="min-w-0">
                <span className="block font-medium text-slate-800">{teacher.name}</span>
                <span className="block truncate text-xs text-slate-500">{teacher.email}</span>
              </span>
            </label>
          )
          })}
        </div>
      )}
    </div>
  )
}

export default function StudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Student[]>([])
  const [filteredData, setFilteredData] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Form states for new student
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    graduationYear: "",
    schoolName: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    enrollments: [{ program: "", subject: "", teacherIds: [] as string[] }] as EnrollmentDraft[]
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
    teacherIds: [] as string[]
  })
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)

  // Edit form states for existing students
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null)
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    grade: "",
    graduationYear: "",
    schoolName: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    program: ""
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Check admin access and redirect if needed
  useEffect(() => {
    if (status === 'loading') return
    
    // If no session at all, redirect to sign in
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // If session exists but email is not authorized, redirect to unauthorized
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com','luvshanker14@gmail.com']
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch data when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com','luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetchStudents()
    fetchTeachers()
  }, [session, status])

  const fetchStudents = async () => {
    const cachedStudents = readSessionCache<Student[]>(STUDENTS_CACHE_KEY)
    if (cachedStudents) {
      setData(cachedStudents)
      setLoading(false)
    } else {
      setLoading(true)
    }
    try {
      const res = await fetch("/api/admin/students", { cache: "no-store" })
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        let message = `Request failed (${res.status})`
        try {
          const errorBody = await res.json() as { error?: string; details?: string }
          message = errorBody.error || errorBody.details || message
        } catch {
          // Keep the HTTP status when the server does not return JSON.
        }
        throw new Error(message)
      }
      
      const json = await res.json()
      const students = json.students || []
      setData(students)
      writeSessionCache(STUDENTS_CACHE_KEY, students)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      if (cachedStudents) {
        console.warn("Could not refresh students; showing cached data:", message)
      } else {
        console.error("Failed to load students:", message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    const cachedTeachers = readSessionCache<Array<{id: number, name: string, email: string, programs: string[]}>>(TEACHERS_CACHE_KEY)
    if (cachedTeachers) {
      setTeachers(cachedTeachers)
      setTeachersLoading(false)
    } else {
      setTeachersLoading(true)
    }
    try {
      const res = await fetch("/api/admin/teachers")
      if (res.ok) {
        const json = await res.json()
        const nextTeachers = json.teachers || []
        setTeachers(nextTeachers)
        writeSessionCache(TEACHERS_CACHE_KEY, nextTeachers)
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
        getStudentPrograms(student).includes(selectedProgram)
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
      toast.success(result.message || 'Activation email sent successfully')
    } catch (e: any) {
      console.error(e)
      toast.error(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`activate-${id}`]: false }))
    }
  }

  const addEnrollmentDraft = () => {
    setFormData((prev) => ({
      ...prev,
      enrollments: [...prev.enrollments, { program: "", subject: "", teacherIds: [] }],
    }))
  }

  const removeEnrollmentDraft = (index: number) => {
    if (formData.enrollments.length === 1) return
    setFormData((prev) => ({
      ...prev,
      enrollments: prev.enrollments.filter((_, enrollmentIndex) => enrollmentIndex !== index),
    }))
  }

  const updateEnrollmentDraft = (index: number, updates: Partial<EnrollmentDraft>) => {
    setFormData((prev) => ({
      ...prev,
      enrollments: prev.enrollments.map((enrollment, enrollmentIndex) =>
        enrollmentIndex === index ? { ...enrollment, ...updates } : enrollment
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    
    // Validate form
    if (!formData.name.trim() || !formData.email.trim() ||
        !formData.grade.trim() || !formData.schoolName.trim() || 
        !formData.parentName.trim() || !formData.parentEmail.trim() || !formData.parentPhone.trim() ||
        formData.enrollments.some((enrollment) =>
          !enrollment.program.trim() || !enrollment.subject.trim() || enrollment.teacherIds.length === 0
        )) {
      setFormError("Complete every program enrollment with a subject and at least one teacher")
      setFormLoading(false)
      return
    }
    
    try {
      const payload = {
        ...formData,
        graduationYear: formData.graduationYear.trim() ? Number(formData.graduationYear) : null,
      }

      const res = await fetch("/api/admin/students", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error('API Error:', error)
        throw new Error(error.error || error.message || error.details || 'Failed to create student')
      }
      
      const newStudent = await res.json()
      
      // Add to our data and reset form
      setData(prev => [{
        ...newStudent.student,
        enrollments: newStudent.enrollments || [],
        teacherLinks: newStudent.teacherLinks || [],
      }, ...prev])
      writeSessionCache(STUDENTS_CACHE_KEY, [{
        ...newStudent.student,
        enrollments: newStudent.enrollments || [],
        teacherLinks: newStudent.teacherLinks || [],
      }, ...data])
      setFormData({
        name: "",
        email: "",
        grade: "",
        graduationYear: "",
        schoolName: "",
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        enrollments: [{ program: "", subject: "", teacherIds: [] }]
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
    if (!enrollmentData.program.trim() || !enrollmentData.subject.trim() || enrollmentData.teacherIds.length === 0) {
      setEnrollmentError("All fields are required")
      setEnrollmentLoading(false)
      return
    }

    const isEditing = Boolean(editingEnrollmentId)
    const studentName = selectedStudentForEnrollment.name
    const enrollmentLabel = `${enrollmentData.program} - ${enrollmentData.subject}`
    const toastId = toast.loading(isEditing ? "Updating enrollment..." : "Adding enrollment...")
    
    try {
      const res = await fetch(`/api/admin/students/${selectedStudentForEnrollment.id}/enroll`, {
        method: editingEnrollmentId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEnrollmentId
          ? { ...enrollmentData, enrollmentId: editingEnrollmentId }
          : enrollmentData),
      })
      
      if (!res.ok) {
        const responseText = await res.text()
        let error: { error?: string; message?: string; details?: string } = {}
        try {
          error = responseText ? JSON.parse(responseText) as typeof error : {}
        } catch {
          // Keep the HTTP status when the server does not return JSON.
        }
        const message = error.details || error.error || error.message || `Request failed (${res.status})`
        const diagnostic = `Enrollment request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ""}): ${message}`
        console.warn(diagnostic, responseText || "<empty response>")
        throw new Error(diagnostic)
      }
      
      await res.json()
      
      setEnrollmentData({
        program: "",
        subject: "",
        teacherIds: []
      })
      setEditingEnrollmentId(null)
      setEnrollmentLoading(false)
      setShowEnrollmentForm(false)
      setSelectedStudentForEnrollment(null)
      toast.success(
        `${isEditing ? "Enrollment updated" : "Enrollment added"} for ${studentName}: ${enrollmentLabel}`,
        { id: toastId }
      )

      // Refresh in the background so the modal closes without waiting for the list query.
      void fetchStudents()
      
    } catch (e: unknown) {
      console.error(e)
      const message = e instanceof Error ? e.message : "Enrollment request failed"
      setEnrollmentError(message)
      toast.error(message, { id: toastId })
    } finally {
      setEnrollmentLoading(false)
    }
  }

  const openEnrollmentForm = (student: Student) => {
    setSelectedStudentForEnrollment(student)
    setEnrollmentData({
      program: "",
      subject: "",
      teacherIds: []
    })
    setEnrollmentError(null)
    setEditingEnrollmentId(null)
    setShowEnrollmentForm(true)
  }

  const editEnrollment = (student: Student, enrollment: NonNullable<Student["enrollments"]>[number]) => {
    const teacherIds = (student.teacherLinks || [])
      .filter((link) => link.program === enrollment.program)
      .map((link) => String(link.teacher.id))
    setSelectedStudentForEnrollment(student)
    setEnrollmentData({ program: enrollment.program, subject: enrollment.subject, teacherIds })
    setEditingEnrollmentId(enrollment.id)
    setEnrollmentError(null)
    setShowEnrollmentForm(true)
  }

  const closeEnrollmentForm = () => {
    if (enrollmentLoading) return
    setShowEnrollmentForm(false)
    setSelectedStudentForEnrollment(null)
    setEditingEnrollmentId(null)
    setEnrollmentError(null)
  }

  const deleteEnrollment = async (student: Student, enrollment: NonNullable<Student["enrollments"]>[number]) => {
    if (!window.confirm(`Delete ${enrollment.program} - ${enrollment.subject} for ${student.name}?`)) return
    setActionLoading((previous) => ({ ...previous, [`enrollment-delete-${enrollment.id}`]: true }))
    try {
      const response = await fetch(`/api/admin/students/${student.id}/enroll?enrollmentId=${enrollment.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to delete enrollment")
      await fetchStudents()
      if (selectedStudentForEnrollment?.id === student.id) {
        const refreshed = data.find((item) => item.id === student.id)
        if (refreshed) setSelectedStudentForEnrollment(refreshed)
      }
    } catch (error) {
      setEnrollmentError(error instanceof Error ? error.message : "Failed to delete enrollment")
    } finally {
      setActionLoading((previous) => ({ ...previous, [`enrollment-delete-${enrollment.id}`]: false }))
    }
  }

  const openEditForm = (student: Student) => {
    setSelectedStudentForEdit(student)
    setEditData({
      name: student.name,
      email: student.email,
      grade: student.grade,
      graduationYear: student.graduationYear?.toString() ?? "",
      schoolName: student.schoolName,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      program: student.program
    })
    setEditError(null)
    setShowEditForm(true)
  }

  const closeEditForm = () => {
    setShowEditForm(false)
    setSelectedStudentForEdit(null)
    setEditError(null)
  }

  const handleDeleteStudent = async (student: Student) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      let settled = false

      const finish = (value: boolean) => {
        if (!settled) {
          settled = true
          resolve(value)
        }
      }

      toast(
        `Delete ${student.name}? This action cannot be undone.`,
        {
          description:
            "Linked student records will be removed. Parent account is deleted only if no other students are linked.",
          duration: 12000,
          action: {
            label: "Delete",
            onClick: () => finish(true),
          },
          cancel: {
            label: "Cancel",
            onClick: () => finish(false),
          },
          onDismiss: () => finish(false),
        }
      )
    })

    if (!confirmed) {
      return
    }

    const loadingKey = `delete-${student.id}`
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete student')
      }

      const result = await res.json()
      setData(prev => {
        const students = prev.filter(item => item.id !== student.id)
        writeSessionCache(STUDENTS_CACHE_KEY, students)
        return students
      })

      if (result.deletedParentAccount) {
        toast.success(`Student deleted. Linked parent account #${result.parentAccountId} was also deleted.`)
      } else {
        toast.success("Student deleted successfully.")
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to delete student")
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudentForEdit) {
      setEditError("No student selected")
      return
    }

    if (
      !editData.name.trim() ||
      !editData.email.trim() ||
      !editData.grade.trim() ||
      !editData.schoolName.trim() ||
      !editData.parentName.trim() ||
      !editData.parentEmail.trim() ||
      !editData.parentPhone.trim() ||
      !editData.program.trim()
    ) {
      setEditError("All fields are required")
      return
    }

    setEditLoading(true)
    setEditError(null)

    try {
      const payload = {
        ...editData,
        graduationYear: editData.graduationYear.trim() ? Number(editData.graduationYear) : null,
      }

      const res = await fetch(`/api/admin/students/${selectedStudentForEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to update student')
      }

      const json = await res.json()
      const updatedStudent: Student = json.student

      setData(prev => {
        const students = prev.map(student => (
          student.id === updatedStudent.id ? updatedStudent : student
        ))
        writeSessionCache(STUDENTS_CACHE_KEY, students)
        return students
      })

      toast.success("Student updated successfully.")
      closeEditForm()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to update student")
      setEditError(e.message)
    } finally {
      setEditLoading(false)
    }
  }

  // Check admin access before rendering dashboard
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com','luvshanker14@gmail.com']

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
  }

  // Get all unique programs from student data
  const programs = Array.from(new Set(data.flatMap(getStudentPrograms)))

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
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <p className="text-sm text-gray-700">Add and manage students</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
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
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <p className="text-sm text-gray-600">
                  Capture student and parent details for enrollment.
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                New Student
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    id="graduationYear"
                    min={2000}
                    max={2100}
                    step={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter graduation year"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter school name"
                    value={formData.schoolName}
                    onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Program Enrollments</h3>
                      <p className="text-sm text-gray-500">Add one or more programs for this student.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEnrollmentDraft}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" /> Add Program
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.enrollments.map((enrollment, index) => {
                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium text-gray-700">Enrollment {index + 1}</span>
                            {formData.enrollments.length > 1 && (
                              <button type="button" onClick={() => removeEnrollmentDraft(index)} className="text-sm text-red-600 hover:text-red-700">
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                              className="px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
                              value={enrollment.program}
                              onChange={(e) => updateEnrollmentDraft(index, {
                                program: e.target.value,
                                subject: isSingleLevelProgram(e.target.value) ? e.target.value : "",
                                teacherIds: [],
                              })}
                              required
                            >
                              <option value="">Select a program...</option>
                              {PROGRAM_OPTIONS.map((program) => <option key={program} value={program}>{program}</option>)}
                            </select>
                            <SubjectPicker
                              program={enrollment.program}
                              value={enrollment.subject}
                              onChange={(subject) => updateEnrollmentDraft(index, { subject })}
                            />
                            <MentorPicker
                              teachers={teachers}
                              selectedIds={enrollment.teacherIds}
                              onChange={(teacherIds) => updateEnrollmentDraft(index, { teacherIds })}
                              loading={teachersLoading}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Student enrollment</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {editingEnrollmentId ? "Edit enrollment" : "Manage enrollments"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{selectedStudentForEnrollment.name}</p>
              </div>
              <button
                type="button"
                onClick={closeEnrollmentForm}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close enrollment manager"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6 p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current enrollments</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Choose an enrollment to edit or remove it.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {(selectedStudentForEnrollment.enrollments || []).length} total
                </span>
              </div>
              <div className="space-y-2">
                {(selectedStudentForEnrollment.enrollments || []).map((enrollment) => (
                  <div key={enrollment.id} className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm shadow-sm ${
                    editingEnrollmentId === enrollment.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                  }`}>
                    <div>
                      <p className="font-semibold text-slate-900">{enrollment.program}</p>
                      <p className="mt-1 text-slate-500">{enrollment.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          editEnrollment(selectedStudentForEnrollment, enrollment)
                        }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => void deleteEnrollment(selectedStudentForEnrollment, enrollment)} disabled={actionLoading[`enrollment-delete-${enrollment.id}`]} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                ))}
                {!(selectedStudentForEnrollment.enrollments || []).length && <p className="text-sm text-slate-500">No enrollments found.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-slate-900">{editingEnrollmentId ? "Update selected enrollment" : "Add a new enrollment"}</h3>
                <p className="mt-1 text-sm text-slate-500">Assign the program, subject, and mentors for this student.</p>
              </div>
              <div className="p-5">
            {editingEnrollmentId && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <span>You are editing the highlighted enrollment.</span>
                <button type="button" onClick={() => { setEditingEnrollmentId(null); setEnrollmentData({ program: "", subject: "", teacherIds: [] }); setEnrollmentError(null) }} className="font-semibold underline underline-offset-2">Cancel edit</button>
              </div>
            )}
            <form onSubmit={handleEnrollmentSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="enrollProgram" className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <select
                    id="enrollProgram"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={enrollmentData.program}
                    onChange={(e) => setEnrollmentData(prev => ({
                      ...prev,
                      program: e.target.value,
                      subject: isSingleLevelProgram(e.target.value) ? e.target.value : "",
                    }))}
                    required
                  >
                    <option value="">Select a program...</option>
                    {PROGRAM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <SubjectPicker
                  program={enrollmentData.program}
                  value={enrollmentData.subject}
                  onChange={(subject) => setEnrollmentData(prev => ({ ...prev, subject }))}
                />
                <MentorPicker
                  teachers={teachers}
                  selectedIds={enrollmentData.teacherIds}
                  onChange={(teacherIds) => setEnrollmentData(prev => ({ ...prev, teacherIds }))}
                  loading={teachersLoading}
                />
              </div>

              {enrollmentError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {enrollmentError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEnrollmentForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollmentLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {enrollmentLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEnrollmentId ? "Update Enrollment" : "Add Enrollment"}
                </button>
              </div>
            </form>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditForm && selectedStudentForEdit && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !editLoading) {
              closeEditForm()
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
              <button
                type="button"
                onClick={closeEditForm}
                className="text-gray-400 hover:text-gray-600"
                disabled={editLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-grade" className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    id="edit-grade"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editData.grade}
                    onChange={(e) => setEditData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-graduation-year" className="block text-sm font-medium text-gray-700 mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    id="edit-graduation-year"
                    min={2000}
                    max={2100}
                    step={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editData.graduationYear}
                    onChange={(e) => setEditData(prev => ({ ...prev, graduationYear: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="edit-school" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="edit-school"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editData.schoolName}
                    onChange={(e) => setEditData(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-program" className="block text-sm font-medium text-gray-700 mb-1">
                    Active Program
                  </label>
                  <p className="mb-1 text-xs text-gray-500">Only enrolled programs can be selected here. Use Add Enrollment for a new program and teacher assignment.</p>
                  <select
                    id="edit-program"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={editData.program}
                    onChange={(e) => setEditData(prev => ({ ...prev, program: e.target.value }))}
                    required
                  >
                    <option value="">Select a program...</option>
                    {getStudentPrograms(selectedStudentForEdit).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Parent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="edit-parent-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        id="edit-parent-name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.parentName}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-parent-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        id="edit-parent-email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.parentEmail}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-parent-phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        id="edit-parent-phone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editData.parentPhone}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditForm}
                  disabled={editLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {editLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Student
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
                          Grade {student.grade}
                          {student.graduationYear ? ` • Class of ${student.graduationYear}` : ""}
                          {` • ${student.schoolName}`}
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
                          {getStudentPrograms(student).join(", ")}
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
                            onClick={() => openEditForm(student)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200"
                          >
                            <div className="flex items-center gap-1">
                              <Pencil className="w-3 h-3" />
                              Edit
                            </div>
                          </button>
                          <button
                            onClick={() => openEnrollmentForm(student)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            <div className="flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              Add Enrollment
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            disabled={actionLoading[`delete-${student.id}`]}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-60"
                          >
                            {actionLoading[`delete-${student.id}`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </div>
                            )}
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