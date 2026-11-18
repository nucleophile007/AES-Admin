"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Download, Eye, FileText, Loader2, Receipt, Search, X } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass, type BadgeTone } from "@/components/admin/ui"

interface TransactionReceipt {
  id: number
  parentId: number
  parentName: string
  parentEmail: string
  amount: string
  transactionDate: string
  transactionId: string | null
  description: string | null
  receiptUrl: string
  receiptFileName: string
  receiptFileSize: number
  status: string
  adminNotes: string | null
  createdAt: string
  reviewedAt: string | null
}

export default function TransactionReceiptsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [data, setData] = useState<TransactionReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<"verify" | "reject" | null>(null)
  const normalizedSearchTerm = useMemo(
    () => deferredSearchTerm.trim().toLowerCase(),
    [deferredSearchTerm],
  )
  const filteredData = useMemo(() => {
    if (!normalizedSearchTerm) {
      return data
    }

    return data.filter(
      (receipt) =>
        receipt.parentName.toLowerCase().includes(normalizedSearchTerm) ||
        receipt.parentEmail.toLowerCase().includes(normalizedSearchTerm) ||
        receipt.transactionId?.toLowerCase().includes(normalizedSearchTerm) ||
        receipt.amount.toLowerCase().includes(normalizedSearchTerm),
    )
  }, [data, normalizedSearchTerm])

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

  // Fetch receipts when authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    
    const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']
    if (!allowedEmails.includes(session.user.email.toLowerCase())) return

    fetchReceipts()
  }, [session, status, selectedStatus])

  const fetchReceipts = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const url = selectedStatus !== "all" 
        ? `/api/admin/transaction-receipts?status=${selectedStatus}`
        : `/api/admin/transaction-receipts`
      const res = await fetch(url)
      if (res.status === 403) {
        throw new Error("Not authorized")
      }
      if (!res.ok) {
        throw new Error("Failed to load transaction receipts")
      }
      
      const json = await res.json()
      setData(json.receipts || [])
    } catch (e: any) {
      console.error('Failed to load transaction receipts:', e.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const updateReceiptStatus = async (id: number, newStatus: string, notes?: string) => {
    setActionLoading(prev => ({ ...prev, [`status-${id}`]: true }))
    
    try {
      const res = await fetch(`/api/admin/transaction-receipts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: notes || undefined
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update receipt status')
      
      await res.json()
      await fetchReceipts(false)
      setShowReviewModal(false)
      setAdminNotes("")
      setSelectedReceipt(null)
      setReviewAction(null)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${id}`]: false }))
    }
  }

  const openReviewModal = (receipt: TransactionReceipt, action: "verify" | "reject") => {
    setSelectedReceipt(receipt)
    setAdminNotes(receipt.adminNotes || "")
    setReviewAction(action)
    setShowReviewModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Check admin access before rendering dashboard
  if (status !== 'loading' && !session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']

  if (status !== 'loading' && (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase()))) {
    return null // Will redirect to unauthorized via useEffect
  }

  const STATUS_BADGE: Record<string, { tone: BadgeTone; label: string }> = {
    pending: { tone: 'amber', label: 'Pending review' },
    verified: { tone: 'emerald', label: 'Verified' },
    rejected: { tone: 'rose', label: 'Rejected' },
  }

  const closeReview = () => {
    setShowReviewModal(false)
    setAdminNotes("")
    setSelectedReceipt(null)
    setReviewAction(null)
  }

  const formatDay = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <AdminPageShell moduleId="transaction-receipts" description="Review payment receipts uploaded by parents, then verify or reject them.">
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search receipts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search parent, email, transaction ID or amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          <Segmented
            label="Status"
            value={selectedStatus as 'all' | 'pending' | 'verified' | 'rejected'}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'verified', label: 'Verified' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>

        {!loading && filteredData.length !== data.length && (
          <div className="flex items-center justify-between border-b border-line bg-surface-muted/60 px-5 py-2 text-xs text-muted">
            <span>Showing <span className="font-semibold text-ink">{filteredData.length}</span> of {data.length} receipts</span>
            <button type="button" onClick={() => setSearchTerm('')} className="font-medium text-brand-700 hover:underline">Clear search</button>
          </div>
        )}

        {status === 'loading' || loading ? (
          <LoadingState label="Loading transaction receipts…" />
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={data.length ? 'No receipts match your search' : selectedStatus === 'all' ? 'No receipts yet' : `No ${selectedStatus} receipts`}
            description={data.length ? 'Try a different name, email, ID or amount.' : 'Receipts appear here when parents upload them.'}
          />
        ) : (
          <ul className="divide-y divide-line">
            {filteredData.map((receipt) => {
              const badge = STATUS_BADGE[receipt.status] ?? STATUS_BADGE.pending
              return (
                <li key={receipt.id} className="px-5 py-5 transition-colors hover:bg-surface-muted/40">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    {/* Amount */}
                    <div className="lg:w-40 lg:shrink-0">
                      <p className="font-display text-2xl font-bold tracking-tight text-ink tabular-nums">${receipt.amount}</p>
                      <p className="mt-0.5 text-xs text-muted">Paid {receipt.transactionDate}</p>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{receipt.parentName}</p>
                        <Badge tone={badge.tone} dot>{badge.label}</Badge>
                      </div>
                      <a href={`mailto:${receipt.parentEmail}`} className="mt-0.5 block truncate text-sm text-muted hover:text-brand-700">{receipt.parentEmail}</a>
                      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                        {receipt.transactionId && (
                          <div className="flex items-center gap-1.5">
                            <dt>Transaction ID</dt>
                            <dd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-ink-soft ring-1 ring-inset ring-line">{receipt.transactionId}</dd>
                          </div>
                        )}
                        <div className="flex items-center gap-1"><dt>Submitted</dt><dd className="text-ink-soft">{formatDay(receipt.createdAt)}</dd></div>
                        {receipt.reviewedAt && <div className="flex items-center gap-1"><dt>Reviewed</dt><dd className="text-ink-soft">{formatDay(receipt.reviewedAt)}</dd></div>}
                      </dl>

                      {receipt.description && (
                        <p className="mt-3 whitespace-pre-wrap rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-sm text-ink-soft">{receipt.description}</p>
                      )}
                      {receipt.adminNotes && (
                        <div className="mt-2 rounded-lg border-l-2 border-brand-400 bg-brand-50 px-3 py-2 text-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-700">Admin notes</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-brand-900">{receipt.adminNotes}</p>
                        </div>
                      )}

                      <a
                        href={receipt.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card transition hover:border-brand-200 hover:bg-brand-50/40"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                        <span className="truncate font-medium text-ink-soft">{receipt.receiptFileName}</span>
                        <span className="shrink-0 text-subtle">{formatFileSize(receipt.receiptFileSize)}</span>
                        <Download className="h-3.5 w-3.5 shrink-0 text-muted" />
                      </a>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
                      {receipt.status === "pending" ? (
                        <>
                          <button type="button" onClick={() => openReviewModal(receipt, "verify")} className={buttonClass('success', 'sm', 'min-w-[96px]')}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                          </button>
                          <button type="button" onClick={() => openReviewModal(receipt, "reject")} className={buttonClass('dangerOutline', 'sm', 'min-w-[96px]')}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReviewModal(receipt, receipt.status === "verified" ? "verify" : "reject")}
                          className={buttonClass('secondary', 'sm', 'min-w-[96px]')}
                        >
                          <Eye className="h-3.5 w-3.5" /> Review
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {/* Review Modal */}
      {showReviewModal && selectedReceipt && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">
                  {reviewAction === "verify" ? "Verify receipt" : "Reject receipt"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">{selectedReceipt.parentName} · {selectedReceipt.parentEmail}</p>
              </div>
              <button type="button" onClick={closeReview} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-muted/60 p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Amount</dt>
                  <dd className="font-display text-lg font-bold text-ink tabular-nums">${selectedReceipt.amount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Transaction date</dt>
                  <dd className="mt-1 text-ink">{selectedReceipt.transactionDate}</dd>
                </div>
              </dl>
              <label className="block text-sm font-medium text-ink-soft">
                Admin notes {reviewAction === "reject" ? <span className="text-rose-600">(required)</span> : <span className="font-normal text-subtle">(optional)</span>}
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={reviewAction === "verify" ? "Add optional notes…" : "Please provide a reason for rejection…"}
                  className="mt-1.5 h-32 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                  required={reviewAction === "reject"}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={closeReview} className={buttonClass('secondary')}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (reviewAction === "reject" && !adminNotes.trim()) {
                    toast.error("Please provide a reason for rejection")
                    return
                  }
                  updateReceiptStatus(selectedReceipt.id, reviewAction === "verify" ? "verified" : "rejected", adminNotes)
                }}
                disabled={actionLoading[`status-${selectedReceipt.id}`]}
                className={buttonClass(reviewAction === "verify" ? 'success' : 'danger')}
              >
                {actionLoading[`status-${selectedReceipt.id}`] && <Loader2 className="h-4 w-4 animate-spin" />}
                {reviewAction === "verify" ? "Verify receipt" : "Reject receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
