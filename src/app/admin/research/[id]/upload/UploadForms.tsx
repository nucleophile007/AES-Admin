"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Upload, FileText, Images } from "lucide-react"

interface UploadFormsProps {
  researchId: string
  slidesCount: number
  pdfFilename: string | null
}

export default function UploadForms({
  researchId,
  slidesCount,
  pdfFilename,
}: UploadFormsProps) {
  const [isUploadingSlides, setIsUploadingSlides] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)

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

      const response = await fetch(
        `/api/admin/research/${researchId}/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      )

      const result = await response.json()

      if (response.ok) {
        toast.success("PDF uploaded successfully with watermark! 🎉")
        // Reload page to show updated filename
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast.error(result.error || "Failed to upload PDF")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploadingPdf(false)
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
          Optional secure technical document (PDF).
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
            className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingPdf ? "Uploading..." : "Upload PDF"}
          </button>
        </form>

        {pdfFilename && (
          <p className="text-xs text-green-600 mt-3">
            ✔ PDF already uploaded: {pdfFilename}
          </p>
        )}
      </div>
    </div>
  )
}
