"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Copy,
  Globe,
  Star,
  Plus,
  Filter,
  Download,
} from "lucide-react"

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

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || colors.upcoming
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-gray-600 mt-2">
            Create, manage, and publish events to your website
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/events/create")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search events..."
            className="px-4 py-2 border rounded-lg"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Webinar">Webinar</option>
            <option value="Bootcamp">Bootcamp</option>
            <option value="Conference">Conference</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={filters.isPublished}
            onChange={(e) =>
              setFilters({ ...filters, isPublished: e.target.value })
            }
          >
            <option value="">All Events</option>
            <option value="true">Published</option>
            <option value="false">Drafts</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No events found
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first event to get started
          </p>
          <Button onClick={() => router.push("/admin/events/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Event Image */}
              {event.image && (
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {event.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  )}
                </div>
              )}

              {/* Event Content */}
              <div className="p-4 space-y-3">
                {/* Title & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {event.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString()} at{" "}
                      {event.eventTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.stats.totalRegistrations} registered
                      {event.maxParticipants &&
                        ` / ${event.maxParticipants} max`}
                    </span>
                  </div>
                  {event.requiresPayment && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>${event.registrationFee} per person</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-600">
                      {event.stats.confirmedRegistrations}
                    </div>
                    <div className="text-xs text-gray-600">Confirmed</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">
                      ${event.stats.totalPayments.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">Collected</div>
                  </div>
                </div>

                {/* Publishing Status */}
                <div className="flex items-center gap-2 text-sm">
                  {event.isPublished ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Globe className="w-4 h-4" />
                      Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Eye className="w-4 h-4" />
                      Draft
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/events/${event.id}`)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/admin/events/${event.id}/edit`)
                    }
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePublish(event.id, event.isPublished)
                    }
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    {event.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  {event.isPublished && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFeature(event.id, event.isFeatured)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {event.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(event.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
