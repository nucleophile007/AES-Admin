"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, UserRound, CheckCircle2, Loader2, X, Plus, Mail, Trash2, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import TablePagination from "@/components/ui/table-pagination"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, PanelHeader, buttonClass, cx, inputClass, selectClass } from "@/components/admin/ui"
import { PROGRAM_OPTIONS } from "@/lib/programCatalog"

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

const PAGE_SIZE = 50
const TEACHERS_CACHE_KEY = "admin.teachers.cache.v1"

const readTeacherCache = (): Teacher[] | null => {
  try {
    const cached = sessionStorage.getItem(TEACHERS_CACHE_KEY)
    return cached ? JSON.parse(cached) as Teacher[] : null
  } catch {
    return null
  }
}

const writeTeacherCache = (teachers: Teacher[]) => {
  try {
    sessionStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify(teachers))
  } catch {
    // Session storage is optional and may be unavailable in private browsing.
  }
}

interface TeacherFormData {
  name: string
  email: string
  programs: string[]
}

function ProgramPicker({
  selectedPrograms,
  onChange,
}: {
  selectedPrograms: string[]
  onChange: (programs: string[]) => void
}) {
  return (
    <details className="group relative">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-surface px-3 text-sm text-ink-soft shadow-card transition hover:border-line-strong">
        <span className={selectedPrograms.length ? "text-ink" : "text-subtle"}>
          {selectedPrograms.length
            ? `${selectedPrograms.length} program${selectedPrograms.length === 1 ? "" : "s"} selected`
            : "Select programs..."}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-pop">
        {PROGRAM_OPTIONS.map((program) => (
          <label key={program} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-ink-soft hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={selectedPrograms.includes(program)}
              onChange={(event) => onChange(
                event.target.checked
                  ? [...selectedPrograms, program]
                  : selectedPrograms.filter((selectedProgram) => selectedProgram !== program)
              )}
              className="h-4 w-4 rounded border-line-strong accent-brand-700"
            />
            <span>{program}</span>
          </label>
        ))}
      </div>
    </details>
  )
}

export default function TeachersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Form states for new teacher
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<TeacherFormData>({
    name: "",
    email: "",
    programs: []
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const normalizedSearchTerm = useMemo(
    () => deferredSearchTerm.trim().toLowerCase(),
    [deferredSearchTerm],
  )
  const programs = useMemo(
    () => Array.from(new Set(data.flatMap((teacher) => teacher.programs))),
    [data],
  )
  const filteredData = useMemo(() => {
    let filtered = data

    if (normalizedSearchTerm) {
      filtered = filtered.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(normalizedSearchTerm) ||
          teacher.email.toLowerCase().includes(normalizedSearchTerm),
      )
    }

    if (selectedProgram !== "all") {
      filtered = filtered.filter((teacher) => teacher.programs.includes(selectedProgram))
    }

    return filtered
  }, [data, normalizedSearchTerm, selectedProgram])
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE)),
    [filteredData.length],
  )
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredData.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredData])

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

    fetchTeachers()
  }, [session, status])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProgram])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const fetchTeachers = async () => {
    const cachedTeachers = readTeacherCache()
    if (cachedTeachers) {
      setData(cachedTeachers)
      setLoading(false)
    } else {
      setLoading(true)
    }
    try {
      const res = await fetch("/api/admin/teachers", { cache: "no-store" })
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
      const teachers = json.teachers || []
      setData(teachers)
      writeTeacherCache(teachers)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      if (cachedTeachers) {
        console.warn("Could not refresh teachers; showing cached data:", message)
      } else {
        console.error("Failed to load teachers:", message)
      }
    } finally {
      setLoading(false)
    }
  }

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
      
      await res.json()
      
      setData(prev => {
        const teachers = prev.map(teacher =>
          teacher.id === id ? { ...teacher, isActive: newStatus } : teacher
        )
        writeTeacherCache(teachers)
        return teachers
      })
    } catch (e: any) {
      console.error(e)
      toast.error(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      let settled = false

      const finish = (value: boolean) => {
        if (!settled) {
          settled = true
          resolve(value)
        }
      }

      toast(`Delete ${teacher.name}? This action cannot be undone.`, {
        description: "The teacher and their associated records will be removed.",
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
      })
    })

    if (!confirmed) {
      return
    }

    const loadingKey = `delete-${teacher.id}`
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to delete teacher")
      }

      setData(prev => {
        const teachers = prev.filter(item => item.id !== teacher.id)
        writeTeacherCache(teachers)
        return teachers
      })
      toast.success("Teacher deleted successfully.")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to delete teacher")
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
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
      toast.success(result.message || 'Activation email sent successfully')
    } catch (e: any) {
      console.error(e)
      toast.error(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`activate-${id}`]: false }))
    }
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
      setData(prev => {
        const teachers = [newTeacher.teacher, ...prev]
        writeTeacherCache(teachers)
        return teachers
      })
      setFormData({
        name: "",
        email: "",
        programs: []
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
    return (
      <AdminPageShell moduleId="teachers">
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

  return (
    <AdminPageShell
      moduleId="teachers"
      description="Add mentors, choose the programs they teach and manage their accounts."
      actions={
        <button type="button" onClick={() => setShowForm(!showForm)} className={buttonClass(showForm ? 'secondary' : 'primary')}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close form' : 'Add teacher'}
        </button>
      }
    >
      {/* Add Teacher Form */}
      {showForm && (
        <Panel className="mb-6">
          <PanelHeader title="Add new teacher" description="Create a mentor account and assign the programs they teach." />
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <label htmlFor="name" className="block text-sm font-medium text-ink-soft">
                Name
                <input
                  type="text"
                  id="name"
                  className={cx(inputClass, 'mt-1.5')}
                  placeholder="Enter teacher name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                Email
                <input
                  type="email"
                  id="email"
                  className={cx(inputClass, 'mt-1.5')}
                  placeholder="Enter teacher email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="mb-5">
              <p className="mb-1.5 text-sm font-medium text-ink-soft">Programs they teach</p>
              <ProgramPicker
                selectedPrograms={formData.programs}
                onChange={(programs) => setFormData((prev) => ({ ...prev, programs }))}
              />
              <p className="mt-2 text-xs text-muted">
                Select every program this teacher can support. You can choose several.
              </p>
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
                Save teacher
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search teachers</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search by name or email…"
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
            <span>Showing <span className="font-semibold text-ink">{filteredData.length}</span> of {data.length} teachers</span>
            <button type="button" onClick={() => { setSearchTerm(''); setSelectedProgram('all') }} className="font-medium text-brand-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Teacher List */}
        {loading ? (
          <LoadingState label="Loading teachers…" />
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={data.length ? 'No teachers match your filters' : 'No teachers yet'}
            description={data.length ? 'Try a different name, email or program.' : 'Start by adding your first teacher.'}
            action={!data.length ? (
              <button type="button" onClick={() => setShowForm(true)} className={buttonClass('primary', 'sm')}>
                <Plus className="h-3.5 w-3.5" /> Add teacher
              </button>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3">Teacher</th>
                  <th className="px-4 py-3">Programs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedData.map((teacher) => (
                  <tr key={teacher.id} className="align-top transition-colors hover:bg-surface-muted/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold uppercase text-emerald-800 ring-1 ring-inset ring-emerald-100">
                          {teacher.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{teacher.name}</p>
                          <a href={`mailto:${teacher.email}`} className="block truncate text-xs text-muted hover:text-brand-700">{teacher.email}</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {teacher.programs.length ? (
                        <div className="flex max-w-sm flex-wrap gap-1">
                          {teacher.programs.map((program, i) => (
                            <Badge key={i} tone="brand">{program}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-subtle">No programs</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        {teacher.isActive ? (
                          <Badge tone="emerald" icon={CheckCircle2}>Active</Badge>
                        ) : (
                          <Badge tone="rose" icon={X}>Inactive</Badge>
                        )}
                        {!teacher.isActivated && <Badge tone="amber" dot>Pending activation</Badge>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-muted">
                      {new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!teacher.isActivated && (
                          <button
                            type="button"
                            onClick={() => sendActivationEmail(teacher.id, teacher.email)}
                            disabled={actionLoading[`activate-${teacher.id}`]}
                            className={buttonClass('secondary', 'sm')}
                          >
                            {actionLoading[`activate-${teacher.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                            Send activation
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleTeacherStatus(teacher.id, !teacher.isActive)}
                          disabled={actionLoading[`status-${teacher.id}`]}
                          className={buttonClass(teacher.isActive ? 'dangerOutline' : 'success', 'sm', 'min-w-[92px]')}
                        >
                          {actionLoading[`status-${teacher.id}`] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : teacher.isActive ? (
                            'Deactivate'
                          ) : (
                            'Activate'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(teacher)}
                          disabled={actionLoading[`delete-${teacher.id}`]}
                          aria-label={`Delete ${teacher.name}`}
                          title="Delete teacher"
                          className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
                        >
                          {actionLoading[`delete-${teacher.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredData.length}
          itemLabel="teachers"
          onPageChange={setCurrentPage}
        />
      </Panel>
    </AdminPageShell>
  )
}
