'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, CalendarX2, ChevronDown, ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone, RefreshCw, Video } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { Badge, LoadingState, Panel, buttonClass, cx, selectClass, type BadgeTone } from '@/components/admin/ui'

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

type SlotState = 'free' | 'pending' | 'booked'

/** Colour language shared by the legend, the calendar chips and the detail cards. */
const SLOT_STYLE: Record<SlotState, { label: string; description: string; tone: BadgeTone; chip: string; dot: string }> = {
  free: {
    label: 'Free',
    description: 'No booking request yet',
    tone: 'brand',
    chip: 'border-brand-400 bg-brand-50 text-brand-800',
    dot: 'bg-brand-500',
  },
  pending: {
    label: 'Pending request',
    description: 'A student request is awaiting review',
    tone: 'amber',
    chip: 'border-gold-500 bg-gold-50 text-gold-700',
    dot: 'bg-gold-500',
  },
  booked: {
    label: 'Booked',
    description: 'A request was approved for this slot',
    tone: 'emerald',
    chip: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
  },
}

const REQUEST_TONE: Record<CalendarSlot['requests'][number]['status'], BadgeTone> = {
  PENDING: 'amber',
  APPROVED: 'emerald',
  DECLINED: 'rose',
  CANCELLED: 'slate',
}

const titleCase = (value: string) => value.charAt(0) + value.slice(1).toLowerCase()

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
  const todayKey = dayKey(new Date())

  const navigateMonth = (difference: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + difference, 1)
    setMonth(nextMonth)
    setSelectedDay(dayKey(nextMonth))
  }

  const goToToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDay(dayKey(now))
  }

  const getSlotLabel = (slot: CalendarSlot) => {
    const approved = slot.requests.find((request) => request.status === 'APPROVED')
    const pendingCount = slot.requests.filter((request) => request.status === 'PENDING').length
    if (approved) return `Booked · ${approved.student.name}`
    if (slot.status === 'BOOKED') return 'Booked'
    return pendingCount ? `Free · ${pendingCount} pending` : 'Free'
  }

  const getSlotState = (slot: CalendarSlot): SlotState => {
    if (slot.status === 'BOOKED') return 'booked'
    if (slot.requests.some((request) => request.status === 'PENDING')) return 'pending'
    return 'free'
  }

  const monthCounts = useMemo(() => {
    const counts: Record<SlotState, number> = { free: 0, pending: 0, booked: 0 }
    for (const slot of filteredSlots) counts[getSlotState(slot)] += 1
    return counts
  }, [filteredSlots])

  return (
    <AdminPageShell
      moduleId="mentor-calendar"
      description="Review every mentor's free slots, booking requests and approved students."
      actions={
        <>
          <label className="relative block w-56">
            <span className="sr-only">Filter mentors</span>
            <select value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} className={selectClass}>
              <option value="all">All mentors</option>
              {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          </label>
          <button type="button" onClick={() => void load()} disabled={loading} className={buttonClass('secondary')}>
            <RefreshCw className={cx('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </button>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Month grid */}
        <Panel className="self-start overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous month" onClick={() => navigateMonth(-1)} className={buttonClass('secondary', 'icon')}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Next month" onClick={() => navigateMonth(1)} className={buttonClass('secondary', 'icon')}>
                <ChevronRight className="h-4 w-4" />
              </button>
              <h2 className="ml-1 text-[15px] font-semibold text-ink">{monthTitle(month)}</h2>
              <button type="button" onClick={goToToday} className={buttonClass('ghost', 'sm')}>Today</button>
            </div>
            <ul aria-label="Calendar legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {(Object.keys(SLOT_STYLE) as SlotState[]).map((state) => (
                <li key={state} className="inline-flex items-center gap-1.5" title={SLOT_STYLE[state].description}>
                  <span className={`h-2 w-2 rounded-full ${SLOT_STYLE[state].dot}`} />
                  {SLOT_STYLE[state].label}
                  {!loading && <span className="tabular-nums text-subtle">{monthCounts[state]}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-surface-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-subtle">{day}</div>
            ))}
          </div>

          {loading ? <LoadingState label="Loading mentor calendar…" />
            : <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const lastColumn = index % 7 === 6
                if (!day) return <div key={`blank-${index}`} className={cx('min-h-24 border-b border-line bg-surface-muted/50 sm:min-h-28', !lastColumn && 'border-r')} />
                const key = dayKey(day)
                const daySlots = slotsByDay.get(key) || []
                const selected = selectedDay === key
                const isToday = key === todayKey
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    aria-label={`View mentor availability for ${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    aria-pressed={selected}
                    className={cx(
                      'group min-h-24 border-b border-line p-1.5 text-left align-top transition-colors sm:min-h-28 sm:p-2',
                      !lastColumn && 'border-r',
                      selected ? 'bg-brand-50/70 ring-2 ring-inset ring-brand-300' : 'hover:bg-surface-muted/70'
                    )}
                  >
                    <span
                      className={cx(
                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums',
                        isToday ? 'bg-brand-700 text-white' : 'text-ink-soft'
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {daySlots.slice(0, 3).map((slot) => (
                        <div
                          key={slot.id}
                          title={`${formatViewerTime(slot.startsAt)} ${slot.teacher.name}: ${getSlotLabel(slot)}`}
                          className={cx('truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] leading-4 sm:text-[11px]', SLOT_STYLE[getSlotState(slot)].chip)}
                        >
                          <span className="font-semibold tabular-nums">{formatViewerTime(slot.startsAt)}</span> {slot.teacher.name}
                        </div>
                      ))}
                      {daySlots.length > 3 && <p className="px-1 text-[10px] font-medium text-muted">+{daySlots.length - 3} more</p>}
                    </div>
                  </button>
                )
              })}
            </div>}
        </Panel>

        {/* Selected day */}
        <Panel className="h-fit xl:sticky xl:top-[84px]">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-subtle">Selected day</p>
            <h2 className="mt-1 text-[15px] font-semibold text-ink">
              {selectedDay ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h2>
            {selectedSlots.length > 0 && (
              <p className="mt-0.5 text-sm text-muted">{selectedSlots.length} {selectedSlots.length === 1 ? 'slot' : 'slots'}</p>
            )}
          </div>

          {selectedSlots.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-subtle ring-1 ring-inset ring-line">
                <CalendarX2 className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">Nothing scheduled</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                {selectedDay ? 'No mentor availability or bookings for this date.' : 'Choose a date in the calendar to inspect its slots.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-200px)] divide-y divide-line overflow-y-auto">
              {selectedSlots.map((slot) => {
                const state = SLOT_STYLE[getSlotState(slot)]
                return (
                  <article key={slot.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-subtle" />
                          {formatTime(slot.startsAt, slot.timezone)} – {formatTime(slot.endsAt, slot.timezone)}
                        </p>
                        <p className="mt-0.5 text-xs text-subtle">{formatDate(slot.startsAt, slot.timezone)} · {slot.timezone}</p>
                      </div>
                      <Badge tone={state.tone} dot>{getSlotLabel(slot)}</Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold uppercase text-emerald-800 ring-1 ring-inset ring-emerald-100">
                        {slot.teacher.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{slot.teacher.name}</p>
                        <p className="truncate text-xs text-muted">{slot.teacher.email}</p>
                      </div>
                    </div>
                    {slot.teacher.programs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {slot.teacher.programs.map((program) => <Badge key={program} tone="slate">{program}</Badge>)}
                      </div>
                    )}

                    {slot.requests.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                          Requests ({slot.requests.length})
                        </p>
                        {slot.requests.map((booking) => (
                          <div key={booking.id} className="rounded-lg border border-line bg-surface-muted/60 p-3 text-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink">{booking.student.name}</p>
                                <p className="truncate text-xs text-muted">Grade {booking.student.grade} · {booking.student.email}</p>
                              </div>
                              <Badge tone={REQUEST_TONE[booking.status]}>{titleCase(booking.status)}</Badge>
                            </div>
                            <div className="mt-2 space-y-0.5 text-xs text-muted">
                              <p className="truncate">Parent: <span className="text-ink-soft">{booking.student.parentName}</span></p>
                              <a href={`mailto:${booking.student.parentEmail}`} className="flex items-center gap-1.5 truncate hover:text-brand-700">
                                <Mail className="h-3 w-3 shrink-0" />{booking.student.parentEmail}
                              </a>
                              <a href={`tel:${booking.student.parentPhone}`} className="flex items-center gap-1.5 hover:text-brand-700">
                                <Phone className="h-3 w-3 shrink-0" />{booking.student.parentPhone}
                              </a>
                            </div>
                            {booking.message && (
                              <p className="mt-2 whitespace-pre-wrap rounded-md border border-line bg-surface p-2 text-xs text-ink-soft">{booking.message}</p>
                            )}
                            {booking.classSchedule && (
                              <div className="mt-2 space-y-0.5 border-t border-line pt-2 text-xs text-muted">
                                <p>Schedule status: <span className="text-ink-soft">{booking.classSchedule.status}</span></p>
                                {booking.classSchedule.location && (
                                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{booking.classSchedule.location}</p>
                                )}
                                {booking.classSchedule.meetingLink && (
                                  <a href={booking.classSchedule.meetingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-brand-700 hover:underline">
                                    <Video className="h-3 w-3 shrink-0" />{booking.classSchedule.meetingLink}
                                  </a>
                                )}
                                {booking.classSchedule.googleCalendarEventId && (
                                  <p className="flex items-center gap-1.5 text-emerald-700"><CalendarCheck2 className="h-3 w-3 shrink-0" />Synced to mentor Google Calendar</p>
                                )}
                              </div>
                            )}
                            <p className="mt-2 text-[11px] text-subtle">Requested {new Date(booking.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </AdminPageShell>
  )
}
