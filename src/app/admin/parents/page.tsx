"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Edit3, GraduationCap, Loader2, Mail, Phone, Save, Search, Send, Users, X } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass } from "@/components/admin/ui"

interface Parent {
  id: number
  name: string
  email: string
  phone: string | null
  isActivated: boolean
  students: Array<{ id: number; name: string; email: string }>
}

export default function ParentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Parent | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  const loadParents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/parents")
      if (!response.ok) throw new Error("Failed to load parents")
      const data = await response.json()
      setParents(data.parents || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load parents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
    if (status === "authenticated") void loadParents()
  }, [status, router])

  const saveParent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setError("")
    try {
      const response = await fetch("/api/admin/parents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update parent")
      setParents((current) => current.map((parent) => parent.id === data.parent.id ? data.parent : parent))
      setEditing(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update parent")
    } finally {
      setSaving(false)
    }
  }

  const resendActivation = async (parent: Parent) => {
    setSendingId(parent.id)
    setError("")
    try {
      const response = await fetch(`/api/admin/parents/${parent.id}/send-activation`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to resend activation")
      toast.success(data.message)
      setParents((current) => current.map((item) => item.id === parent.id ? { ...item, isActivated: false } : item))
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to resend activation")
    } finally {
      setSendingId(null)
    }
  }

  const q = search.trim().toLowerCase()
  const counts = {
    all: parents.length,
    active: parents.filter((p) => p.isActivated).length,
    inactive: parents.filter((p) => !p.isActivated).length,
  }
  const visible = parents.filter((parent) => {
    if (statusFilter === "active" && !parent.isActivated) return false
    if (statusFilter === "inactive" && parent.isActivated) return false
    if (!q) return true
    return [parent.name, parent.email, parent.phone ?? "", ...parent.students.map((s) => s.name)].join(" ").toLowerCase().includes(q)
  })

  if (status === "loading" || !session) {
    return (
      <AdminPageShell moduleId="parents">
        <Panel><LoadingState label="Checking access…" /></Panel>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell moduleId="parents" description="Edit parent contact details and resend activation links.">
      {error && <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search parents</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parent, email, phone or student…"
              className={cx(inputClass, "pl-9")}
            />
          </label>
          <Segmented
            label="Activation"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Activated", count: counts.active },
              { value: "inactive", label: "Not activated", count: counts.inactive },
            ]}
          />
        </div>

        {loading ? (
          <LoadingState label="Loading parents…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={parents.length ? "No parents match your filters" : "No parent accounts found"}
            description={parents.length ? "Try a different name, email or status." : "Parent accounts appear here once families sign up."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((parent) => (
                  <tr key={parent.id} className="align-top transition-colors hover:bg-surface-muted/60">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold uppercase text-emerald-800 ring-1 ring-inset ring-emerald-100">
                          {parent.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{parent.name}</p>
                          <a href={`mailto:${parent.email}`} className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted hover:text-brand-700">
                            <Mail className="h-3.5 w-3.5 shrink-0" />{parent.email}
                          </a>
                          {parent.phone && (
                            <a href={`tel:${parent.phone}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-muted hover:text-brand-700">
                              <Phone className="h-3.5 w-3.5 shrink-0" />{parent.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {parent.students.length ? (
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {parent.students.map((student) => (
                            <Badge key={student.id} tone="slate" icon={GraduationCap}>{student.name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-subtle">No students linked</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {parent.isActivated ? (
                        <Badge tone="emerald" icon={CheckCircle2}>Activated</Badge>
                      ) : (
                        <Badge tone="amber" dot>Not activated</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(parent)} className={buttonClass("secondary", "sm")}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void resendActivation(parent)}
                          disabled={sendingId === parent.id}
                          className={buttonClass("primary", "sm")}
                        >
                          {sendingId === parent.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Resend activation
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]" onClick={() => setEditing(null)}>
          <form
            onSubmit={saveParent}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">Edit parent</h2>
                <p className="mt-0.5 text-sm text-muted">Update contact details for {editing.name}.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              {(["name", "email", "phone"] as const).map((field) => (
                <label key={field} className="block text-sm font-medium capitalize text-ink-soft">
                  {field}
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={editing[field] || ""}
                    onChange={(event) => setEditing({ ...editing, [field]: event.target.value })}
                    className={cx(inputClass, "mt-1.5")}
                    required={field !== "phone"}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={() => setEditing(null)} className={buttonClass("secondary")}>Cancel</button>
              <button type="submit" disabled={saving} className={buttonClass("primary")}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminPageShell>
  )
}
