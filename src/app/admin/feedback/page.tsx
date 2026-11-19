"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CalendarClock, CheckCircle2, ChevronDown, ChevronsDownUp, ChevronsUpDown, Eye, Loader2, MessageSquare, RefreshCw, Search, Star, X } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass } from "@/components/admin/ui"

interface Feedback {
  id: number
  parentId: number | null
  parentName: string | null
  parentEmail: string | null
  studentName: string | null
  grade: string | null
  school: string | null
  programs: string[]
  heardAbout: string | null
  beforeAfterExpectations: string | null
  childExperience: string | null
  successStory: string | null
  overallExperience: string | null
  studentRating: number | null
  schedulingRating: number | null
  wouldRecommend: string | null
  consentToFeature: boolean
  favoriteThingToShare: string | null
  suggestions: string | null
  message: string | null
  rating: number | null
  status: string
  response: string | null
  isApproved: boolean
  isVisible: boolean
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
}

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [expandedPrograms, setExpandedPrograms] = useState<Record<number, boolean>>({})
  // Entries start collapsed; open ones show the written answers.
  const [openEntries, setOpenEntries] = useState<Set<number>>(new Set())
  const toggleEntry = (id: number) =>
    setOpenEntries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const normalizedSearchTerm = useMemo(
    () => deferredSearchTerm.trim().toLowerCase(),
    [deferredSearchTerm],
  )
  const filteredData = useMemo(() => {
    let filtered = data

    if (selectedStatus !== "all") {
      if (selectedStatus === "approved") {
        filtered = filtered.filter((feedback) => feedback.isApproved)
      } else if (selectedStatus === "pending") {
        filtered = filtered.filter((feedback) => !feedback.isApproved)
      }
    }

    if (normalizedSearchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          (feedback.parentName && feedback.parentName.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.studentName && feedback.studentName.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.childExperience && feedback.childExperience.toLowerCase().includes(normalizedSearchTerm)) ||
          (feedback.school && feedback.school.toLowerCase().includes(normalizedSearchTerm)),
      )
    }

    return filtered
  }, [data, normalizedSearchTerm, selectedStatus])

  // Check admin access and redirect if needed
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Auto-sync and fetch feedback when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    // Auto-sync on page load, then fetch feedback
    syncFromSheet()
  }, [session, status])

  const syncFromSheet = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      
      const response = await fetch('/api/admin/parent-testimonials/sync', {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to sync from Google Sheets')
      
      const result = await response.json()
      
      if (result.stats) {
        const { imported, skipped, errors } = result.stats
        setSyncMessage(`Synced: ${imported} imported, ${skipped} skipped, ${errors} errors`)
      }
      
      // After syncing, fetch the updated feedback
      await fetchFeedback()
    } catch (err) {
      console.error('Sync error:', err)
      // Still try to fetch feedback even if sync fails
      await fetchFeedback()
    } finally {
      setSyncing(false)
    }
  }

  const fetchFeedback = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const url = `/api/admin/parent-testimonials`
      const res = await fetch(url)
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load parent testimonials")
      }
      
      const json = await res.json()
      setData(json || [])
    } catch (e: any) {
      console.error('Failed to load parent testimonials:', e.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const updateFeedbackStatus = async (id: number, isApproved: boolean) => {
    setActionLoading(prev => ({ ...prev, [`status-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/parent-testimonials`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isApproved }),
      })
      
      if (!res.ok) throw new Error('Failed to update testimonial status')
      
      await res.json()
      await fetchFeedback(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const viewFullContent = (title: string, content: string) => {
    setViewingContent({ title, content })
  }

  const counts = {
    all: data.length,
    approved: data.filter((f) => f.isApproved).length,
    pending: data.filter((f) => !f.isApproved).length,
  }

  // Check admin access before rendering dashboard
  if (status !== 'loading' && !session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']

  if (status !== 'loading' && (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase()))) {
    return null // Will redirect to unauthorized via useEffect
  }

  const answers = (pt: Feedback) =>
    [
      { title: 'Before / after', content: pt.beforeAfterExpectations },
      { title: "Child's experience", content: pt.childExperience },
      { title: 'Success story', content: pt.successStory },
      { title: 'Overall experience', content: pt.overallExperience },
    ].filter((a): a is { title: string; content: string } => Boolean(a.content))

  const allOpen = filteredData.length > 0 && filteredData.every((f) => openEntries.has(f.id))

  return (
    <AdminPageShell
      moduleId="feedback"
      title="Parent Feedback"
      description="Review testimonials from parents and approve the ones to feature on the website."
      actions={
        <button type="button" onClick={syncFromSheet} disabled={syncing} className={buttonClass('secondary')}>
          <RefreshCw className={cx('h-4 w-4', syncing && 'animate-spin')} />
          {syncing ? 'Syncing…' : 'Sync from sheet'}
        </button>
      }
    >
      {syncMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {syncMessage}
        </div>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search feedback</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search parent, student, school or experience…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          <Segmented
            label="Approval"
            value={selectedStatus as 'all' | 'approved' | 'pending'}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'pending', label: 'Pending', count: counts.pending },
              { value: 'approved', label: 'Approved', count: counts.approved },
            ]}
          />
          {filteredData.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenEntries(allOpen ? new Set() : new Set(filteredData.map((f) => f.id)))}
              className={buttonClass('secondary', 'md', 'shrink-0')}
            >
              {allOpen ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        {status === 'loading' || loading ? (
          <LoadingState label={syncing ? 'Syncing from Google Sheets…' : 'Loading feedback…'} />
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={data.length ? 'No feedback matches your filters' : 'No parent feedback yet'}
            description={data.length ? 'Try a different search or approval status.' : 'Submissions appear here after a sync from the Google Sheet.'}
          />
        ) : (
          <ul className="divide-y divide-line">
            {filteredData.map((pt) => {
              const busy = actionLoading[`status-${pt.id}`]
              const expanded = expandedPrograms[pt.id]
              const programs = pt.programs || []
              const shownPrograms = expanded ? programs : programs.slice(0, 3)
              const items = answers(pt)
              const open = openEntries.has(pt.id)
              return (
                <li key={pt.id} className={cx('transition-colors', open ? 'bg-surface-muted/30' : 'hover:bg-surface-muted/40')}>
                  <div
                    onClick={() => toggleEntry(pt.id)}
                    className="flex cursor-pointer flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleEntry(pt.id)
                        }}
                        aria-expanded={open}
                        aria-controls={`feedback-answers-${pt.id}`}
                        aria-label={open ? 'Collapse entry' : 'Expand entry'}
                        className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-subtle transition hover:bg-surface hover:text-ink"
                      >
                        <ChevronDown className={cx('h-4 w-4 transition-transform duration-200', !open && '-rotate-90')} />
                      </button>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold uppercase text-brand-800 ring-1 ring-inset ring-brand-100">
                        {(pt.studentName || '?').split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-ink">{pt.studentName || 'Unnamed student'}</span>
                          {pt.grade && <Badge tone="violet">{pt.grade}</Badge>}
                          {pt.school && <span className="text-sm text-muted">{pt.school}</span>}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          From <span className="font-medium text-ink-soft">{pt.parentName || 'Unknown parent'}</span>
                          {pt.submittedAt && (
                            <> · {new Date(pt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                          )}
                          {!open && (
                            <span className="text-subtle"> · {items.length ? `${items.length} written ${items.length === 1 ? 'answer' : 'answers'}` : 'No written answers'}</span>
                          )}
                        </p>
                        {programs.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {shownPrograms.map((program, idx) => <Badge key={idx} tone="brand">{program}</Badge>)}
                            {programs.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedPrograms((prev) => ({ ...prev, [pt.id]: !expanded }))
                                }}
                                className="text-xs font-medium text-brand-700 hover:underline"
                              >
                                {expanded ? 'Show less' : `+${programs.length - 3} more`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                      {pt.studentRating ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-700 ring-1 ring-inset ring-gold-200" title="Student rating">
                          <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" /> {pt.studentRating}/5
                        </span>
                      ) : null}
                      {pt.schedulingRating ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-soft ring-1 ring-inset ring-line" title="Scheduling rating">
                          <CalendarClock className="h-3.5 w-3.5" /> {pt.schedulingRating}/5
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateFeedbackStatus(pt.id, !pt.isApproved)
                        }}
                        disabled={busy}
                        title={pt.isApproved ? 'Approved. Click to unapprove.' : 'Approve for the website'}
                        className={buttonClass(pt.isApproved ? 'success' : 'secondary', 'sm', 'min-w-[104px]')}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : pt.isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {pt.isApproved ? 'Approved' : 'Approve'}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div id={`feedback-answers-${pt.id}`} className="px-5 pb-5 lg:pl-[88px]">
                      {items.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {items.map((item) => (
                            <button
                              key={item.title}
                              type="button"
                              onClick={() => viewFullContent(item.title, item.content)}
                              className="group rounded-lg border border-line bg-surface-muted/50 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle">{item.title}</p>
                              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-soft">{item.content}</p>
                              <p className="mt-1.5 text-xs font-medium text-brand-700 opacity-0 transition group-hover:opacity-100">Read full answer →</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm italic text-subtle">No written answers.</p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {/* Full Content Modal */}
      {viewingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]" onClick={() => setViewingContent(null)}>
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{viewingContent.title}</h3>
              <button type="button" onClick={() => setViewingContent(null)} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap leading-relaxed text-ink-soft">{viewingContent.content}</p>
            </div>
            <div className="flex justify-end border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={() => setViewingContent(null)} className={buttonClass('primary')}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
