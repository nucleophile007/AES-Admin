// "use client"

// import { useEffect, useState } from "react"

// type Request = {
//   id: number
//   name: string
//   email: string
//   Research: { title: string }
// }

// export default function ResearchApprovalsPage() {
//   const [requests, setRequests] = useState<Request[]>([])
//   const [loadingId, setLoadingId] = useState<number | null>(null)

//   useEffect(() => {
//     fetch("/api/admin/research-approvals")
//       .then((res) => res.json())
//       .then((data) => setRequests(data.requests))
//   }, [])

//   async function approve(requestId: number) {
//     setLoadingId(requestId)

//     const res = await fetch("/api/admin/approve-access", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ requestId }),
//     })

//     if (res.ok) {
//       setRequests((prev) =>
//         prev.filter((r) => r.id !== requestId)
//       )
//     } else {
//       alert("Approval failed")
//     }

//     setLoadingId(null)
//   }

//   return (
//     <div className="p-8 max-w-5xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">
//         Research Access Requests
//       </h1>

//       {requests.length === 0 && (
//         <p className="text-gray-500">No pending requests 🎉</p>
//       )}

//       <ul className="space-y-4">
//         {requests.map((req) => (
//           <li
//             key={req.id}
//             className="border rounded-lg p-4 flex justify-between"
//           >
//             <div>
//               <p className="font-semibold">{req.name}</p>
//               <p className="text-sm text-gray-600">{req.email}</p>
//               <p className="text-sm text-gray-500">
//                 Research: {req.Research.title}
//               </p>
//             </div>

//             <button
//               onClick={() => approve(req.id)}
//               disabled={loadingId === req.id}
//               className="px-4 py-2 bg-green-600 text-white rounded"
//             >
//               {loadingId === req.id ? "Approving..." : "Approve"}
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }
"use client"

import useSWR from "swr"
import { useState } from "react"
import { CheckCircle, Loader2, Lock } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Failed to fetch")
    }
    return res.json()
  })

interface AccessRequest {
  id: number
  name: string
  email: string
  reason?: string | null
  createdAt: string
  Research: {
    title: string
  }
}


export default function ResearchApprovalsPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/research-approvals",
    fetcher
  )

  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})

  const requests: AccessRequest[] = data?.requests || []

  const approveRequest = async (requestId: number) => {
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

      // 🔁 Refresh list after approval
      await mutate()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }))
    }
  }

  /* ---------------- States ---------------- */

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
        <p className="text-red-600 font-medium">
          Failed to load access requests
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Research Access Requests
            </h1>
            <p className="text-sm text-gray-600">
              Approve users requesting full research access
            </p>
          </div>

          <Link
            href="/admin"
            className="text-sm px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium">
                No pending requests 🎉
              </p>
              <p className="text-sm text-gray-600 mt-1">
                All research access requests are approved
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Research
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Requested At
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{req.name}</div>
                        <div className="text-sm text-gray-600">{req.email}</div>

                        {req.reason && (
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <span className="font-medium text-gray-800">Reason:</span>{" "}
                            {req.reason}
                            </div>
                        )}
                        </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          <Lock className="w-3 h-3" />
                          {req.Research.title}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => approveRequest(req.id)}
                          disabled={actionLoading[req.id]}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                        >
                          {actionLoading[req.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
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
