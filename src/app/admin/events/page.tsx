"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Copy,
  DollarSign,
  Eye,
  Globe,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass, selectClass, type BadgeTone } from "@/components/admin/ui"

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
  status: string
  isPublished: boolean
  isFeatured: boolean
  registrationFee: number
  requiresPayment: boolean
  createdAt: string
  stats: {
    totalRegistrations: number
    confirmedRegistrations: number
    totalPayments: number
    pendingPayments: number
    spotsRemaining: number | null
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    isPublished: "",
    search: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [filters])

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.category) params.append("category", filters.category)
      if (filters.isPublished) params.append("isPublished", filters.isPublished)
      if (filters.search) params.append("search", filters.search)

      const response = await fetch(`/api/admin/events?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: number, isPublished: boolean) => {
    try {
      const endpoint = isPublished ? "unpublish" : "publish"
      const response = await fetch(`/api/admin/events/${id}/${endpoint}`, {
        method: "POST",
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Error publishing event:", error)
    }
  }

  const handleFeature = async (id: number, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Error featuring event:", error)
    }
  }

  const handleDuplicate = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/events/${id}/duplicate`, {
        method: "POST",
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Error duplicating event:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchEvents()
      }
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const STATUS_TONE: Record<string, BadgeTone> = {
    upcoming: "brand",
    ongoing: "emerald",
    completed: "slate",
    cancelled: "rose",
  }
  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

  return (
    <AdminPageShell
      moduleId="events"
      description="Create, manage and publish events on the website."
      actions={
        <button type="button" onClick={() => router.push("/admin/events/create")} className={buttonClass("primary")}>
          <Plus className="h-4 w-4" /> Create event
        </button>
      }
    >
      <Panel className="mb-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search events…"
              className={cx(inputClass, "pl-9")}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block w-40">
              <span className="sr-only">Status</span>
              <select className={selectClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
            <label className="relative block w-44">
              <span className="sr-only">Category</span>
              <select className={selectClass} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Webinar">Webinar</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Conference">Conference</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
            <Segmented
              label="Visibility"
              value={filters.isPublished as "" | "true" | "false"}
              onChange={(value) => setFilters({ ...filters, isPublished: value })}
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Published" },
                { value: "false", label: "Drafts" },
              ]}
            />
          </div>
        </div>
      </Panel>

      {loading ? (
        <Panel><LoadingState label="Loading events…" /></Panel>
      ) : events.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarIcon}
            title="No events found"
            description="Create your first event, or change the filters."
            action={
              <button type="button" onClick={() => router.push("/admin/events/create")} className={buttonClass("primary", "sm")}>
                <Plus className="h-3.5 w-3.5" /> Create event
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition hover:shadow-card-hover">
              <div className="relative aspect-[16/9] bg-surface-muted">
                {event.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-subtle"><ImageIcon className="h-8 w-8" /></div>
                )}
                <div className="absolute right-2 top-2 flex gap-1 rounded-lg bg-surface/90 p-0.5 shadow-card backdrop-blur">
                  <button type="button" onClick={() => router.push(`/admin/events/${event.id}/edit`)} title="Edit event" aria-label={`Edit ${event.title}`} className={buttonClass("ghost", "iconSm")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDuplicate(event.id)} title="Duplicate event" aria-label={`Duplicate ${event.title}`} className={buttonClass("ghost", "iconSm")}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(event.id)} title="Delete event" aria-label={`Delete ${event.title}`} className={buttonClass("ghost", "iconSm", "text-rose-600 hover:bg-rose-50 hover:text-rose-700")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-card backdrop-blur", event.isPublished ? "bg-emerald-600/90 text-white" : "bg-surface/90 text-ink-soft")}>
                    {event.isPublished ? "Published" : "Draft"}
                  </span>
                  {event.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-semibold text-brand-950 shadow-card">
                      <Star className="h-3 w-3 fill-current" /> Featured
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold leading-snug text-ink">{event.title}</h3>
                  <Badge tone={STATUS_TONE[event.status] ?? "brand"}>{titleCase(event.status)}</Badge>
                </div>
                {event.category && <p className="mt-1 text-xs font-medium uppercase tracking-[0.06em] text-subtle">{event.category}</p>}
                {event.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{event.description}</p>}

                <dl className="mb-4 mt-3 space-y-1.5 text-sm text-ink-soft">
                  <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 shrink-0 text-subtle" />{new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {event.eventTime}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-subtle" /><span className="line-clamp-1">{event.location}</span></div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-subtle" />
                    {event.stats.totalRegistrations} registered{event.maxParticipants ? ` / ${event.maxParticipants}` : ""} · {event.stats.confirmedRegistrations} confirmed
                  </div>
                  {event.requiresPayment && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 shrink-0 text-subtle" />${event.registrationFee} per person · ${event.stats.totalPayments.toFixed(0)} collected
                    </div>
                  )}
                </dl>

                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                  <button type="button" onClick={() => router.push(`/admin/events/${event.id}`)} className={buttonClass("secondary", "sm")}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button type="button" onClick={() => handlePublish(event.id, event.isPublished)} className={buttonClass(event.isPublished ? "secondary" : "primary", "sm")}>
                    <Globe className="h-3.5 w-3.5" /> {event.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  {event.isPublished && (
                    <button type="button" onClick={() => handleFeature(event.id, event.isFeatured)} className={buttonClass("secondary", "sm")}>
                      <Star className="h-3.5 w-3.5" /> {event.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageShell>
  )
}
