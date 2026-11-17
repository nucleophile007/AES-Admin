"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Loader2, Save, Trash2, Upload, Video, X } from "lucide-react"
import { toast } from "sonner"
import { PROGRAM_OPTIONS } from "@/lib/programCatalog"
import {
  VIDEO_TESTIMONIAL_MAX_BYTES,
  VIDEO_TESTIMONIAL_TYPES,
  formatFileSize,
  isAllowedVideoType,
} from "@/lib/videoTestimonials"

interface VideoTestimonial {
  id: number
  name: string
  designation: string | null
  program: string | null
  description: string | null
  videoUrl: string
  mimeType: string
  fileSize: number
  isVisible: boolean
  displayOrder: number
  createdAt: string
}

interface DetailsForm {
  name: string
  designation: string
  program: string
  description: string
}

const EMPTY_DETAILS: DetailsForm = { name: "", designation: "", program: "", description: "" }

const readError = async (response: Response, fallback: string) => {
  try {
    const body = await response.json()
    return body.error || fallback
  } catch {
    return fallback
  }
}

/** PUT the file straight to R2 with upload progress (fetch has no upload progress events). */
const uploadWithProgress = (url: string, file: File, onProgress: (percent: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage upload failed (${xhr.status}).`)))
    xhr.onerror = () => reject(new Error("Could not reach storage. Check the R2 bucket CORS settings allow this admin site."))
    xhr.send(file)
  })

function DetailsFields({ value, onChange }: { value: DetailsForm; onChange: (value: DetailsForm) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="block text-sm font-medium text-gray-700">
        Name <span className="text-red-500">*</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="e.g. Priya S."
          maxLength={120}
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Designation
        <input
          value={value.designation}
          onChange={(event) => onChange({ ...value, designation: event.target.value })}
          placeholder="e.g. Grade 11, Folsom High School / Parent"
          maxLength={160}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Program
        <select
          value={value.program}
          onChange={(event) => onChange({ ...value, program: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">No program</option>
          {value.program && !(PROGRAM_OPTIONS as readonly string[]).includes(value.program) && (
            <option value={value.program}>{value.program}</option>
          )}
          {PROGRAM_OPTIONS.map((program) => <option key={program} value={program}>{program}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-gray-700 md:col-span-2">
        Short description
        <textarea
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          placeholder="Optional caption shown under the video"
          maxLength={1000}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
      </label>
    </div>
  )
}

export default function VideoTestimonialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [videos, setVideos] = useState<VideoTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [file, setFile] = useState<File | null>(null)
  const [details, setDetails] = useState<DetailsForm>(EMPTY_DETAILS)
  const [visibleOnSite, setVisibleOnSite] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")

  const [editing, setEditing] = useState<{ id: number; form: DetailsForm } | null>(null)
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const loadVideos = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const response = await fetch("/api/admin/video-testimonials", { cache: "no-store" })
      if (!response.ok) throw new Error(await readError(response, "Failed to load video testimonials"))
      const data = await response.json()
      setVideos(data.videos || [])
      setLoadError("")
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load video testimonials")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
    if (status === "authenticated") void loadVideos()
  }, [status, router])

  const setBusyKey = (key: string, value: boolean) => setBusy((previous) => ({ ...previous, [key]: value }))

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null
    setUploadError("")
    if (!selected) return setFile(null)
    if (!isAllowedVideoType(selected.type)) {
      setUploadError("Only MP4, WebM or MOV videos are allowed.")
      event.target.value = ""
      return setFile(null)
    }
    if (selected.size > VIDEO_TESTIMONIAL_MAX_BYTES) {
      setUploadError(`Video is too large (${formatFileSize(selected.size)}). Maximum size is 500MB.`)
      event.target.value = ""
      return setFile(null)
    }
    setFile(selected)
  }

  const resetUploadForm = () => {
    setFile(null)
    setDetails(EMPTY_DETAILS)
    setVisibleOnSite(true)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return setUploadError("Choose a video to upload.")
    if (!details.name.trim()) return setUploadError("Name is required.")

    setUploading(true)
    setUploadError("")
    setProgress(0)
    try {
      const urlResponse = await fetch("/api/admin/video-testimonials/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
      })
      if (!urlResponse.ok) throw new Error(await readError(urlResponse, "Could not prepare the upload."))
      const { uploadUrl, key } = await urlResponse.json()

      await uploadWithProgress(uploadUrl, file, setProgress)

      const saveResponse = await fetch("/api/admin/video-testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, key, isVisible: visibleOnSite }),
      })
      if (!saveResponse.ok) throw new Error(await readError(saveResponse, "Video uploaded, but saving its details failed."))

      toast.success("Video testimonial uploaded.")
      resetUploadForm()
      await loadVideos(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setUploadError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const toggleVisibility = async (video: VideoTestimonial) => {
    const key = `visible-${video.id}`
    setBusyKey(key, true)
    try {
      const response = await fetch(`/api/admin/video-testimonials/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !video.isVisible }),
      })
      if (!response.ok) throw new Error(await readError(response, "Failed to update visibility"))
      setVideos((current) => current.map((item) => item.id === video.id ? { ...item, isVisible: !video.isVisible } : item))
      toast.success(video.isVisible ? "Video hidden from the website." : "Video is now visible on the website.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update visibility")
    } finally {
      setBusyKey(key, false)
    }
  }

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setBusyKey("edit", true)
    try {
      const response = await fetch(`/api/admin/video-testimonials/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing.form),
      })
      if (!response.ok) throw new Error(await readError(response, "Failed to save changes"))
      const { video } = await response.json()
      setVideos((current) => current.map((item) => item.id === video.id ? video : item))
      setEditing(null)
      toast.success("Video testimonial updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save changes")
    } finally {
      setBusyKey("edit", false)
    }
  }

  const deleteVideo = async (video: VideoTestimonial) => {
    if (!window.confirm(`Delete the video testimonial from ${video.name}? The video file will be removed from storage. This cannot be undone.`)) return
    const key = `delete-${video.id}`
    setBusyKey(key, true)
    try {
      const response = await fetch(`/api/admin/video-testimonials/${video.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await readError(response, "Failed to delete video testimonial"))
      const result = await response.json()
      setVideos((current) => current.filter((item) => item.id !== video.id))
      if (result.fileDeleted === false) toast.warning("Removed from the website, but the file could not be deleted from storage.")
      else toast.success("Video testimonial deleted.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete video testimonial")
    } finally {
      setBusyKey(key, false)
    }
  }

  const moveVideo = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= videos.length) return
    const previous = videos
    const reordered = [...videos]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setVideos(reordered)
    setBusyKey("reorder", true)
    try {
      const response = await fetch("/api/admin/video-testimonials/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((video) => video.id) }),
      })
      if (!response.ok) throw new Error(await readError(response, "Failed to reorder videos"))
    } catch (error) {
      setVideos(previous)
      toast.error(error instanceof Error ? error.message : "Failed to reorder videos")
    } finally {
      setBusyKey("reorder", false)
    }
  }

  if (status === "loading" || !session) return <div className="p-8">Loading...</div>

  const visibleCount = videos.filter((video) => video.isVisible).length

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Admin Dashboard</p>
            <h1 className="text-3xl font-bold text-gray-900">Video Testimonials</h1>
            <p className="mt-1 text-gray-600">
              Upload videos for the website testimonials page. They appear as the first section, above all program sections.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/testimonials" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Written Testimonials
            </Link>
            <button onClick={() => router.push("/")} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800">
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className={`mb-6 rounded-xl border p-4 text-sm ${visibleCount ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {visibleCount
            ? `The Video Testimonials section is live on the website with ${visibleCount} visible video${visibleCount === 1 ? "" : "s"}.`
            : "No visible videos, so the Video Testimonials section is hidden on the website."}
          {" "}Changes can take up to a minute to show on the site.
        </div>

        <form onSubmit={handleUpload} className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Upload className="h-5 w-5 text-blue-600" /> Upload a video
          </h2>

          <label className="mb-4 block text-sm font-medium text-gray-700">
            Video file <span className="text-red-500">*</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={Object.keys(VIDEO_TESTIMONIAL_TYPES).join(",")}
              onChange={handleFileChange}
              disabled={uploading}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
            />
            <span className="mt-1 block text-xs font-normal text-gray-500">
              MP4, WebM or MOV, up to 500MB. MP4 (H.264) plays on every browser.
              {file && ` Selected: ${file.name} (${formatFileSize(file.size)})`}
            </span>
          </label>

          <DetailsFields value={details} onChange={setDetails} />

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={visibleOnSite}
              onChange={(event) => setVisibleOnSite(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show on the website right away
          </label>

          {uploading && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>{progress < 100 ? "Uploading to storage..." : "Saving..."}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {uploadError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{uploadError}</div>}

          <button
            type="submit"
            disabled={uploading || !file}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload Video"}
          </button>
        </form>

        {loadError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</div>}

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /></div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            <Video className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            No video testimonials yet.
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row">
                <video
                  className="aspect-video w-full shrink-0 rounded-lg bg-black md:w-72"
                  controls
                  playsInline
                  preload="metadata"
                >
                  <source src={`${video.videoUrl}#t=0.1`} type={video.mimeType} />
                </video>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{video.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${video.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {video.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  {video.designation && <p className="text-sm text-gray-600">{video.designation}</p>}
                  {video.program && <p className="text-xs font-medium text-blue-700">{video.program}</p>}
                  {video.description && <p className="text-sm text-gray-700">{video.description}</p>}
                  <p className="text-xs text-gray-400">
                    {formatFileSize(video.fileSize)} · uploaded {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => void moveVideo(index, -1)}
                      disabled={index === 0 || busy.reorder}
                      aria-label={`Move ${video.name} up`}
                      className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void moveVideo(index, 1)}
                      disabled={index === videos.length - 1 || busy.reorder}
                      aria-label={`Move ${video.name} down`}
                      className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void toggleVisibility(video)}
                      disabled={busy[`visible-${video.id}`]}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {video.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {video.isVisible ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => setEditing({
                        id: video.id,
                        form: {
                          name: video.name,
                          designation: video.designation || "",
                          program: video.program || "",
                          description: video.description || "",
                        },
                      })}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => void deleteVideo(video)}
                      disabled={busy[`delete-${video.id}`]}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {busy[`delete-${video.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Video Testimonial</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <DetailsFields value={editing.form} onChange={(form) => setEditing({ ...editing, form })} />
            <button
              type="submit"
              disabled={busy.edit}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {busy.edit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
