"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import {
  Badge,
  EmptyState,
  LoadingState,
  Panel,
  Segmented,
  buttonClass,
  cx,
  inputClass,
  selectClass,
} from "@/components/admin/ui"


interface SessionApproval {
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
  cancelled: boolean
  cancellationReason: string | null
  cancelledAt: string | null
  cancelledBy: string | null
}

type StatusFilter = "all" | "pending" | "approved" | "cancelled"

const formatRegistered = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default function SessionApprovalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData] = useState<SessionApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [approving, setApproving] = useState<Set<number>>(new Set())
  const [cancellationTarget, setCancellationTarget] = useState<SessionApproval | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const normalizedSearchTerm = useMemo(
    () => deferredSearchTerm.trim().toLowerCase(),
    [deferredSearchTerm],
  )
  const programs = useMemo(
    () => [...new Set(data.map((reg) => reg.program))],
    [data],
  )
  const filteredData = useMemo(() => {
    let filtered = data

    if (normalizedSearchTerm) {
      filtered = filtered.filter(
        (reg) =>
          reg.studentName.toLowerCase().includes(normalizedSearchTerm) ||
          reg.parentName.toLowerCase().includes(normalizedSearchTerm) ||
          reg.email.toLowerCase().includes(normalizedSearchTerm) ||
          reg.schoolName.toLowerCase().includes(normalizedSearchTerm),
      )
    }

    if (selectedProgram !== "all") {
      filtered = filtered.filter((reg) => reg.program === selectedProgram)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((reg) => {
        if (statusFilter === "cancelled") return reg.cancelled
        if (reg.cancelled) return false
        return statusFilter === "approved" ? reg.approved : !reg.approved
      })
    }

    return filtered
  }, [data, normalizedSearchTerm, selectedProgram, statusFilter])

  const counts = useMemo(() => {
    const approved = data.filter((r) => r.approved).length
    const cancelled = data.filter((r) => r.cancelled).length
    return {
      total: data.length,
      approved: approved - cancelled,
      pending: data.length - approved - cancelled,
      cancelled,
    }
  }, [data])

  // Check admin access and redirect if needed
  useEffect(() => {
    if (status === 'loading') return

    // If no session at all, redirect to sign in
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // If session exists but email is not authorized, redirect to unauthorized
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!session.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch data when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return

    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetch("/api/admin/session-approval")
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

  // Check admin access before rendering dashboard
  if (status === 'loading') {
    return (
      <AdminPageShell moduleId="session-approval">
        <Panel>
          <LoadingState label="Checking access…" />
        </Panel>
      </AdminPageShell>
    )
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']

  if (!session.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
  }

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
      const updated = json.registration as SessionApproval
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved, adminEmail: updated.adminEmail } : r))
    } catch (e) {
      console.error(e)
      toast.error('Approve failed')
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
      const updated = json.registration as SessionApproval
      setData(prev => prev.map(r => r.id === updated.id ? { ...r, approved: updated.approved, adminEmail: updated.adminEmail } : r))
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Unapprove failed')
    } finally {
      setApproving(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const cancelRegistration = async () => {
    if (!cancellationTarget || !cancellationReason.trim()) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/admin/registration/${cancellationTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: cancellationReason.trim() }),
      })
      const response = await res.json()
      if (!res.ok) throw new Error(response.error || "Cancellation failed")
      const updated = response.registration as SessionApproval
      setData((prev) => prev.map((registration) => registration.id === updated.id ? updated : registration))
      setCancellationTarget(null)
      setCancellationReason("")
      toast.success("Session cancelled and parent notification queued")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cancellation failed")
    } finally {
      setCancelling(false)
    }
  }

  const filtersActive = Boolean(normalizedSearchTerm) || selectedProgram !== "all" || statusFilter !== "all"
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedProgram("all")
    setStatusFilter("all")
  }

  let body: React.ReactNode
  if (loading) {
    body = <LoadingState label="Loading session requests…" />
  } else if (error) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        title={error === "Not authorized" ? "Not authorized to view this page" : "Couldn't load session requests"}
        description={error === "Not authorized" ? "Your account doesn't have access to session approvals." : error}
      />
    )
  } else if (filteredData.length === 0) {
    body = (
      <EmptyState
        icon={Inbox}
        title={data.length === 0 ? "No session requests yet" : "No requests match your filters"}
        description={data.length === 0 ? "New requests will appear here as soon as parents register." : "Try a different search, program or status."}
        action={
          filtersActive ? (
            <button type="button" onClick={clearFilters} className={buttonClass("secondary", "sm")}>
              Clear filters
            </button>
          ) : undefined
        }
      />
    )
  } else {
    body = (
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              <th className="px-5 py-3">Request</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Preferred time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredData.map((reg) => {
              const busy = approving.has(reg.id)
              const isApprover = reg.adminEmail === session?.user?.email
              return (
                <tr key={reg.id} className="align-top transition-colors hover:bg-surface-muted/60">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-medium text-ink-soft">#{reg.id}</p>
                    <p className="mt-1 whitespace-nowrap text-xs text-subtle">{formatRegistered(reg.createdAt)}</p>
                  </td>
                  <td className="max-w-[220px] px-4 py-4">
                    <p className="truncate font-medium text-ink">{reg.parentName}</p>
                    <a
                      href={`mailto:${reg.parentEmail}`}
                      className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted hover:text-brand-700"
                      title={reg.parentEmail}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{reg.parentEmail}</span>
                    </a>
                    <a
                      href={`tel:${reg.parentPhone}`}
                      className="mt-0.5 flex items-center gap-1.5 text-xs text-muted hover:text-brand-700"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{reg.parentPhone}</span>
                    </a>
                  </td>
                  <td className="max-w-[200px] px-4 py-4">
                    <p className="truncate font-medium text-ink">{reg.studentName}</p>
                    <p className="mt-1 truncate text-xs text-muted" title={reg.schoolName}>
                      Grade {reg.grade} · {reg.schoolName}
                    </p>
                  </td>
                  <td className="max-w-[180px] px-4 py-4">
                    <Badge tone="brand">{reg.program}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-ink">
                      <Clock className="h-3.5 w-3.5 text-subtle" />
                      {reg.preferredTime}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {reg.cancelled ? (
                      <Badge tone="rose">Cancelled</Badge>
                    ) : reg.approved ? (
                      <Badge tone="emerald" icon={CheckCircle2}>Approved</Badge>
                    ) : (
                      <Badge tone="amber" dot>Pending</Badge>
                    )}
                    {reg.adminEmail && (
                      <p className="mt-1.5 max-w-[140px] truncate text-xs text-muted" title={reg.adminEmail}>
                        by <span className="font-medium text-ink-soft">{isApprover ? "you" : reg.adminEmail.split('@')[0]}</span>
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!reg.cancelled && (
                      <div className="flex justify-end gap-2">
                        {!reg.approved ? (
                          <button
                            type="button"
                            className={buttonClass("success", "sm", "min-w-[96px]")}
                            disabled={busy}
                            onClick={() => approve(reg.id)}
                            title="Approve registration"
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={buttonClass("dangerOutline", "sm", "min-w-[96px]")}
                            disabled={busy || !isApprover}
                            onClick={() => unapprove(reg.id)}
                            title={!isApprover ? "Only the approving admin can remove approval" : "Remove approval"}
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Remove
                          </button>
                        )}
                        <button
                          type="button"
                          className={buttonClass("dangerOutline", "sm")}
                          disabled={busy}
                          onClick={() => { setCancellationTarget(reg); setCancellationReason("") }}
                          title="Cancel session request"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <AdminPageShell moduleId="session-approval" description="Review session requests from parents and approve the ones you can take.">
      <>
      <Panel className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search requests</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search student, parent, email or school…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cx(inputClass, "pl-9")}
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-56">
              <span className="sr-only">Program</span>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className={selectClass}
              >
                <option value="all">All programs</option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>

            <Segmented
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All", count: counts.total },
                { value: "pending", label: "Pending", count: counts.pending },
                { value: "approved", label: "Approved", count: counts.approved },
                { value: "cancelled", label: "Cancelled", count: counts.cancelled },
              ]}
            />
          </div>
        </div>

        {!loading && !error && filtersActive && filteredData.length > 0 && (
          <div className="flex items-center justify-between border-b border-line bg-surface-muted/60 px-5 py-2 text-xs text-muted">
            <span>
              Showing <span className="font-semibold text-ink">{filteredData.length}</span> of {data.length} requests
            </span>
            <button type="button" onClick={clearFilters} className="font-medium text-brand-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {body}
        {cancellationTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-session-title">
            <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="cancel-session-title" className="text-lg font-semibold text-ink">Cancel session request</h2>
                  <p className="mt-1 text-sm text-muted">The parent will receive this explanation by email.</p>
                </div>
                <button type="button" onClick={() => setCancellationTarget(null)} className="rounded-lg p-1 text-muted hover:bg-surface-muted" aria-label="Close cancellation dialog">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 rounded-lg border border-line bg-surface-muted p-3 text-sm">
                <p className="font-medium text-ink">{cancellationTarget.studentName}</p>
                <p className="mt-1 text-muted">{cancellationTarget.program} · {cancellationTarget.preferredTime}</p>
              </div>
              <label htmlFor="cancellation-reason" className="mt-5 block text-sm font-medium text-ink-soft">Reason for cancellation</label>
              <textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                placeholder="Explain why this session is being cancelled…"
                rows={5}
                maxLength={2000}
                className={`${inputClass} mt-2 min-h-32 resize-y`}
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setCancellationTarget(null)} disabled={cancelling}>Keep request</button>
                <button type="button" className={buttonClass("danger", "sm")} onClick={() => void cancelRegistration()} disabled={cancelling || cancellationReason.trim().length < 3}>
                  {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Cancel session
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>
      </>
    </AdminPageShell>
  )
}
