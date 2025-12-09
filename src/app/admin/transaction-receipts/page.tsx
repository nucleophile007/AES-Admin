"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Receipt, Filter, CheckCircle, X, Loader2, Eye, Download, FileText } from "lucide-react"

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
  const [filteredData, setFilteredData] = useState<TransactionReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<"verify" | "reject" | null>(null)

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

  const fetchReceipts = async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = data
    
    if (searchTerm) {
      filtered = filtered.filter(
        (receipt) =>
          receipt.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.parentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.amount.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }, [searchTerm, data])

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
      await fetchReceipts()
      setShowReviewModal(false)
      setAdminNotes("")
      setSelectedReceipt(null)
      setReviewAction(null)
    } catch (e: any) {
      console.error(e)
      alert(e.message)
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
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading transaction receipts...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign in via useEffect
  }

  const allowedEmails = ['deepak@acharyatutoring.com', 'acharyatutoring@gmail.com', 'dkdps3212@gmail.com', '220030007@iitdh.ac.in', 'acharya.folsom@gmail.com', 'luvshanker14@gmail.com']

  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return null // Will redirect to unauthorized via useEffect
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    verified: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction Receipts</h1>
                <p className="text-sm text-gray-700">Review and verify payment receipts from parents</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search by parent name, email, transaction ID, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          {filteredData.length !== data.length && (
            <div className="mt-4 text-sm text-gray-800 font-medium">
              Showing {filteredData.length} of {data.length} receipts
            </div>
          )}
        </div>
      </div>

      {/* Receipts List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No transaction receipts found</p>
              {!data.length && (
                <p className="text-gray-500 mt-2">No receipts have been submitted yet</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredData.map((receipt) => (
                <div key={receipt.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{receipt.parentName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[receipt.status as keyof typeof statusColors] || statusColors.pending}`}>
                          {receipt.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{receipt.parentEmail}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount: </span>
                          <span className="font-semibold text-green-700">${receipt.amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date: </span>
                          <span className="text-gray-900">{receipt.transactionDate}</span>
                        </div>
                        {receipt.transactionId && (
                          <div>
                            <span className="text-gray-500">Transaction ID: </span>
                            <span className="text-gray-900 font-mono text-xs">{receipt.transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Submitted</div>
                      <div>{new Date(receipt.createdAt).toLocaleDateString()}</div>
                      {receipt.reviewedAt && (
                        <>
                          <div className="mt-2">Reviewed</div>
                          <div>{new Date(receipt.reviewedAt).toLocaleDateString()}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {receipt.description && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{receipt.description}</p>
                    </div>
                  )}

                  {receipt.adminNotes && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
                      <p className="text-blue-800 whitespace-pre-wrap">{receipt.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <a
                        href={receipt.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        <Download className="w-3 h-3" />
                        Download Receipt
                      </a>
                      <span className="text-xs text-gray-500">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {receipt.receiptFileName} ({formatFileSize(receipt.receiptFileSize)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {receipt.status === "pending" && (
                        <>
                          <button
                            onClick={() => openReviewModal(receipt, "verify")}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Verify
                          </button>
                          <button
                            onClick={() => openReviewModal(receipt, "reject")}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                      {receipt.status !== "pending" && (
                        <button
                          onClick={() => openReviewModal(receipt, receipt.status === "verified" ? "verify" : "reject")}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedReceipt && reviewAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === "verify" ? "Verify Receipt" : "Reject Receipt"}
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {reviewAction === "verify" ? "Verifying receipt for" : "Rejecting receipt for"}: {selectedReceipt.parentName} ({selectedReceipt.parentEmail})
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Amount: </span>
                    <span className="font-semibold text-green-700">${selectedReceipt.amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction Date: </span>
                    <span className="text-gray-900">{selectedReceipt.transactionDate}</span>
                  </div>
                </div>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes {reviewAction === "reject" && "(required)"}
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={reviewAction === "verify" ? "Add optional notes..." : "Please provide a reason for rejection..."}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 mb-4"
              required={reviewAction === "reject"}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setAdminNotes("")
                  setSelectedReceipt(null)
                  setReviewAction(null)
                }}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewAction === "reject" && !adminNotes.trim()) {
                    alert("Please provide a reason for rejection")
                    return
                  }
                  updateReceiptStatus(selectedReceipt.id, reviewAction === "verify" ? "verified" : "rejected", adminNotes)
                }}
                disabled={actionLoading[`status-${selectedReceipt.id}`]}
                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
                  reviewAction === "verify"
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                }`}
              >
                {actionLoading[`status-${selectedReceipt.id}`] && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {reviewAction === "verify" ? "Verify Receipt" : "Reject Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

