"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, CheckCircle, Clock, Loader2, Mail, Phone, Shield, User } from "lucide-react"

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
      alert(err instanceof Error ? err.message : "Approval failed")
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-700">Loading access requests…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-medium">Failed to load access requests</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/research"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Research
            </Link>
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">Research Access Requests</h1>
              <p className="text-gray-600 mt-1">
                {research ? research.title : "Requests for selected research"}
              </p>
              {research?.author && <p className="text-sm text-gray-500 mt-1">By {research.author}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-800 font-medium">No access requests yet</p>
              <p className="text-sm text-gray-600 mt-1">
                Requests for this research will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Requester</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Requested At</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          {request.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {request.email}
                        </div>
                        {request.phone && (
                          <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {request.phone}
                          </div>
                        )}
                        {request.reason && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <span className="font-medium text-gray-800">Reason:</span> {request.reason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {request.approved ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        {!request.approved ? (
                          <button
                            onClick={() => approveRequest(request.id)}
                            disabled={actionLoading[request.id]}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                          >
                            {actionLoading[request.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Approved
                          </span>
                        )}
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