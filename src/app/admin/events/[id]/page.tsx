"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  CalendarX2,
  CheckCircle2,
  DollarSign,
  Download,
  ImageIcon,
  MapPin,
  Pencil,
  UserCheck,
  Users,
} from "lucide-react"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, PanelHeader, buttonClass, type BadgeTone } from "@/components/admin/ui"
import EventCarouselComposer from "@/components/events/EventCarouselComposer"

interface Registration {
  id: number
  studentName: string
  studentEmail: string
  studentPhone: string | null
  studentGrade: string | null
  schoolName: string | null
  parentName: string
  parentEmail: string
  parentPhone: string | null
  registrationStatus: string
  paymentStatus: string | null
  paymentAmount: number | null
  transactionId: string | null
  specialRequirements: string | null
  attendanceConfirmed: boolean
  checkedInAt: string | null
  createdAt: string
  customFieldResponses: any
}

interface Event {
  id: number
  title: string
  description: string
  category: string
  eventDate: string
  eventTime: string
  location: string
  image: string | null
  maxParticipants: number | null
  registrationFee: number
  requiresPayment: boolean
  registrations: Registration[]
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [carouselImage, setCarouselImage] = useState("")
  const [savingCarousel, setSavingCarousel] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
        setCarouselImage(data.image || "")
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (regId: number) => {
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/registrations/${regId}/check-in`,
        { method: "POST" }
      )
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error("Error checking in:", error)
    }
  }

  const handleUpdateStatus = async (
    regId: number,
    registrationStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/registrations/${regId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationStatus }),
        }
      )
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/registrations/export?format=${format}`
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${event?.title}-registrations.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting:", error)
    }
  }

  const carouselDefaults = useMemo(() => {
    if (!event) return undefined
    return {
      headline: event.title,
      subtitle: event.description?.slice(0, 90) || "",
      category: event.category,
      metaLine: [
        new Date(event.eventDate).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        event.eventTime,
        event.location,
      ]
        .filter(Boolean)
        .join(" · "),
    }
  }, [event])

  const saveCarouselImage = async () => {
    if (!event) return
    setSavingCarousel(true)
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: carouselImage || null }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save carousel image")
      }
      const updated = await response.json()
      setEvent((prev) =>
        prev ? { ...prev, image: updated.image ?? carouselImage } : prev
      )
      toast.success("Carousel card saved for the main site")
    } catch (e: any) {
      toast.error(e.message || "Could not save carousel card")
    } finally {
      setSavingCarousel(false)
    }
  }

  if (loading || !event) {
    return (
      <AdminPageShell moduleId="events" title="Event" parent={{ label: "Events", href: "/admin/events" }}>
        <Panel>
          {loading ? (
            <LoadingState label="Loading event…" />
          ) : (
            <EmptyState icon={CalendarX2} title="Event not found" description="It may have been deleted." />
          )}
        </Panel>
      </AdminPageShell>
    )
  }

  const stats = {
    total: event.registrations.length,
    confirmed: event.registrations.filter(
      (r) => r.registrationStatus === "confirmed"
    ).length,
    pending: event.registrations.filter(
      (r) => r.registrationStatus === "pending"
    ).length,
    attended: event.registrations.filter((r) => r.attendanceConfirmed)
      .length,
    totalPayments: event.registrations.filter(
      (r) => r.paymentStatus === "completed"
    ).reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
  }

  const REG_TONE: Record<string, BadgeTone> = {
    pending: "amber",
    confirmed: "emerald",
    cancelled: "rose",
    attended: "brand",
    "no-show": "slate",
  }
  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <AdminPageShell
      moduleId="events"
      title={event.title}
      description="Event details, carousel image and registrations."
      parent={{ label: "Events", href: "/admin/events" }}
      actions={
        <>
          <button type="button" onClick={() => handleExport("csv")} className={buttonClass("secondary")}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button type="button" onClick={() => router.push(`/admin/events/${eventId}/edit`)} className={buttonClass("secondary")}>
            <Pencil className="h-4 w-4" /> Edit event
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Event Info */}
        <Panel>
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {[
              { icon: CalendarIcon, label: "Date & time", value: `${new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${event.eventTime}` },
              { icon: MapPin, label: "Location", value: event.location },
              { icon: Users, label: "Capacity", value: `${stats.total}${event.maxParticipants ? ` / ${event.maxParticipants}` : ""} registered` },
              { icon: DollarSign, label: "Registration fee", value: `$${event.registrationFee}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs font-medium text-muted">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Main-site carousel card */}
        <Panel>
          <PanelHeader
            title={<span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-gold-600" /> Carousel card</span>}
            description="Compose the 1200×675 image the main site shows in the event carousel."
            actions={
              <button
                type="button"
                onClick={() => void saveCarouselImage()}
                disabled={savingCarousel || carouselImage === (event.image || "")}
                className={buttonClass("primary", "sm")}
              >
                {savingCarousel ? "Saving…" : "Save carousel image"}
              </button>
            }
          />
          <div className="p-5">
            <EventCarouselComposer value={carouselImage} onChange={setCarouselImage} defaults={carouselDefaults} />
          </div>
        </Panel>

        {/* Registrations */}
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Registrations"
            description={
              <span className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge tone="slate">{stats.total} total</Badge>
                <Badge tone="emerald">{stats.confirmed} confirmed</Badge>
                <Badge tone="amber">{stats.pending} pending</Badge>
                <Badge tone="brand">{stats.attended} attended</Badge>
                <Badge tone="emerald" icon={DollarSign}>${stats.totalPayments.toFixed(0)} collected</Badge>
              </span>
            }
          />
          {event.registrations.length === 0 ? (
            <EmptyState icon={Users} title="No registrations yet" description="Registrations appear here once families sign up." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {event.registrations.map((reg) => (
                    <tr key={reg.id} className="align-top transition-colors hover:bg-surface-muted/60">
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{reg.studentName}</p>
                        <p className="text-xs text-muted">{reg.studentEmail}</p>
                        {reg.studentGrade && <p className="text-xs text-subtle">Grade {reg.studentGrade}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-ink-soft">{reg.parentName}</p>
                        <p className="text-xs text-muted">{reg.parentEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <Badge tone={REG_TONE[reg.registrationStatus] ?? "amber"}>{titleCase(reg.registrationStatus)}</Badge>
                          {reg.attendanceConfirmed && <Badge tone="brand" icon={CheckCircle2}>Checked in</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {reg.paymentStatus === "completed" ? (
                          <Badge tone="emerald" icon={CheckCircle2}>${reg.paymentAmount} paid</Badge>
                        ) : (
                          <Badge tone="amber" dot>Payment pending</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                        {new Date(reg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {reg.registrationStatus === "pending" && (
                            <button type="button" onClick={() => handleUpdateStatus(reg.id, "confirmed")} className={buttonClass("success", "sm")}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </button>
                          )}
                          {!reg.attendanceConfirmed && (
                            <button type="button" onClick={() => handleCheckIn(reg.id)} className={buttonClass("secondary", "sm")}>
                              <UserCheck className="h-3.5 w-3.5" /> Check in
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AdminPageShell>
  )
}
