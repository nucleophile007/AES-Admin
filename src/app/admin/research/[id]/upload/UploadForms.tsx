"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Upload, FileText, Images, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

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
  const [isUploadingSlides, setIsUploadingSlides] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [isReExtracting, setIsReExtracting] = useState(false)
  const [localExtractionStatus, setLocalExtractionStatus] = useState(extractionStatus)
  const [localSectionsCount, setLocalSectionsCount] = useState(sectionsCount)

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* SLIDE IMAGE UPLOAD */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Images className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Slide Images
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Upload slide images (PNG or JPG).
          <br />
          <span className="font-medium">
            Order matters — images are saved in upload order.
          </span>
        </p>

        <form onSubmit={handleSlidesUpload}>
          <input
            type="file"
            name="files"
            accept="image/png,image/jpeg"
            multiple
            required
            disabled={isUploadingSlides}
            className="block w-full text-sm mb-4 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isUploadingSlides}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingSlides ? "Uploading..." : "Upload Slides"}
          </button>
        </form>

        {slidesCount > 0 && (
          <p className="text-xs text-green-600 mt-3">
            ✔ {slidesCount} slides already uploaded
          </p>
        )}
      </div>

      {/* PDF Upload */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Technical Report (PDF)
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Upload research PDF with automatic content extraction.
        </p>

        <form onSubmit={handlePdfUpload}>
          <input
            type="file"
            name="file"
            accept=".pdf"
            disabled={isUploadingPdf}
            className="block w-full text-sm mb-4 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isUploadingPdf}
            className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isUploadingPdf ? "Uploading & Extracting..." : "Upload PDF"}
          </button>
        </form>

        {pdfFilename && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">PDF Uploaded</div>
                <div className="text-green-700 mt-1">{pdfFilename}</div>
              </div>
            </div>

            {/* Extraction Status */}
            {localExtractionStatus && (
              <div className="space-y-2">
                {localExtractionStatus === 'completed' && (
                  <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">Content Extracted</div>
                      <div className="text-blue-700 mt-1">
                        {localSectionsCount} sections extracted
                        {extractedAt && (
                          <span className="ml-2 opacity-75" suppressHydrationWarning>
                            • {new Date(extractedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {localExtractionStatus === 'pending' && (
                  <div className="flex items-start gap-2 text-xs text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />
                    <div>
                      <div className="font-medium">Extracting Content...</div>
                      <div className="text-yellow-700 mt-1">Please wait</div>
                    </div>
                  </div>
                )}

                {localExtractionStatus === 'failed' && (
                  <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Extraction Failed</div>
                      <div className="text-red-700 mt-1">
                        Content could not be extracted. Try re-extracting below.
                      </div>
                    </div>
                  </div>
                )}

                {/* Re-Extract Button */}
                {(localExtractionStatus === 'completed' || localExtractionStatus === 'failed') && (
                  <button
                    onClick={handleReExtract}
                    disabled={isReExtracting}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {isReExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Re-extracting...
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
    </div>
  )
}
