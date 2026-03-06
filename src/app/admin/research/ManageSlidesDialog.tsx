'use client'

import React, { useState, useEffect } from 'react'
import { X, Upload, Trash2, Image as ImageIcon, Move } from 'lucide-react'
import { toast } from 'sonner'

interface Slide {
  id: string
  researchId: string
  order: number
  imageFilename: string
}

interface ManageSlidesDialogProps {
  researchId: string
  onClose: () => void
  onUpdate: () => void
}

export default function ManageSlidesDialog({ researchId, onClose, onUpdate }: ManageSlidesDialogProps) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [reorderedSlides, setReorderedSlides] = useState<Slide[]>([])

  useEffect(() => {
    fetchSlides()
  }, [researchId])

  useEffect(() => {
    // Generate signed URLs for slide images
    const generateUrls = async () => {
      const urls: Record<string, string> = {}
      for (const slide of slides) {
        try {
          const response = await fetch(`/api/research/slide-url?researchId=${researchId}&filename=${slide.imageFilename}`)
          if (response.ok) {
            const data = await response.json()
            if (data.url) {
              urls[slide.id] = data.url
            }
          }
        } catch (err) {
          console.error('Failed to get slide URL:', err)
        }
      }
      setImageUrls(urls)
    }

    if (slides.length > 0) {
      generateUrls()
    }
  }, [slides, researchId])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/research/${researchId}`)
      if (!response.ok) throw new Error('Failed to fetch research')
      const data = await response.json()
      setSlides(data.research.Slide || [])
      setReorderedSlides(data.research.Slide || [])
    } catch (err) {
      toast.error('Failed to load slides')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length !== files.length) {
      toast.error('Only image files are allowed')
    }
    setUploadFiles(imageFiles)
  }

  const uploadNewSlides = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    setUploading(true)
    const loadingToast = toast.loading('Uploading slides...')

    try {
      const formData = new FormData()
      uploadFiles.forEach(file => formData.append('files', file))

      const response = await fetch(`/api/admin/research/${researchId}/slides`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload slides')
      }

      toast.success('Slides uploaded successfully', { id: loadingToast })
      setUploadFiles([])
      await fetchSlides()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload slides', { id: loadingToast })
    } finally {
      setUploading(false)
    }
  }

  const deleteSlide = async (slideId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
    if (!confirmed) return

    const loadingToast = toast.loading('Deleting slide...')

    try {
      const response = await fetch(`/api/admin/research/${researchId}/slides/${slideId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete slide')
      }

      toast.success('Slide deleted successfully', { id: loadingToast })
      await fetchSlides()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete slide', { id: loadingToast })
    }
  }

  const replaceSlide = async (slideId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const loadingToast = toast.loading('Replacing slide...')

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/admin/research/${researchId}/slides/${slideId}`, {
          method: 'PATCH',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to replace slide')
        }

        toast.success('Slide replaced successfully', { id: loadingToast })
        await fetchSlides()
        onUpdate()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to replace slide', { id: loadingToast })
      }
    }
    input.click()
  }

  const moveSlideUp = (index: number) => {
    if (index === 0) return
    const newSlides = [...reorderedSlides]
    ;[newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]]
    setReorderedSlides(newSlides)
  }

  const moveSlideDown = (index: number) => {
    if (index === reorderedSlides.length - 1) return
    const newSlides = [...reorderedSlides]
    ;[newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]]
    setReorderedSlides(newSlides)
  }

  const saveReorder = async () => {
    const loadingToast = toast.loading('Saving new order...')

    try {
      const reorderData = reorderedSlides.map((slide, index) => ({
        slideId: slide.id,
        newOrder: index + 1,
      }))

      const response = await fetch(`/api/admin/research/${researchId}/slides`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: reorderData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reorder slides')
      }

      toast.success('Slides reordered successfully', { id: loadingToast })
      setReorderMode(false)
      await fetchSlides()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder slides', { id: loadingToast })
    }
  }

  const cancelReorder = () => {
    setReorderedSlides([...slides])
    setReorderMode(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading slides...</p>
        </div>
      </div>
    )
  }

  const displaySlides = reorderMode ? reorderedSlides : slides

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Manage Slides</h3>
            <p className="text-sm text-gray-500 mt-1">{slides.length} slide(s) total</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Upload Section */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Upload New Slides</h4>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
              {uploadFiles.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {uploadFiles.length} file(s) selected
                  </p>
                  <button
                    onClick={uploadNewSlides}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reorder Controls */}
          {slides.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">Current Slides</h4>
              {!reorderMode ? (
                <button
                  onClick={() => setReorderMode(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Move className="w-4 h-4" />
                  Reorder Slides
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelReorder}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveReorder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Slides Grid */}
          {slides.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No slides uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displaySlides.map((slide, index) => (
                <div key={slide.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="aspect-video bg-gray-200 rounded mb-2 flex items-center justify-center overflow-hidden">
                    {imageUrls[slide.id] ? (
                      <img 
                        src={imageUrls[slide.id]} 
                        alt={`Slide ${slide.order}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Slide {reorderMode ? index + 1 : slide.order}
                    </span>
                    <div className="flex gap-1">
                      {reorderMode ? (
                        <>
                          <button
                            onClick={() => moveSlideUp(index)}
                            disabled={index === 0}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSlideDown(index)}
                            disabled={index === displaySlides.length - 1}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => replaceSlide(slide.id)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            title="Replace slide"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSlide(slide.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Delete slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{slide.imageFilename}</p>
                </div>
              ))}
            </div>
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
