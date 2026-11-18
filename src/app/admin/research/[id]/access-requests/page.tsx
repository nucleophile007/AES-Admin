"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { AlertTriangle, CheckCircle2, Clock, Loader2, Mail, Phone, Shield } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, buttonClass } from "@/components/admin/ui"

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to fetch")
    }
    return res.json()
  })

interface AccessRequest {
  id: string
  name: string
  email: string
  phone: string | null
  reason: string | null
  approved: boolean
  createdAt: string
}

interface ResearchSummary {
  id: string
  title: string
  slug: string
  author: string | null
  published: boolean
}

export default function ResearchAccessRequestsPage() {
  const params = useParams()
  const researchId = params.id as string

  const { data, error, isLoading, mutate } = useSWR(
    researchId ? `/api/admin/research/${researchId}/access-requests` : null,
    fetcher
  )

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    document.title = "Research Access Requests"
  }, [])

  const research: ResearchSummary | null = data?.research || null
  const requests: AccessRequest[] = data?.requests || []

  const stats = {
    total: requests.length,
    approved: requests.filter((request) => request.approved).length,
    pending: requests.filter((request) => !request.approved).length,
  }

  const approveRequest = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }))

    try {
      const res = await fetch("/api/admin/approve-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Approval failed")
      }

      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed")
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  return (
    <AdminPageShell
      moduleId="research"
      title="Access Requests"
      description={research ? `${research.title}${research.author ? ` · by ${research.author}` : ""}` : "Requests for the selected research"}
      parent={{ label: "Research", href: "/admin/research" }}
    >
      <Panel className="overflow-hidden">
        {!isLoading && !error && (
          <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm text-muted">
            <span><span className="font-semibold text-ink">{stats.total}</span> requests</span>
            <span aria-hidden>·</span>
            <Badge tone="amber" dot>{stats.pending} pending</Badge>
            <Badge tone="emerald" icon={CheckCircle2}>{stats.approved} approved</Badge>
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Loading access requests…" />
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Couldn't load access requests" description="Refresh the page to try again." />
        ) : requests.length === 0 ? (
          <EmptyState icon={Shield} title="No access requests yet" description="Requests for this research will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top transition-colors hover:bg-surface-muted/60">
                    <td className="max-w-[420px] px-5 py-4">
                      <p className="font-medium text-ink">{request.name}</p>
                      <a href={`mailto:${request.email}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-muted hover:text-brand-700">
                        <Mail className="h-3.5 w-3.5 shrink-0" />{request.email}
                      </a>
                      {request.phone && (
                        <a href={`tel:${request.phone}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-muted hover:text-brand-700">
                          <Phone className="h-3.5 w-3.5 shrink-0" />{request.phone}
                        </a>
                      )}
                      {request.reason && (
                        <p className="mt-2 rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-sm text-ink-soft">
                          <span className="font-medium text-ink">Reason:</span> {request.reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {request.approved ? <Badge tone="emerald" icon={CheckCircle2}>Approved</Badge> : <Badge tone="amber" icon={Clock}>Pending</Badge>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                      {new Date(request.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!request.approved ? (
                        <button type="button" onClick={() => approveRequest(request.id)} disabled={actionLoading[request.id]} className={buttonClass("success", "sm", "min-w-[96px]")}>
                          {actionLoading[request.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                      ) : (
                        <span className="text-xs text-subtle">No action needed</span>
                      )}
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
