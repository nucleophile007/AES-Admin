'use client'

import React, { useEffect, useState } from 'react'
import { X, FileText, Upload, Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'

interface Research {
  id: string
  title: string
  slug: string
  presentationPdfFilename: string | null
}

interface ManagePresentationDialogProps {
  researchId: string
  onClose: () => void
  onUpdate: () => void
}

export default function ManagePresentationDialog({ researchId, onClose, onUpdate }: ManagePresentationDialogProps) {
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
    } catch (error) {
      toast.error('Failed to load research')
    } finally {
      setLoading(false)
    }
  }

  const openSignedPresentation = async () => {
    if (!research?.presentationPdfFilename) return

    try {
      const response = await fetch(`/api/research/${research.slug}/presentation-pdf`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load presentation PDF')
      }

      if (!data.url) {
        throw new Error('Presentation PDF URL is missing')
      }

      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to open presentation PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to open presentation PDF')
    }
  }

  const deletePresentation = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete the presentation PDF? This will remove the uploaded file and clear the stored filename. This action cannot be undone.'
    )
    if (!confirmed) return

    setDeleting(true)
    const loadingToast = toast.loading('Deleting presentation PDF...')

    try {
      const response = await fetch(`/api/admin/research/${researchId}/presentation-pdf`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete presentation PDF')
      }

      toast.success('Presentation PDF deleted successfully', { id: loadingToast })
      await fetchResearch()
      onUpdate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete presentation PDF', { id: loadingToast })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading presentation info...</p>
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Manage Presentation PDF</h3>
            <p className="text-sm text-gray-500 mt-1">{research.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {research.presentationPdfFilename ? (
            <>
              <div className="border rounded-lg p-4 bg-indigo-50">
                <div className="flex items-start gap-4">
                  <FileText className="w-12 h-12 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Presentation PDF</h4>
                    <p className="text-sm text-gray-700 break-all">{research.presentationPdfFilename}</p>
                    <p className="text-xs text-gray-500 mt-2">Stored in the presentation bucket and watermarked automatically.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-semibold text-gray-900">Actions</h4>

                <button
                  type="button"
                  onClick={openSignedPresentation}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Download className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">View Presentation PDF</p>
                    <p className="text-xs text-gray-500">Opens the signed presentation PDF in a new tab</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.assign(`/admin/research/${researchId}/upload`)}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <Upload className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Replace Presentation PDF</p>
                    <p className="text-xs text-gray-500">Upload a new file to replace the current one</p>
                  </div>
                </button>

                <button
                  onClick={deletePresentation}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Delete Presentation PDF</p>
                    <p className="text-xs text-red-600">Permanently remove the presentation file</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No presentation PDF uploaded</p>
                <p className="text-sm text-gray-500">Upload a presentation PDF to make it available here</p>
              </div>

              <button
                type="button"
                onClick={() => window.location.assign(`/admin/research/${researchId}/upload`)}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Upload Presentation PDF</p>
                  <p className="text-xs text-gray-500">Go to upload page</p>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
