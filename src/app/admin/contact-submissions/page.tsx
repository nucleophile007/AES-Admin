"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ChevronDown, Inbox, Mail, Phone, RefreshCw, Search, X } from "lucide-react"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, buttonClass, cx, inputClass, selectClass, type BadgeTone } from "@/components/admin/ui"

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

function getStatusTone(status: string): BadgeTone {
  const s = status.toLowerCase()
  if (s === "new") return "brand"
  if (s === "contacted") return "amber"
  if (s === "resolved" || s === "closed") return "emerald"
  return "slate"
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")

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

  if (status !== "loading" && !session) {
    return null
  }

  const selectWrap = "relative block sm:w-48"

  return (
    <AdminPageShell
      moduleId="contact-submissions"
      description="Messages sent through the website's contact form."
      actions={
        <button type="button" onClick={() => fetchSubmissions(true)} disabled={refreshing || loading} className={buttonClass("secondary")}>
          <RefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} /> Refresh
        </button>
      }
    >
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search messages</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search name, email, phone, subject or message…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cx(inputClass, "pl-9")}
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className={selectWrap}>
              <span className="sr-only">Status</span>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectClass}>
                <option value="all">All statuses</option>
                {statusOptions.map((statusValue) => (
                  <option key={statusValue} value={statusValue}>{titleCase(statusValue)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
            <label className={selectWrap}>
              <span className="sr-only">Source</span>
              <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className={selectClass}>
                <option value="all">All sources</option>
                {sourceOptions.map((sourceValue) => (
                  <option key={sourceValue} value={sourceValue}>{sourceValue}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
          </div>
        </div>

        {!loading && !error && (
          <div className="border-b border-line bg-surface-muted/60 px-5 py-2 text-xs text-muted">
            Showing <span className="font-semibold text-ink">{filteredData.length}</span> of {data.length} messages
          </div>
        )}

        {status === "loading" || loading ? (
          <LoadingState label="Loading messages…" />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title={error === "Not authorized" ? "Not authorized to view this page" : "Couldn't load messages"}
            description={error === "Not authorized" ? undefined : error}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState icon={Inbox} title={data.length ? "No messages match your filters" : "No messages yet"} description={data.length ? "Try a different search, status or source." : "Messages from the website's contact form appear here."} />
        ) : (
          <ul className="divide-y divide-line">
            {filteredData.map((submission) => (
              <li key={submission.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(submission)}
                  className="group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-xs font-semibold uppercase text-gold-700 ring-1 ring-inset ring-gold-200">
                    {initials(submission.fullName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-ink">{submission.fullName}</span>
                      {submission.role && <Badge tone="slate">{submission.role}</Badge>}
                      {submission.programInterest && <Badge tone="brand">{submission.programInterest}</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {submission.email}{submission.phone ? ` · ${submission.phone}` : ""}
                    </span>
                    <span className="mt-2 block truncate text-sm font-medium text-ink group-hover:text-brand-700">{submission.subject}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{submission.message}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="whitespace-nowrap text-xs text-subtle">
                      {new Date(submission.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <Badge tone={getStatusTone(submission.status)} dot>{titleCase(submission.status)}</Badge>
                    <span className="text-[11px] text-subtle">{submission.source}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]" onClick={() => setSelectedSubmission(null)}>
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-subtle">Message #{selectedSubmission.id}</p>
                <h3 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-ink">{selectedSubmission.subject}</h3>
                <p className="mt-0.5 text-sm text-muted">
                  From {selectedSubmission.fullName} · {new Date(selectedSubmission.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedSubmission(null)} className={buttonClass("ghost", "icon")} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${selectedSubmission.email}?subject=${encodeURIComponent(`Re: ${selectedSubmission.subject}`)}`} className={buttonClass("primary", "sm")}>
                  <Mail className="h-4 w-4" /> Reply by email
                </a>
                {selectedSubmission.phone && (
                  <a href={`tel:${selectedSubmission.phone}`} className={buttonClass("secondary", "sm")}>
                    <Phone className="h-4 w-4" /> Call {selectedSubmission.phone}
                  </a>
                )}
              </div>

              <div className="whitespace-pre-wrap rounded-lg border border-line bg-surface-muted/60 p-4 text-sm leading-relaxed text-ink-soft">
                {selectedSubmission.message}
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ["Email", selectedSubmission.email],
                  ["Phone", selectedSubmission.phone],
                  ["Role", selectedSubmission.role],
                  ["Program interest", selectedSubmission.programInterest],
                  ["Preferred contact", selectedSubmission.preferredContact],
                  ["Student", [selectedSubmission.studentName, selectedSubmission.studentGrade && `Grade ${selectedSubmission.studentGrade}`].filter(Boolean).join(" · ")],
                  ["Status", titleCase(selectedSubmission.status)],
                  ["Source", selectedSubmission.source],
                  ["Last updated", new Date(selectedSubmission.updatedAt).toLocaleString("en-US")],
                  ["IP address", selectedSubmission.ipAddress],
                ].map(([label, value]) => (
                  <div key={label as string} className="min-w-0">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="mt-0.5 truncate font-medium text-ink">{value || "—"}</dd>
                  </div>
                ))}
              </dl>

              {selectedSubmission.userAgent && (
                <details className="rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-xs text-muted">
                  <summary className="cursor-pointer font-medium text-ink-soft">Browser details</summary>
                  <p className="mt-2 break-all">{selectedSubmission.userAgent}</p>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
