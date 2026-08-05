'use client'

import React, { useState, useEffect } from 'react'
import { X, FileText, Upload, Trash2, Download, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Research {
  id: string
  title: string
  slug: string
  pdfFilename: string | null
  extractionStatus: string | null
  extractedAt: string | null
}

interface ManagePdfDialogProps {
  researchId: string
  onClose: () => void
  onUpdate: () => void
}

export default function ManagePdfDialog({ researchId, onClose, onUpdate }: ManagePdfDialogProps) {
  const [research, setResearch] = useState<Research | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchResearch()
  }, [researchId])

  const fetchResearch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/research/${researchId}`)
      if (!response.ok) throw new Error('Failed to fetch research')
      const data = await response.json()
      setResearch(data.research)
    } catch (err) {
      toast.error('Failed to load research')
    } finally {
      setLoading(false)
    }
  }

  const deletePdf = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete the PDF file? This will also clear all extracted content and metadata. This action cannot be undone.'
    )
    if (!confirmed) return

    setDeleting(true)
    const loadingToast = toast.loading('Deleting PDF...')

    try {
      const response = await fetch(`/api/admin/research/${researchId}/pdf`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete PDF')
      }

      toast.success('PDF deleted successfully', { id: loadingToast })
      await fetchResearch()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete PDF', { id: loadingToast })
    } finally {
      setDeleting(false)
    }
  }

  const triggerReExtract = async () => {
    const confirmed = window.confirm(
      'This will re-extract content from the PDF. Existing extracted data will be replaced. Continue?'
    )
    if (!confirmed) return

    const loadingToast = toast.loading('Re-extracting PDF content...')

    try {
      const response = await fetch(`/api/admin/research/${researchId}/re-extract`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to re-extract PDF')
      }

      toast.success('PDF content re-extracted successfully', { id: loadingToast })
      await fetchResearch()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-extract PDF', { id: loadingToast })
    }
  }

  const openSignedPdf = async (endpointPath: string, filename: string) => {
    try {
      const response = await fetch(endpointPath)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load PDF')
      }

      if (!data.url) {
        throw new Error('PDF URL is missing')
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error(`Failed to open ${filename}:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to open ${filename}`)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PDF info...</p>
        </div>
      </div>
    )
  }

  if (!research) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <p className="text-red-600">Failed to load research</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    )
  }

  const getExtractionStatusDisplay = () => {
    if (!research.extractionStatus) {
      return {
        icon: <Clock className="w-5 h-5 text-gray-400" />,
        text: 'Not extracted',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      }
    }

    switch (research.extractionStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: 'Extracted successfully',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'failed':
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          text: 'Extraction failed',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      default:
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: research.extractionStatus,
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        }
    }
  }

  const extractionStatus = getExtractionStatusDisplay()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Manage Report PDF</h3>
            <p className="text-sm text-gray-500 mt-1">{research.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {research.pdfFilename ? (
            <>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-4">
                  <FileText className="w-12 h-12 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Technical Report PDF</h4>
                    <p className="text-sm text-gray-700 break-all mb-2">{research.pdfFilename}</p>
                    
                    {/* Extraction Status */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${extractionStatus.bgColor} ${extractionStatus.color} text-sm font-medium`}>
                      {extractionStatus.icon}
                      {extractionStatus.text}
                    </div>

                    {research.extractedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Extracted: {new Date(research.extractedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900">Actions</h4>

                {/* View PDF */}
                <button
                  type="button"
                  onClick={() => openSignedPdf(`/api/research/${research.slug}/pdf`, 'report PDF')}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                  disabled={!research.pdfFilename}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">View / Download Report PDF</p>
                    <p className="text-xs text-gray-500">Opens the signed PDF in a new tab</p>
                  </div>
                </button>

                {/* Re-extract Content */}
                <button
                  onClick={triggerReExtract}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Re-extract PDF Content</p>
                    <p className="text-xs text-gray-500">Extract text and metadata from the PDF again</p>
                  </div>
                </button>

                {/* Upload New PDF */}
                <button
                  type="button"
                  onClick={() => window.location.assign(`/admin/research/${researchId}/upload`)}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <Upload className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Replace PDF</p>
                    <p className="text-xs text-gray-500">Upload a new PDF (old one will be deleted)</p>
                  </div>
                </button>

                {/* Delete PDF */}
                <button
                  onClick={deletePdf}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Delete PDF</p>
                    <p className="text-xs text-red-600">Permanently remove the PDF file and extracted data</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
                {/* No PDF */}
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No PDF file uploaded</p>
                <p className="text-sm text-gray-500">Upload a PDF to enable watermarking and content extraction</p>
              </div>

              {/* Upload Action */}
              <button
                type="button"
                onClick={() => window.location.assign(`/admin/research/${researchId}/upload`)}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Upload PDF</p>
                  <p className="text-xs text-gray-500">Go to upload page</p>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
