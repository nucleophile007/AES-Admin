"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  ArrowLeft,
} from "lucide-react"

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
  maxParticipants: number | null
  registrationFee: number
  requiresPayment: boolean
  EventRegistration: Registration[]
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
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

  if (!event) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Event not found</h2>
        </div>
      </div>
    )
  }

  const stats = {
    total: event.EventRegistration.length,
    confirmed: event.EventRegistration.filter(
      (r) => r.registrationStatus === "confirmed"
    ).length,
    pending: event.EventRegistration.filter(
      (r) => r.registrationStatus === "pending"
    ).length,
    attended: event.EventRegistration.filter((r) => r.attendanceConfirmed)
      .length,
    totalPayments: event.EventRegistration.filter(
      (r) => r.paymentStatus === "completed"
    ).reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
  }

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      attended: "bg-blue-100 text-blue-800",
      "no-show": "bg-gray-100 text-gray-800",
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/events")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/events/${eventId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Event Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <div>
              <div className="font-medium">Date & Time</div>
              <div className="text-sm">
                {new Date(event.eventDate).toLocaleDateString()}
              </div>
              <div className="text-sm">{event.eventTime}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <div>
              <div className="font-medium">Location</div>
              <div className="text-sm">{event.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <div>
              <div className="font-medium">Capacity</div>
              <div className="text-sm">
                {stats.total}
                {event.maxParticipants && ` / ${event.maxParticipants}`}{" "}
                registered
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <div>
              <div className="font-medium">Registration Fee</div>
              <div className="text-sm">${event.registrationFee}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Registrations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {stats.confirmed}
          </div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {stats.attended}
          </div>
          <div className="text-sm text-gray-600">Attended</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">
            ${stats.totalPayments.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Total Collected</div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Registrations</h2>
        </div>
        {event.EventRegistration.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No registrations yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {event.EventRegistration.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{reg.studentName}</div>
                      <div className="text-sm text-gray-500">
                        {reg.studentEmail}
                      </div>
                      {reg.studentGrade && (
                        <div className="text-xs text-gray-400">
                          Grade {reg.studentGrade}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{reg.parentName}</div>
                      <div className="text-sm text-gray-500">
                        {reg.parentEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          reg.registrationStatus
                        )}`}
                      >
                        {reg.registrationStatus}
                      </span>
                      {reg.attendanceConfirmed && (
                        <div className="text-xs text-green-600 mt-1">
                          ✓ Checked in
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {reg.paymentStatus === "completed" ? (
                        <div className="text-green-600">
                          <div className="font-medium">
                            ${reg.paymentAmount}
                          </div>
                          <div className="text-xs">Paid</div>
                        </div>
                      ) : (
                        <div className="text-yellow-600 text-sm">Pending</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!reg.attendanceConfirmed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(reg.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Check In
                          </Button>
                        )}
                        {reg.registrationStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateStatus(reg.id, "confirmed")
                            }
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
