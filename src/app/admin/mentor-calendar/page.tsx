'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw } from 'lucide-react'

interface CalendarTeacher {
  id: number
  name: string
  email: string
}

interface CalendarSlot {
  id: number
  teacherId: number
  startsAt: string
  endsAt: string
  timezone: string
  status: 'OPEN' | 'BOOKED' | 'CANCELLED'
  teacher: CalendarTeacher & { programs: string[] }
  requests: Array<{
    id: number
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED'
    message: string | null
    createdAt: string
    student: {
      id: number
      name: string
      email: string
      grade: string
      parentName: string
      parentEmail: string
      parentPhone: string
    }
    classSchedule: {
      status: string
      meetingLink: string | null
      location: string | null
      googleCalendarEventId: string | null
    } | null
  }>
}

const monthTitle = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const formatTime = (date: string, timezone: string) => new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).format(new Date(date))
const formatViewerTime = (date: string) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).format(new Date(date))
const formatDate = (date: string, timezone: string) => new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(date))

const calendarLegend = [
  {
    label: 'Free',
    description: 'No booking request yet',
    className: 'border-blue-300 bg-blue-50 text-blue-900',
  },
  {
    label: 'Pending request',
    description: 'A student request is awaiting review',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  {
    label: 'Booked / approved',
    description: 'A request was approved for this slot',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
]

export default function AdminMentorCalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [teachers, setTeachers] = useState<CalendarTeacher[]>([])
  const [slots, setSlots] = useState<CalendarSlot[]>([])
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    try {
      const response = await fetch(`/api/admin/mentor-calendar?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load mentor calendar.')
      setTeachers(data.teachers || [])
      setSlots(data.slots || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load mentor calendar.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { void load() }, [load])

  const filteredSlots = useMemo(
    () => slots.filter((slot) => slot.status !== 'CANCELLED' && (teacherFilter === 'all' || slot.teacherId === Number(teacherFilter))),
    [slots, teacherFilter],
  )
  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarSlot[]>()
    for (const slot of filteredSlots) {
      const key = dayKey(new Date(slot.startsAt))
      grouped.set(key, [...(grouped.get(key) || []), slot])
    }
    return grouped
  }, [filteredSlots])
  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const result: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null)
    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      result.push(new Date(month.getFullYear(), month.getMonth(), day))
    }
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [month])
  const selectedSlots = slotsByDay.get(selectedDay) || []

  const navigateMonth = (difference: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + difference, 1)
    setMonth(nextMonth)
    setSelectedDay(dayKey(nextMonth))
  }

  const getSlotLabel = (slot: CalendarSlot) => {
    const approved = slot.requests.find((request) => request.status === 'APPROVED')
    const pendingCount = slot.requests.filter((request) => request.status === 'PENDING').length
    if (approved) return `Booked · ${approved.student.name}`
    if (slot.status === 'BOOKED') return 'Booked'
    return pendingCount ? `Free · ${pendingCount} pending` : 'Free'
  }

  const getStatusStyles = (slot: CalendarSlot) => {
    if (slot.status === 'BOOKED') return 'border-emerald-300 bg-emerald-50 text-emerald-900'
    if (slot.requests.some((request) => request.status === 'PENDING')) return 'border-amber-300 bg-amber-50 text-amber-900'
    return 'border-blue-300 bg-blue-50 text-blue-900'
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Admin dashboard
            </Link>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-950"><CalendarDays className="h-7 w-7 text-blue-700" /> Mentor availability calendar</h1>
            <p className="mt-1 text-sm text-slate-600">Review every mentor’s free slots, booking requests, and approved students.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="mentor-calendar-filter" className="sr-only">Filter mentors</label>
            <select id="mentor-calendar-filter" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900">
              <option value="all">All mentors</option>
              {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
            </select>
            <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section aria-labelledby="calendar-legend-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="calendar-legend-title" className="text-sm font-semibold text-slate-950">Calendar legend</h2>
              <p className="mt-1 text-xs text-slate-600">Each colored slot shows the current availability or booking state.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {calendarLegend.map((item) => (
                <div key={item.label} className={`rounded-md border px-3 py-2 ${item.className}`}>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-[11px]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <button type="button" aria-label="Previous month" onClick={() => navigateMonth(-1)} className="rounded-md border border-slate-300 p-2 text-slate-800 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-lg font-semibold text-slate-950">{monthTitle(month)}</h2>
            <button type="button" aria-label="Next month" onClick={() => navigateMonth(1)} className="rounded-md border border-slate-300 p-2 text-slate-800 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 border-b bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="p-2 text-center text-xs font-semibold uppercase text-slate-600">{day}</div>)}
          </div>
          {loading ? <div className="flex h-80 items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-slate-500" /></div>
            : <div className="grid grid-cols-7">
              {days.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="min-h-24 border-b border-r bg-slate-50/60 sm:min-h-32" />
                const key = dayKey(day)
                const daySlots = slotsByDay.get(key) || []
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    aria-label={`View mentor availability for ${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    aria-pressed={selectedDay === key}
                    className={`min-h-24 border-b border-r p-1.5 text-left transition-colors sm:min-h-32 sm:p-2 ${selectedDay === key ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-xs font-semibold ${day.getMonth() === month.getMonth() ? 'text-slate-800' : 'text-slate-400'}`}>{day.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {daySlots.slice(0, 3).map((slot) => (
                        <div key={slot.id} className={`truncate rounded border px-1 py-0.5 text-[10px] leading-4 sm:text-xs ${getStatusStyles(slot)}`}>
                          {formatViewerTime(slot.startsAt)} {slot.teacher.name}: {getSlotLabel(slot)}
                        </div>
                      ))}
                      {daySlots.length > 3 && <p className="px-1 text-[10px] text-slate-500">+{daySlots.length - 3} more</p>}
                    </div>
                  </button>
                )
              })}
            </div>}
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{selectedDay ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}</h2>
          {selectedSlots.length === 0
            ? <p className="text-sm text-slate-500">{selectedDay ? 'No mentor availability or bookings for this date.' : 'Choose a date in the calendar to inspect its slots.'}</p>
            : <div className="space-y-4">
              {selectedSlots.map((slot) => (
                <article key={slot.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{slot.teacher.name} · {getSlotLabel(slot)}</h3>
                      <p className="text-sm text-slate-600">{formatDate(slot.startsAt, slot.timezone)} · {formatTime(slot.startsAt, slot.timezone)}–{formatTime(slot.endsAt, slot.timezone)} ({slot.timezone})</p>
                      <p className="text-xs text-slate-500">{slot.teacher.email}{slot.teacher.programs.length ? ` · ${slot.teacher.programs.join(', ')}` : ''}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(slot)}`}>{slot.status.toLowerCase()}</span>
                  </div>
                  {slot.requests.length > 0 && <div className="mt-4 space-y-3 border-t pt-3">
                    {slot.requests.map((booking) => (
                      <div key={booking.id} className="rounded-md bg-slate-50 p-3 text-sm">
                        <p className="font-medium">{booking.student.name} · {booking.status.toLowerCase()}</p>
                        <p className="text-slate-600">{booking.student.email} · Grade {booking.student.grade}</p>
                        <p className="text-slate-600">Parent: {booking.student.parentName} · {booking.student.parentEmail} · {booking.student.parentPhone}</p>
                        <p className="text-xs text-slate-500">Requested {new Date(booking.createdAt).toLocaleString()}</p>
                        {booking.message && <p className="mt-2 whitespace-pre-wrap rounded bg-white p-2 text-slate-700">{booking.message}</p>}
                        {booking.classSchedule && (
                          <div className="mt-2 text-xs text-slate-600">
                            <p>Schedule status: {booking.classSchedule.status}</p>
                            {booking.classSchedule.location && <p>Location: {booking.classSchedule.location}</p>}
                            {booking.classSchedule.meetingLink && <p>Meeting link: {booking.classSchedule.meetingLink}</p>}
                            {booking.classSchedule.googleCalendarEventId && <p>Synced to mentor Google Calendar</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>}
                </article>
              ))}
            </div>}
        </section>
      </div>
    </main>
  )
}
