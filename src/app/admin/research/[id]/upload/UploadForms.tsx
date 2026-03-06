"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Upload, FileText, Images, CheckCircle, XCircle, Loader2, RefreshCw, Sparkles, X } from "lucide-react"

interface UploadFormsProps {
  researchId: string
  slidesCount: number
  pdfFilename: string | null
  extractionStatus?: string | null
  extractedAt?: Date | null
  sectionsCount?: number
}

export default function UploadForms({
  researchId,
  slidesCount,
  pdfFilename,
  extractionStatus,
  extractedAt,
  sectionsCount = 0,
}: UploadFormsProps) {
  const [activeTab, setActiveTab] = useState<'slides' | 'pdf'>('slides')
  const [isUploadingSlides, setIsUploadingSlides] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [isReExtracting, setIsReExtracting] = useState(false)
  const [localExtractionStatus, setLocalExtractionStatus] = useState(extractionStatus)
  const [localSectionsCount, setLocalSectionsCount] = useState(sectionsCount)
  const [dragActive, setDragActive] = useState(false)
  const [selectedSlides, setSelectedSlides] = useState<File[]>([])
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
  const slidesInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleSlidesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedSlides(files)
  }

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedPdf(file)
  }

  const clearSelectedSlides = () => {
    setSelectedSlides([])
    if (slidesInputRef.current) {
      slidesInputRef.current.value = ''
    }
  }

  const removeSlide = (indexToRemove: number) => {
    setSelectedSlides(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const clearSelectedPdf = () => {
    setSelectedPdf(null)
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }

  const handleSlidesUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploadingSlides(true)

    try {
      const formData = new FormData(e.currentTarget)
      const files = formData.getAll("files")

      if (files.length === 0) {
        toast.error("Please select at least one image file")
        return
      }

      const response = await fetch(
        `/api/admin/research/${researchId}/upload-slides`,
        {
          method: "POST",
          body: formData,
        }
      )

      const result = await response.json()

      if (response.ok) {
        toast.success("Slides uploaded successfully! 🎉")
        clearSelectedSlides()
        // Reload page to show updated count
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.error || "Failed to upload slides")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploadingSlides(false)
    }
  }

  const handlePdfUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploadingPdf(true)

    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get("file")

      if (!file || !(file instanceof File) || file.size === 0) {
        toast.error("Please select a PDF file")
        return
      }

      toast.loading("Uploading PDF and extracting content...", { id: "pdf-upload" })

      const response = await fetch(
        `/api/admin/research/${researchId}/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      )

      const result = await response.json()

      if (response.ok) {
        // Update local state
        setLocalExtractionStatus(result.extraction?.status || 'completed')
        setLocalSectionsCount(result.extraction?.sectionsCount || 0)
        clearSelectedPdf()

        if (result.extraction?.status === 'completed') {
          toast.success(
            `PDF uploaded successfully! Extracted ${result.extraction.sectionsCount} sections.`,
            { id: "pdf-upload" }
          )
        } else if (result.extraction?.status === 'failed') {
          toast.warning(
            "PDF uploaded but content extraction failed. You can retry extraction below.",
            { id: "pdf-upload" }
          )
        }
        
        // Reload page to show updated data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error(result.error || "Failed to upload PDF", { id: "pdf-upload" })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed. Please try again.", { id: "pdf-upload" })
    } finally {
      setIsUploadingPdf(false)
    }
  }

  const handleReExtract = async () => {
    if (!pdfFilename) {
      toast.error("No PDF uploaded yet")
      return
    }

    setIsReExtracting(true)
    setLocalExtractionStatus('pending')

    try {
      toast.loading("Re-extracting content from PDF...", { id: "re-extract" })

      const response = await fetch(
        `/api/admin/research/${researchId}/re-extract`,
        {
          method: "POST",
        }
      )

      const result = await response.json()

      if (response.ok) {
        setLocalExtractionStatus('completed')
        setLocalSectionsCount(result.extraction?.sectionsCount || 0)
        
        toast.success(
          `Content extracted successfully! Found ${result.extraction.sectionsCount} sections.`,
          { id: "re-extract" }
        )
        
        // Reload to show updated data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setLocalExtractionStatus('failed')
        toast.error(result.error || "Re-extraction failed", { id: "re-extract" })
      }
    } catch (error) {
      console.error("Re-extraction error:", error)
      setLocalExtractionStatus('failed')
      toast.error("Re-extraction failed. Please try again.", { id: "re-extract" })
    } finally {
      setIsReExtracting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('slides')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'slides'
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Images className="w-5 h-5" />
              <span>Presentation Slides</span>
              {slidesCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                  {slidesCount}
                </span>
              )}
            </div>
            {activeTab === 'slides' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
              activeTab === 'pdf'
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Technical Report</span>
              {pdfFilename && (
                <span className="ml-2 w-2 h-2 rounded-full bg-green-500" />
              )}
            </div>
            {activeTab === 'pdf' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'slides' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload Presentation Slides
                </h3>
                <p className="text-sm text-slate-600">
                  Upload slide images in PNG or JPG format. 
                  <span className="font-medium text-slate-700"> Upload order determines slide sequence.</span>
                </p>
              </div>

              <form onSubmit={handleSlidesUpload}>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                  }`}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                  }}
                >
                  <input
                    ref={slidesInputRef}
                    type="file"
                    name="files"
                    accept="image/png,image/jpeg"
                    multiple
                    required
                    disabled={isUploadingSlides}
                    onChange={handleSlidesFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="slides-input"
                  />
                  
                  <div className="pointer-events-none">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-base font-medium text-slate-900 mb-1">
                      Choose files or drag & drop
                    </p>
                    <p className="text-sm text-slate-500">
                      PNG, JPG up to 50MB each
                    </p>
                  </div>
                </div>

                {/* Selected Files Preview */}
                {selectedSlides.length > 0 && (
                  <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-indigo-900">
                        {selectedSlides.length} file{selectedSlides.length > 1 ? 's' : ''} selected
                      </p>
                      <button
                        onClick={clearSelectedSlides}
                        type="button"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedSlides.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs text-indigo-700 bg-white px-3 py-2 rounded-lg group"
                        >
                          <Images className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-indigo-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSlide(index)}
                            className="ml-1 p-1 hover:bg-red-100 rounded transition-colors"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingSlides || selectedSlides.length === 0}
                  className="mt-6 w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {isUploadingSlides ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Slides...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {selectedSlides.length > 0 ? `Upload ${selectedSlides.length} Slide${selectedSlides.length > 1 ? 's' : ''}` : 'Upload Slides'}
                    </>
                  )}
                </button>
              </form>

              {slidesCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      {slidesCount} slide{slidesCount > 1 ? 's' : ''} uploaded successfully
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Ready for presentation
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload Technical Report
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Upload the research PDF. Content will be automatically extracted and watermarked.
                </p>
                <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">For Google Docs:</span> Download as PDF 
                    (File → Download → PDF) first, then upload here
                  </div>
                </div>
              </div>

              <form onSubmit={handlePdfUpload}>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50'
                  }`}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                  }}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    name="file"
                    accept=".pdf"
                    disabled={isUploadingPdf}
                    onChange={handlePdfFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="pdf-input"
                  />
                  
                  <div className="pointer-events-none">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-base font-medium text-slate-900 mb-1">
                      Choose PDF or drag & drop
                    </p>
                    <p className="text-sm text-slate-500">
                      PDF up to 50MB
                    </p>
                  </div>
                </div>

                {/* Selected File Preview */}
                {selectedPdf && (
                  <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-violet-900">
                        File selected
                      </p>
                      <button
                        onClick={clearSelectedPdf}
                        type="button"
                        className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-violet-700 bg-white px-3 py-2 rounded-lg">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="flex-1 truncate">{selectedPdf.name}</span>
                      <span className="text-violet-500">
                        {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedPdf}
                        className="ml-1 p-1 hover:bg-red-100 rounded transition-colors"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingPdf || !selectedPdf}
                  className="mt-6 w-full px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {isUploadingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {selectedPdf ? 'Upload & Extract Content' : 'Select PDF File'}
                    </>
                  )}
                </button>
              </form>

              {pdfFilename && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900">
                        PDF Uploaded Successfully
                      </p>
                      <p className="text-xs text-green-700 mt-1 truncate">
                        {pdfFilename}
                      </p>
                    </div>
                  </div>

                  {/* Extraction Status */}
                  {localExtractionStatus && (
                    <div className="space-y-3">
                      {localExtractionStatus === 'completed' && (
                        <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-indigo-900">
                              Content Extracted Successfully
                            </p>
                            <p className="text-xs text-indigo-700 mt-1">
                              {localSectionsCount} section{localSectionsCount !== 1 ? 's' : ''} extracted
                              {extractedAt && (
                                <span className="ml-2 opacity-75" suppressHydrationWarning>
                                  • {new Date(extractedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {localExtractionStatus === 'pending' && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <Loader2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-spin" />
                          <div>
                            <p className="text-sm font-medium text-amber-900">
                              Extracting Content...
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              This may take a few moments
                            </p>
                          </div>
                        </div>
                      )}

                      {localExtractionStatus === 'failed' && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Extraction Failed
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              Content could not be extracted. Try re-extracting below.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Re-Extract Button */}
                      {(localExtractionStatus === 'completed' || localExtractionStatus === 'failed') && (
                        <button
                          onClick={handleReExtract}
                          disabled={isReExtracting}
                          className="w-full px-5 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center gap-2"
                        >
                          {isReExtracting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Re-extracting Content...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Re-extract Content
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
