"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, FileVideo, Loader2, MessageSquareQuote, Save, Trash2, Upload, Video, X } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, PanelHeader, buttonClass, cx, inputClass } from "@/components/admin/ui"
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
  // Container query: one column in the narrow upload panel, two in the wider edit dialog.
  return (
    <div className="@container"><div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
      <label className="block text-sm font-medium text-ink-soft">
        Name <span className="text-rose-600">*</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="e.g. Priya S."
          maxLength={120}
          required
          className={cx(inputClass, "mt-1.5")}
        />
      </label>
      <label className="block text-sm font-medium text-ink-soft">
        Designation
        <input
          value={value.designation}
          onChange={(event) => onChange({ ...value, designation: event.target.value })}
          placeholder="e.g. Grade 11, Folsom High School / Parent"
          maxLength={160}
          className={cx(inputClass, "mt-1.5")}
        />
      </label>
      <label className="block text-sm font-medium text-ink-soft">
        Program
        <select
          value={value.program}
          onChange={(event) => onChange({ ...value, program: event.target.value })}
          className={cx(inputClass, "mt-1.5")}
        >
          <option value="">No program</option>
          {value.program && !(PROGRAM_OPTIONS as readonly string[]).includes(value.program) && (
            <option value={value.program}>{value.program}</option>
          )}
          {PROGRAM_OPTIONS.map((program) => <option key={program} value={program}>{program}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-ink-soft @md:col-span-2">
        Short description
        <textarea
          value={value.description}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          placeholder="Optional caption shown under the video"
          maxLength={1000}
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
        />
      </label>
    </div></div>
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

  const visibleCount = videos.filter((video) => video.isVisible).length

  if (status === "loading" || !session) {
    return (
      <AdminPageShell moduleId="video-testimonials">
        <Panel><LoadingState label="Checking access…" /></Panel>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell
      moduleId="video-testimonials"
      description="Upload videos for the website testimonials page. They appear first, above all program sections."
      actions={
        <Link href="/admin/testimonials" className={buttonClass("secondary")}>
          <MessageSquareQuote className="h-4 w-4" /> Written testimonials
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Upload */}
        <Panel className="h-fit lg:sticky lg:top-[84px]">
          <PanelHeader title="Upload a video" description="Goes straight to cloud storage." />
          <form onSubmit={handleUpload} className="space-y-4 p-5">
            <label
              className={cx(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition",
                file ? "border-brand-300 bg-brand-50/50" : "border-line-strong bg-surface-muted/60 hover:border-brand-300 hover:bg-brand-50/40",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-brand-700 shadow-card ring-1 ring-inset ring-line">
                {file ? <FileVideo className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </span>
              <span className="mt-2 text-sm font-medium text-ink">
                {file ? file.name : "Choose a video file"}
              </span>
              <span className="mt-0.5 text-xs text-muted">
                {file ? formatFileSize(file.size) : "MP4, WebM or MOV · up to 500MB"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={Object.keys(VIDEO_TESTIMONIAL_TYPES).join(",")}
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
            <p className="-mt-2 text-xs text-subtle">MP4 (H.264) plays on every browser.</p>

            <DetailsFields value={details} onChange={setDetails} />

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={visibleOnSite}
                onChange={(event) => setVisibleOnSite(event.target.checked)}
                className="h-4 w-4 rounded border-line-strong accent-brand-700"
              />
              Show on the website right away
            </label>

            {uploading && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>{progress < 100 ? "Uploading to storage…" : "Saving…"}</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted ring-1 ring-inset ring-line">
                  <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {uploadError && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{uploadError}</div>
            )}

            <button type="submit" disabled={uploading || !file} className={buttonClass("primary", "md", "w-full")}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload video"}
            </button>
          </form>
        </Panel>

        {/* Library */}
        <Panel className="self-start overflow-hidden">
          <PanelHeader
            title="Library"
            description={`${videos.length} ${videos.length === 1 ? "video" : "videos"} · shown on the site in this order`}
            actions={
              <Badge tone={visibleCount ? "emerald" : "amber"} dot>
                {visibleCount ? `Live · ${visibleCount} visible` : "Hidden on website"}
              </Badge>
            }
          />
          {!visibleCount && !loading && videos.length > 0 && (
            <p className="border-b border-line bg-gold-50/60 px-5 py-2 text-xs text-gold-700">
              No visible videos, so the Video Testimonials section is hidden on the website.
            </p>
          )}

          {loadError && (
            <div role="alert" className="m-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{loadError}</div>
          )}

          {loading ? (
            <LoadingState label="Loading videos…" />
          ) : videos.length === 0 ? (
            <EmptyState icon={Video} title="No video testimonials yet" description="Upload your first video using the form." />
          ) : (
            <ul className="divide-y divide-line">
              {videos.map((video, index) => (
                <li key={video.id} className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative shrink-0">
                    <video
                      className={cx("aspect-video w-full rounded-lg bg-ink sm:w-56", !video.isVisible && "opacity-60")}
                      controls
                      playsInline
                      preload="metadata"
                    >
                      <source src={`${video.videoUrl}#t=0.1`} type={video.mimeType} />
                    </video>
                    <span className="absolute left-2 top-2 rounded-md bg-ink/75 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{video.name}</h3>
                      {video.isVisible ? <Badge tone="emerald" icon={Eye}>Visible</Badge> : <Badge tone="slate" icon={EyeOff}>Hidden</Badge>}
                      {video.program && <Badge tone="brand">{video.program}</Badge>}
                    </div>
                    {video.designation && <p className="mt-0.5 text-sm text-muted">{video.designation}</p>}
                    {video.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{video.description}</p>}
                    <p className="mt-2 text-xs text-subtle">
                      {formatFileSize(video.fileSize)} · uploaded {new Date(video.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      <div className="inline-flex rounded-lg border border-line bg-surface shadow-card">
                        <button
                          type="button"
                          onClick={() => void moveVideo(index, -1)}
                          disabled={index === 0 || busy.reorder}
                          aria-label={`Move ${video.name} up`}
                          title="Move up"
                          className="flex h-8 w-8 items-center justify-center rounded-l-lg text-ink-soft transition hover:bg-canvas disabled:opacity-35"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void moveVideo(index, 1)}
                          disabled={index === videos.length - 1 || busy.reorder}
                          aria-label={`Move ${video.name} down`}
                          title="Move down"
                          className="flex h-8 w-8 items-center justify-center rounded-r-lg border-l border-line text-ink-soft transition hover:bg-canvas disabled:opacity-35"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggleVisibility(video)}
                        disabled={busy[`visible-${video.id}`]}
                        className={buttonClass("secondary", "sm")}
                      >
                        {video.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {video.isVisible ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing({
                          id: video.id,
                          form: {
                            name: video.name,
                            designation: video.designation || "",
                            program: video.program || "",
                            description: video.description || "",
                          },
                        })}
                        className={buttonClass("secondary", "sm")}
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteVideo(video)}
                        disabled={busy[`delete-${video.id}`]}
                        className={buttonClass("dangerOutline", "sm")}
                      >
                        {busy[`delete-${video.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line bg-surface-muted/60 px-5 py-2.5 text-xs text-subtle">Changes can take up to a minute to show on the website.</p>
        </Panel>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]" onClick={() => setEditing(null)}>
          <form
            onSubmit={saveEdit}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">Edit video testimonial</h2>
                <p className="mt-0.5 text-sm text-muted">Update the details shown with the video.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <DetailsFields value={editing.form} onChange={(form) => setEditing({ ...editing, form })} />
            </div>
            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={() => setEditing(null)} className={buttonClass("secondary")}>Cancel</button>
              <button type="submit" disabled={busy.edit} className={buttonClass("primary")}>
                {busy.edit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminPageShell>
  )
}
