"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, ChevronDown, GraduationCap, Loader2, Mail, Pencil, Phone, Plus, Search, Send, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, PanelHeader, buttonClass, cx, inputClass, selectClass } from "@/components/admin/ui"
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
    return <div className="flex h-10 items-center rounded-lg border border-line bg-surface-muted px-3 text-sm text-muted">No subject selection needed</div>
  }

  if (program === "Tutoring" || program === "AES Champions") {
    return (
      <div className="relative">
        <details className="group">
          <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-surface px-3 text-sm text-ink-soft shadow-card transition hover:border-line-strong">
            <span className={value ? "text-ink" : "text-subtle"}>{value || "Select a subject..."}</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface p-1.5 shadow-pop">
            {groups.map((group) => (
              <div key={group.name} className="border-b border-line last:border-0">
                {group.subjects.length ? (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm font-medium text-ink-soft hover:bg-surface-muted"
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
                            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${value === subject ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-surface-muted"}`}
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
                    className={`block w-full rounded px-2 py-2 text-left text-sm ${value === group.name ? "bg-brand-50 text-brand-700" : "font-medium text-ink-soft hover:bg-surface-muted"}`}
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
      className={inputClass}
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
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-surface px-3 text-left text-sm shadow-card transition ${
          open ? "border-brand-300 ring-4 ring-brand-100" : "border-line hover:border-line-strong"
        }`}
      >
        <span className={selectedTeachers.length ? "text-ink" : "text-subtle"}>
          {selectedTeachers.length
            ? `${selectedTeachers.length} mentor${selectedTeachers.length === 1 ? "" : "s"} selected`
            : "Select mentors"}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-pop">
          <div className="border-b border-line px-2 pb-2 text-xs text-muted">
            Select one or more mentors
          </div>
          {loading && <p className="px-2 py-3 text-sm text-muted">Loading mentors...</p>}
          {!loading && !teachers.length && <p className="px-2 py-3 text-sm text-muted">No mentors available.</p>}
          {teachers.map((teacher) => {
          const id = String(teacher.id)
          return (
            <label key={teacher.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 text-sm text-ink-soft hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={selectedIds.includes(id)}
                onChange={(event) => onChange(event.target.checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id))}
                className="mt-0.5 h-4 w-4 rounded border-line-strong accent-brand-700"
              />
              <span className="min-w-0">
                <span className="block font-medium text-ink-soft">{teacher.name}</span>
                <span className="block truncate text-xs text-muted">{teacher.email}</span>
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
    return (
      <AdminPageShell moduleId="students">
        <Panel><LoadingState label="Checking access…" /></Panel>
      </AdminPageShell>
    )
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

  return (
    <AdminPageShell
      moduleId="students"
      description="Add students, manage their program enrollments and mentors, and send activation links."
      actions={
        <button type="button" onClick={() => setShowForm(!showForm)} className={buttonClass(showForm ? 'secondary' : 'primary')}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close form' : 'Add student'}
        </button>
      }
    >
      {/* Add Student Form */}
      {showForm && (
        <Panel className="mb-6">
          <PanelHeader title="Add new student" description="Capture student and parent details, then choose their programs." />
          <div className="p-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className={inputClass}
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={inputClass}
                    placeholder="Enter student email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Grade
                  </label>
                  <input
                    type="text"
                    id="grade"
                    className={inputClass}
                    placeholder="Enter student grade"
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="graduationYear" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    id="graduationYear"
                    min={2000}
                    max={2100}
                    step={1}
                    className={inputClass}
                    placeholder="Enter graduation year"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="schoolName" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    className={inputClass}
                    placeholder="Enter school name"
                    value={formData.schoolName}
                    onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Program enrollments</h3>
                      <p className="text-sm text-muted">Add one or more programs for this student.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEnrollmentDraft}
                      className={buttonClass('secondary', 'sm')}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add program
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.enrollments.map((enrollment, index) => {
                      return (
                        <div key={index} className="rounded-lg border border-line bg-surface-muted/60 p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Enrollment {index + 1}</span>
                            {formData.enrollments.length > 1 && (
                              <button type="button" onClick={() => removeEnrollmentDraft(index)} className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline">
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                              className={inputClass}
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
                
                <div className="md:col-span-2 border-t border-line pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Parent information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="parentName" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        id="parentName"
                        className={inputClass}
                        placeholder="Enter parent name"
                        value={formData.parentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="parentEmail" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        id="parentEmail"
                        className={inputClass}
                        placeholder="Enter parent email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="parentPhone" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        id="parentPhone"
                        className={inputClass}
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
                <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setShowForm(false)} className={buttonClass('secondary')}>Cancel</button>
                <button type="submit" disabled={formLoading} className={buttonClass('primary')}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save student
                </button>
              </div>
            </form>
          </div>
        </Panel>
      )}

      {/* Add Enrollment Form Modal */}
      {showEnrollmentForm && selectedStudentForEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-surface px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Student enrollment</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                  {editingEnrollmentId ? "Edit enrollment" : "Manage enrollments"}
                </h2>
                <p className="mt-1 text-sm text-muted">{selectedStudentForEnrollment.name}</p>
              </div>
              <button
                type="button"
                onClick={closeEnrollmentForm}
                className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
                aria-label="Close enrollment manager"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
            <div className="rounded-card border border-line bg-surface-muted/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Current enrollments</h3>
                  <p className="mt-0.5 text-xs text-muted">Choose an enrollment to edit or remove it.</p>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-inset ring-line">
                  {(selectedStudentForEnrollment.enrollments || []).length} total
                </span>
              </div>
              <div className="space-y-2">
                {(selectedStudentForEnrollment.enrollments || []).map((enrollment) => (
                  <div key={enrollment.id} className={`flex items-center justify-between gap-3 rounded-lg border bg-surface p-3.5 text-sm shadow-card ${
                    editingEnrollmentId === enrollment.id ? "border-brand-300 ring-4 ring-brand-100" : "border-line"
                  }`}>
                    <div>
                      <p className="font-semibold text-ink">{enrollment.program}</p>
                      <p className="mt-1 text-muted">{enrollment.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          editEnrollment(selectedStudentForEnrollment, enrollment)
                        }}
                        className={buttonClass('secondary', 'sm')}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button type="button" onClick={() => void deleteEnrollment(selectedStudentForEnrollment, enrollment)} disabled={actionLoading[`enrollment-delete-${enrollment.id}`]} className={buttonClass('dangerOutline', 'sm')}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  </div>
                ))}
                {!(selectedStudentForEnrollment.enrollments || []).length && <p className="text-sm text-muted">No enrollments found.</p>}
              </div>
            </div>
            <div className="rounded-card border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <h3 className="text-[15px] font-semibold text-ink">{editingEnrollmentId ? "Update selected enrollment" : "Add a new enrollment"}</h3>
                <p className="mt-1 text-sm text-muted">Assign the program, subject, and mentors for this student.</p>
              </div>
              <div className="p-5">
            {editingEnrollmentId && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <span>You are editing the highlighted enrollment.</span>
                <button type="button" onClick={() => { setEditingEnrollmentId(null); setEnrollmentData({ program: "", subject: "", teacherIds: [] }); setEnrollmentError(null) }} className="font-semibold underline underline-offset-2">Cancel edit</button>
              </div>
            )}
            <form onSubmit={handleEnrollmentSubmit}>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="enrollProgram" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Program
                  </label>
                  <select
                    id="enrollProgram"
                    className={inputClass}
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

                <div>
                  <p className="mb-1.5 block text-sm font-medium text-ink-soft">Subject</p>
                  <SubjectPicker
                    program={enrollmentData.program}
                    value={enrollmentData.subject}
                    onChange={(subject) => setEnrollmentData(prev => ({ ...prev, subject }))}
                  />
                </div>
                <div>
                  <p className="mb-1.5 block text-sm font-medium text-ink-soft">Mentors</p>
                  <MentorPicker
                    teachers={teachers}
                    selectedIds={enrollmentData.teacherIds}
                    onChange={(teacherIds) => setEnrollmentData(prev => ({ ...prev, teacherIds }))}
                    loading={teachersLoading}
                  />
                </div>
              </div>

              {enrollmentError && (
                <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {enrollmentError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={closeEnrollmentForm} className={buttonClass('secondary')}>
                  Cancel
                </button>
                <button type="submit" disabled={enrollmentLoading} className={buttonClass('primary')}>
                  {enrollmentLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget && !editLoading) {
              closeEditForm()
            }
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">Edit student</h2>
                <p className="mt-0.5 text-sm text-muted">{selectedStudentForEdit.name}</p>
              </div>
              <button
                type="button"
                onClick={closeEditForm}
                className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
                disabled={editLoading}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    className={inputClass}
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-email" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Student Email
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    className={inputClass}
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-grade" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Grade
                  </label>
                  <input
                    type="text"
                    id="edit-grade"
                    className={inputClass}
                    value={editData.grade}
                    onChange={(e) => setEditData(prev => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-graduation-year" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    id="edit-graduation-year"
                    min={2000}
                    max={2100}
                    step={1}
                    className={inputClass}
                    value={editData.graduationYear}
                    onChange={(e) => setEditData(prev => ({ ...prev, graduationYear: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="edit-school" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    School Name
                  </label>
                  <input
                    type="text"
                    id="edit-school"
                    className={inputClass}
                    value={editData.schoolName}
                    onChange={(e) => setEditData(prev => ({ ...prev, schoolName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-program" className="mb-1.5 block text-sm font-medium text-ink-soft">
                    Active Program
                  </label>
                  <p className="mb-1 text-xs text-muted">Only enrolled programs can be selected here. Use Add Enrollment for a new program and teacher assignment.</p>
                  <select
                    id="edit-program"
                    className={inputClass}
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

                <div className="md:col-span-2 border-t border-line pt-5">
                  <h3 className="mb-3 text-sm font-semibold text-ink">Parent information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="edit-parent-name" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        id="edit-parent-name"
                        className={inputClass}
                        value={editData.parentName}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-parent-email" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        id="edit-parent-email"
                        className={inputClass}
                        value={editData.parentEmail}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-parent-phone" className="mb-1.5 block text-sm font-medium text-ink-soft">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        id="edit-parent-phone"
                        className={inputClass}
                        value={editData.parentPhone}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editError && (
                <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={closeEditForm} disabled={editLoading} className={buttonClass('secondary')}>
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className={buttonClass('primary')}>
                  {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Panel className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search students</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search by name, email, parent or school…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          {programs.length > 0 && (
            <label className="relative block sm:w-60">
              <span className="sr-only">Program</span>
              <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className={selectClass}>
                <option value="all">All programs</option>
                {programs.map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
          )}
        </div>

        {!loading && filteredData.length !== data.length && (
          <div className="flex items-center justify-between border-b border-line bg-surface-muted/60 px-5 py-2 text-xs text-muted">
            <span>Showing <span className="font-semibold text-ink">{filteredData.length}</span> of {data.length} students</span>
            <button type="button" onClick={() => { setSearchTerm(''); setSelectedProgram('all') }} className="font-medium text-brand-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <LoadingState label="Loading students…" />
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={data.length ? 'No students match your filters' : 'No students yet'}
            description={data.length ? 'Try a different name, email, school or program.' : 'Start by adding your first student.'}
            action={!data.length ? (
              <button type="button" onClick={() => setShowForm(true)} className={buttonClass('primary', 'sm')}>
                <Plus className="h-3.5 w-3.5" /> Add student
              </button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Programs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredData.map((student) => (
                  <tr key={student.id} className="align-top transition-colors hover:bg-surface-muted/60">
                    <td className="max-w-[300px] px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold uppercase text-brand-800 ring-1 ring-inset ring-brand-100">
                          {student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{student.name}</p>
                          <a href={`mailto:${student.email}`} className="block truncate text-xs text-muted hover:text-brand-700">{student.email}</a>
                          <p className="mt-0.5 truncate text-xs text-subtle" title={student.schoolName}>
                            Grade {student.grade}
                            {student.graduationYear ? ` · Class of ${student.graduationYear}` : ''}
                            {` · ${student.schoolName}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-4 py-4">
                      <p className="truncate font-medium text-ink-soft">{student.parentName}</p>
                      <a href={`mailto:${student.parentEmail}`} className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted hover:text-brand-700">
                        <Mail className="h-3 w-3 shrink-0" />{student.parentEmail}
                      </a>
                      <a href={`tel:${student.parentPhone}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-muted hover:text-brand-700">
                        <Phone className="h-3 w-3 shrink-0" />{student.parentPhone}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {getStudentPrograms(student).map((program) => <Badge key={program} tone="brand">{program}</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {student.isActivated ? (
                        <Badge tone="emerald" icon={CheckCircle2}>Activated</Badge>
                      ) : (
                        <Badge tone="amber" dot>Pending activation</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {!student.isActivated && (
                          <button
                            type="button"
                            onClick={() => sendActivationEmail(student.id, student.email)}
                            disabled={actionLoading[`activate-${student.id}`]}
                            className={buttonClass('secondary', 'sm')}
                            title="Send activation email"
                          >
                            {actionLoading[`activate-${student.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Activate
                          </button>
                        )}
                        <button type="button" onClick={() => openEnrollmentForm(student)} className={buttonClass('secondary', 'sm')} title="Manage enrollments">
                          <BookOpen className="h-3.5 w-3.5" /> Enrollments
                        </button>
                        <button type="button" onClick={() => openEditForm(student)} className={buttonClass('ghost', 'icon')} title="Edit student" aria-label={`Edit ${student.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={actionLoading[`delete-${student.id}`]}
                          className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
                          title="Delete student"
                          aria-label={`Delete ${student.name}`}
                        >
                          {actionLoading[`delete-${student.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminPageShell>
  )
}