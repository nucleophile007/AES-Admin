"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CAROUSEL_LIMITS,
  DEFAULT_CAROUSEL_DRAFT,
  EVENT_CAROUSEL,
  EVENT_CAROUSEL_PEOPLE,
  EventCarouselDraft,
  EventCarouselPersonId,
  getCarouselPerson,
} from "@/lib/eventCarouselTemplate"

type Mode = "compose" | "custom"

interface EventCarouselComposerProps {
  value?: string
  onChange: (imageUrl: string) => void
  /** Prefill from event fields when opening compose */
  defaults?: Partial<
    Pick<EventCarouselDraft, "headline" | "subtitle" | "category" | "metaLine">
  >
  className?: string
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = words[0]
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      lines.push(current)
      current = words[i]
      if (lines.length >= maxLines) break
    }
  }
  if (lines.length < maxLines) lines.push(current)
  else if (lines.length === maxLines) {
    // truncate last line with ellipsis if leftover words
    const last = lines[maxLines - 1]
    if (ctx.measureText(last).width > maxWidth || words.length > 0) {
      let t = last
      while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
        t = t.slice(0, -1)
      }
      lines[maxLines - 1] = `${t}…`
    }
  }
  return lines
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

async function renderCarouselCard(
  canvas: HTMLCanvasElement,
  draft: EventCarouselDraft
) {
  const { width, height } = EVENT_CAROUSEL
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas unsupported")

  // Background
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, "#0c1a2e")
  bg.addColorStop(0.55, "#14304f")
  bg.addColorStop(1, "#1a4a5c")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Soft ambient shapes
  ctx.fillStyle = "rgba(212, 168, 83, 0.08)"
  ctx.beginPath()
  ctx.ellipse(980, 120, 280, 200, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
  ctx.beginPath()
  ctx.ellipse(180, 560, 320, 160, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Left accent bar
  ctx.fillStyle = "#d4a853"
  ctx.fillRect(0, 0, 10, height)

  // Brand + category
  ctx.fillStyle = "#d4a853"
  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif"
  ctx.fillText(draft.brand.slice(0, CAROUSEL_LIMITS.brand).toUpperCase(), 64, 72)

  ctx.fillStyle = "rgba(255,255,255,0.55)"
  ctx.font = "500 18px system-ui, -apple-system, Segoe UI, sans-serif"
  const brandWidth = ctx.measureText(
    draft.brand.slice(0, CAROUSEL_LIMITS.brand).toUpperCase()
  ).width
  ctx.fillText("·", 64 + brandWidth + 12, 72)
  ctx.fillText(
    draft.category.slice(0, CAROUSEL_LIMITS.category).toUpperCase(),
    64 + brandWidth + 28,
    72
  )

  // Headline
  ctx.fillStyle = "#ffffff"
  ctx.font = "700 52px Georgia, 'Times New Roman', serif"
  const headlineLines = wrapText(
    ctx,
    draft.headline || "Your event title",
    620,
    3
  )
  let y = 150
  for (const line of headlineLines) {
    ctx.fillText(line, 64, y)
    y += 62
  }

  // Subtitle
  if (draft.subtitle.trim()) {
    y += 8
    ctx.fillStyle = "rgba(255,255,255,0.72)"
    ctx.font = "400 24px system-ui, -apple-system, Segoe UI, sans-serif"
    const subLines = wrapText(ctx, draft.subtitle, 600, 2)
    for (const line of subLines) {
      ctx.fillText(line, 64, y)
      y += 34
    }
  }

  // Points
  const points = draft.points.map((p) => p.trim()).filter(Boolean).slice(0, 4)
  if (points.length) {
    y += 28
    ctx.font = "500 22px system-ui, -apple-system, Segoe UI, sans-serif"
    for (const point of points) {
      ctx.fillStyle = "#d4a853"
      ctx.beginPath()
      ctx.arc(78, y - 6, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "rgba(255,255,255,0.88)"
      const pointLines = wrapText(ctx, point, 560, 2)
      for (let i = 0; i < pointLines.length; i++) {
        ctx.fillText(pointLines[i], 96, y + i * 28)
      }
      y += 28 * pointLines.length + 16
    }
  }

  // Person portrait (right)
  const person = getCarouselPerson(draft.personId)
  try {
    const img = await loadImage(person.src)
    const size = 320
    const cx = 980
    const cy = 300
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    // cover-fit
    const scale = Math.max(size / img.width, size / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
    ctx.restore()

    // Ring
    ctx.strokeStyle = "#d4a853"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 + 4, 0, Math.PI * 2)
    ctx.stroke()

    // Soft outer ring
    ctx.strokeStyle = "rgba(255,255,255,0.2)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2 + 14, 0, Math.PI * 2)
    ctx.stroke()
  } catch {
    // Portrait fallback circle
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.beginPath()
    ctx.arc(980, 300, 160, 0, Math.PI * 2)
    ctx.fill()
  }

  // Footer bar
  ctx.fillStyle = "rgba(0,0,0,0.28)"
  ctx.fillRect(0, height - 96, width, 96)

  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.font = "500 22px system-ui, -apple-system, Segoe UI, sans-serif"
  const meta = draft.metaLine.trim() || "Date · Time · Location"
  ctx.fillText(meta.slice(0, CAROUSEL_LIMITS.metaLine), 64, height - 42)

  // CTA pill
  const cta = (draft.cta || "Register now").slice(0, CAROUSEL_LIMITS.cta)
  ctx.font = "700 20px system-ui, -apple-system, Segoe UI, sans-serif"
  const ctaWidth = Math.max(ctx.measureText(cta).width + 48, 160)
  const ctaX = width - 64 - ctaWidth
  const ctaY = height - 68
  ctx.fillStyle = "#d4a853"
  drawRoundedRect(ctx, ctaX, ctaY, ctaWidth, 44, 22)
  ctx.fill()
  ctx.fillStyle = "#0c1a2e"
  ctx.fillText(cta, ctaX + (ctaWidth - ctx.measureText(cta).width) / 2, ctaY + 29)

  // Dimension stamp (tiny, bottom-left of canvas interior for QC)
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.font = "500 12px system-ui, sans-serif"
  ctx.fillText(
    `${EVENT_CAROUSEL.width}×${EVENT_CAROUSEL.height}`,
    width - 110,
    28
  )
}

export default function EventCarouselComposer({
  value = "",
  onChange,
  defaults,
  className = "",
}: EventCarouselComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>("compose")
  const [draft, setDraft] = useState<EventCarouselDraft>(() => ({
    ...DEFAULT_CAROUSEL_DRAFT,
    ...defaults,
    points: defaults?.headline
      ? ["", "", ""]
      : DEFAULT_CAROUSEL_DRAFT.points,
  }))
  const [rendering, setRendering] = useState(false)
  const [applying, setApplying] = useState(false)
  const [uploadingCustom, setUploadingCustom] = useState(false)

  // Prefill when parent defaults change (create form title etc.)
  useEffect(() => {
    if (!defaults) return
    setDraft((prev) => ({
      ...prev,
      headline: prev.headline || defaults.headline || prev.headline,
      subtitle: prev.subtitle || defaults.subtitle || prev.subtitle,
      category: defaults.category || prev.category,
      metaLine: prev.metaLine || defaults.metaLine || prev.metaLine,
    }))
  }, [defaults?.headline, defaults?.subtitle, defaults?.category, defaults?.metaLine])

  const filledPoints = useMemo(
    () => draft.points.filter((p) => p.trim()).length,
    [draft.points]
  )

  const refreshPreview = useCallback(async () => {
    const canvas = previewRef.current
    if (!canvas) return
    setRendering(true)
    try {
      await renderCarouselCard(canvas, draft)
    } catch (e) {
      console.error(e)
    } finally {
      setRendering(false)
    }
  }, [draft])

  useEffect(() => {
    if (mode !== "compose") return
    const t = setTimeout(() => {
      void refreshPreview()
    }, 180)
    return () => clearTimeout(t)
  }, [mode, refreshPreview])

  const updatePoint = (index: number, text: string) => {
    setDraft((prev) => {
      const points = [...prev.points]
      points[index] = text.slice(0, CAROUSEL_LIMITS.point)
      return { ...prev, points }
    })
  }

  const addPoint = () => {
    setDraft((prev) => {
      if (prev.points.length >= CAROUSEL_LIMITS.maxPoints) return prev
      return { ...prev, points: [...prev.points, ""] }
    })
  }

  const removePoint = (index: number) => {
    setDraft((prev) => {
      if (prev.points.length <= 1) {
        return { ...prev, points: [""] }
      }
      return { ...prev, points: prev.points.filter((_, i) => i !== index) }
    })
  }

  const applyComposedImage = async () => {
    if (!draft.headline.trim()) {
      toast.error("Add a headline for the carousel card")
      return
    }
    setApplying(true)
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas")
      await renderCarouselCard(canvas, draft)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, EVENT_CAROUSEL.mimeType, 0.95)
      )
      if (!blob) throw new Error("Failed to export image")

      const file = new File([blob], EVENT_CAROUSEL.fileName, {
        type: EVENT_CAROUSEL.mimeType,
      })
      const body = new FormData()
      body.append("file", file)

      const res = await fetch("/api/admin/events/upload-image", {
        method: "POST",
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      onChange(data.fileUrl)
      toast.success("Carousel card applied — ready for the main site")
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Could not apply carousel card")
    } finally {
      setApplying(false)
    }
  }

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Use JPEG, PNG, GIF, or WebP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }
    setUploadingCustom(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/admin/events/upload-image", {
        method: "POST",
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onChange(data.fileUrl)
      toast.success("Custom image uploaded")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploadingCustom(false)
      e.target.value = ""
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Main-site carousel card
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Fixed template{" "}
            <span className="font-mono text-slate-700">
              {EVENT_CAROUSEL.width}×{EVENT_CAROUSEL.height}
            </span>{" "}
            ({EVENT_CAROUSEL.aspectLabel}) — same size every time, like a QR
            stamp.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("compose")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              mode === "compose"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Compose template
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              mode === "custom"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Custom upload
          </button>
        </div>
      </div>

      {mode === "compose" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Select person ({EVENT_CAROUSEL_PEOPLE.length} options)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_CAROUSEL_PEOPLE.map((person) => {
                  const selected = draft.personId === person.id
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          personId: person.id as EventCarouselPersonId,
                        }))
                      }
                      className={`group relative overflow-hidden rounded-xl border-2 transition ${
                        selected
                          ? "border-amber-500 ring-2 ring-amber-200"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={person.src}
                        alt={person.label}
                        className="aspect-square w-full object-cover"
                      />
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-4 text-[10px] font-medium text-white">
                        {person.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Brand
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={draft.brand}
                  maxLength={CAROUSEL_LIMITS.brand}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brand: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Category badge
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={draft.category}
                  maxLength={CAROUSEL_LIMITS.category}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, category: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Headline *
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={draft.headline}
                maxLength={CAROUSEL_LIMITS.headline}
                placeholder="Write the main line for the carousel"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, headline: e.target.value }))
                }
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {draft.headline.length}/{CAROUSEL_LIMITS.headline}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Supporting line
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={draft.subtitle}
                maxLength={CAROUSEL_LIMITS.subtitle}
                placeholder="One short supporting sentence"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, subtitle: e.target.value }))
                }
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  Points ({filledPoints}/{CAROUSEL_LIMITS.maxPoints})
                </label>
                <button
                  type="button"
                  onClick={addPoint}
                  disabled={draft.points.length >= CAROUSEL_LIMITS.maxPoints}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add point
                </button>
              </div>
              <div className="space-y-2">
                {draft.points.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={point}
                      maxLength={CAROUSEL_LIMITS.point}
                      placeholder={`Point ${index + 1}`}
                      onChange={(e) => updatePoint(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removePoint(index)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      aria-label="Remove point"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Footer meta (date · time · place)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={draft.metaLine}
                  maxLength={CAROUSEL_LIMITS.metaLine}
                  placeholder="Sat Mar 14 · 10:00 AM · Zoom"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, metaLine: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  CTA label
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={draft.cta}
                  maxLength={CAROUSEL_LIMITS.cta}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, cta: e.target.value }))
                  }
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() => void applyComposedImage()}
              disabled={applying || rendering}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
            >
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating & uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Apply to event image
                </>
              )}
            </Button>
          </div>

          {/* Live preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Live preview</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono">
                {EVENT_CAROUSEL.width}×{EVENT_CAROUSEL.height} ·{" "}
                {EVENT_CAROUSEL.aspectLabel}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-lg">
              <div className="relative aspect-[16/9] w-full">
                <canvas
                  ref={previewRef}
                  className="h-full w-full"
                  style={{ width: "100%", height: "100%" }}
                />
                {rendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              This exact PNG is what the main site pulls into the event
              carousel. Always exports at the fixed size — no crop surprises.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-6 transition hover:border-amber-400 hover:bg-amber-50/40">
            {uploadingCustom ? (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading…
              </div>
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Upload a custom image (max 5MB)
                </span>
                <span className="text-[11px] text-slate-400">
                  Prefer the compose template for consistent carousel sizing
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={uploadingCustom}
              onChange={handleCustomUpload}
            />
          </label>
          <div>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or paste a direct image URL"
            />
          </div>
        </div>
      )}

      {value ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <img
            src={value}
            alt="Applied event carousel"
            className="h-20 w-auto rounded-md border border-emerald-200 object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-emerald-900">
              Applied event image
            </div>
            <p className="mt-0.5 truncate text-[11px] text-emerald-700/80">
              {value}
            </p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-2 text-xs font-medium text-red-600 hover:underline"
            >
              Clear image
            </button>
          </div>
        </div>
      ) : null}

      {/* Offscreen export canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  )
}
