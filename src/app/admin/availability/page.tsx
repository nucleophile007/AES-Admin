"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, MousePointerClick, RotateCcw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { LoadingState, Panel, PanelHeader, buttonClass, cx } from "@/components/admin/ui"

function generateTimeSlots(interval: number) {
  const slots: string[] = []
  let hour = 0
  let minute = 0

  while (hour < 24) {
    const ampm = hour < 12 ? "AM" : "PM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const displayMinute = minute.toString().padStart(2, "0")
    slots.push(`${displayHour}:${displayMinute} ${ampm}`)

    minute += interval
    if (minute >= 60) {
      hour += 1
      minute = 0
    }
  }

  return slots
}

const SLOT_INTERVAL_MINUTES = 30
const ALL_SLOTS = generateTimeSlots(SLOT_INTERVAL_MINUTES)
const SLOT_INDEX = new Map(ALL_SLOTS.map((slot, i) => [slot, i]))
const slotsPerHour = 60 / SLOT_INTERVAL_MINUTES

/** Day split into four 6-hour blocks so 48 slots are easy to scan. */
const PERIODS = [
  { label: "Night", range: "12 AM – 6 AM", from: 0, to: 6 },
  { label: "Morning", range: "6 AM – 12 PM", from: 6, to: 12 },
  { label: "Afternoon", range: "12 PM – 6 PM", from: 12, to: 18 },
  { label: "Evening", range: "6 PM – 12 AM", from: 18, to: 24 },
].map((p) => ({ ...p, slots: ALL_SLOTS.slice(p.from * slotsPerHour, p.to * slotsPerHour) }))

/** Chronological order for display (stored order is unchanged). */
const byTimeOfDay = (a: string, b: string) => (SLOT_INDEX.get(a) ?? 999) - (SLOT_INDEX.get(b) ?? 999) || a.localeCompare(b)

/** "11/18/2026" → "Wednesday, November 18, 2026" */
const prettyDate = (date: string) => {
  const [m, d, y] = date.split("/").map(Number)
  if (!m || !d || !y) return date
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

export default function AdminAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [allAvailability, setAllAvailability] = useState<Record<string, string[]>>({})
  const [draftChanges, setDraftChanges] = useState<Record<string, string[]>>({})
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set())

  // Calendar state & helpers
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: Array<number | null> = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(day)
    return days
  }

  const navigateMonth = (direction: "prev" | "next", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth((prev) => {
      const n = new Date(prev)
      n.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      return n
    })
  }

  const formatDate = (day: number) => {
    const month = currentMonth.getMonth() + 1
    const year = currentMonth.getFullYear()
    return `${month}/${day}/${year}`
  }

  const now = new Date()
  const todayKey = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`

  const isSelectedDate = (day: number) => selectedDate === formatDate(day)

  const getCurrentTimesForDate = (date: string): string[] => {
    if (draftChanges[date] !== undefined) {
      return draftChanges[date]
    }
    return allAvailability[date] || []
  }

  const slotCountForDay = (day: number) => getCurrentTimesForDate(formatDate(day)).length

  const calendarDays = getDaysInMonth(currentMonth)

  const loadAllAvailability = async (showLoading = true) => {
    if (showLoading) setInitialLoading(true)
    try {
      const res = await fetch("/api/admin/availability")
      if (!res.ok) {
        throw new Error("Failed to load availability")
      }

      const json = await res.json()
      const dataSets: Record<string, Set<string>> = {}
      for (const d of json.days || []) {
        if (!d?.date) continue
        if (!dataSets[d.date]) {
          dataSets[d.date] = new Set<string>()
        }
        const times = Array.isArray(d.times) ? d.times : []
        for (const t of times) {
          if (typeof t === "string" && t.trim()) {
            dataSets[d.date].add(t.trim())
          }
        }
      }
      const data: Record<string, string[]> = {}
      for (const [date, times] of Object.entries(dataSets)) {
        data[date] = Array.from(times).sort((a, b) => a.localeCompare(b))
      }

      setAllAvailability(data)
      setDraftChanges({})
      setDirtyDates(new Set())
    } catch (error) {
      console.error("Failed to load availability:", error)
      setAllAvailability({})
      setDraftChanges({})
      setDirtyDates(new Set())
    } finally {
      if (showLoading) setInitialLoading(false)
    }
  }

  useEffect(() => {
    loadAllAvailability()
  }, [])

  useEffect(() => {
    if (!selectedDate) {
      setSelectedTimes([])
      return
    }
    setSelectedTimes(getCurrentTimesForDate(selectedDate))
  }, [selectedDate, allAvailability, draftChanges])

  const markDirty = (date: string) => {
    const newDirtyDates = new Set(dirtyDates)
    newDirtyDates.add(date)
    setDirtyDates(newDirtyDates)
  }

  /** Replace the selected date's times as a draft (same path a single toggle takes). */
  const setTimesForSelectedDate = (newTimes: string[]) => {
    if (!selectedDate) return
    setSelectedTimes(newTimes)
    setDraftChanges((prev) => ({
      ...prev,
      [selectedDate]: newTimes
    }))
    markDirty(selectedDate)
  }

  const toggleTime = (time: string) => {
    if (!selectedDate) return

    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter((t) => t !== time)
      : [...selectedTimes, time].sort()

    setTimesForSelectedDate(newTimes)
  }

  /** Select every slot in a period, or clear them all if they're already selected. */
  const togglePeriod = (slots: string[]) => {
    if (!selectedDate) return
    const allOn = slots.every((s) => selectedTimes.includes(s))
    const newTimes = allOn
      ? selectedTimes.filter((t) => !slots.includes(t))
      : Array.from(new Set([...selectedTimes, ...slots])).sort()
    setTimesForSelectedDate(newTimes)
  }

  const discardChanges = () => {
    setDraftChanges({})
    setDirtyDates(new Set())
  }

  const saveAll = async () => {
    if (dirtyDates.size === 0) return

    setLoading(true)
    try {
      const payload: Array<{ date: string; times: string[] }> = []

      for (const date of dirtyDates) {
        const times = draftChanges[date] ?? []
        payload.push({
          date,
          times: times.slice().sort((a, b) => a.localeCompare(b))
        })
      }

      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Save failed")
      await loadAllAvailability(false)
      toast.success(`Availability saved for ${payload.length} ${payload.length === 1 ? "date" : "dates"}`)
    } catch (e) {
      console.error(e)
      toast.error("Failed to save availability")
    } finally {
      setLoading(false)
    }
  }

  const unsaved = dirtyDates.size

  const headerActions = (
    <>
      {unsaved > 0 && (
        <span className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1 text-xs font-medium text-gold-700 ring-1 ring-inset ring-gold-200">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          {unsaved} unsaved {unsaved === 1 ? "date" : "dates"}
        </span>
      )}
      <button type="button" onClick={discardChanges} disabled={loading || unsaved === 0} className={buttonClass("secondary")}>
        <RotateCcw className="h-4 w-4" />
        Discard
      </button>
      <button type="button" onClick={saveAll} disabled={loading || unsaved === 0} className={buttonClass("primary")}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "Saving…" : unsaved > 0 ? `Save changes (${unsaved})` : "Save changes"}
      </button>
    </>
  )

  if (initialLoading) {
    return (
      <AdminPageShell moduleId="availability">
        <Panel>
          <LoadingState label="Loading availability…" />
        </Panel>
      </AdminPageShell>
    )
  }

  const sortedSelected = [...selectedTimes].sort(byTimeOfDay)

  return (
    <AdminPageShell
      moduleId="availability"
      description="Pick a date, then choose the time slots families can book."
      actions={headerActions}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Calendar */}
        <Panel className="h-fit">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <button
              type="button"
              onClick={(e: React.MouseEvent) => navigateMonth("prev", e)}
              className={buttonClass("ghost", "icon")}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-[15px] font-semibold text-ink">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={(e: React.MouseEvent) => navigateMonth("next", e)}
              className={buttonClass("ghost", "icon")}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-1 grid grid-cols-7">
              {daysOfWeek.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} />
                const key = formatDate(day)
                const selected = isSelectedDate(day)
                const count = slotCountForDay(day)
                const dirty = dirtyDates.has(key)
                const isToday = key === todayKey
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    aria-pressed={selected}
                    aria-label={`${prettyDate(key)}${count ? `, ${count} slots` : ""}${dirty ? ", unsaved" : ""}`}
                    className={cx(
                      "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-medium transition",
                      selected
                        ? "bg-brand-700 text-white shadow-card"
                        : count > 0
                          ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "text-ink-soft hover:bg-surface-muted",
                      isToday && !selected && "ring-1 ring-inset ring-brand-300"
                    )}
                  >
                    <span className="tabular-nums">{day}</span>
                    {count > 0 && (
                      <span className={cx("text-[10px] leading-none tabular-nums", selected ? "text-brand-100" : "text-emerald-700/80")}>
                        {count}
                      </span>
                    )}
                    {dirty && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-gold-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-inset ring-emerald-200" /> Has slots
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> Unsaved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-1 ring-inset ring-brand-300" /> Today
            </span>
          </div>
        </Panel>

        {/* Time slots */}
        <Panel>
          <PanelHeader
            title={selectedDate ? prettyDate(selectedDate) : "Time slots"}
            description={
              selectedDate
                ? `${selectedTimes.length} of ${ALL_SLOTS.length} slots selected · ${SLOT_INTERVAL_MINUTES}-minute slots`
                : "Select a date on the calendar to edit its slots."
            }
            actions={
              selectedDate && selectedTimes.length > 0 ? (
                <button type="button" onClick={() => setTimesForSelectedDate([])} className={buttonClass("ghost", "sm")}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear day
                </button>
              ) : undefined
            }
          />

          {!selectedDate ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                <MousePointerClick className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">No date selected</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Choose a day on the calendar. Days in green already have slots.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {PERIODS.map((period) => {
                const selectedInPeriod = period.slots.filter((s) => selectedTimes.includes(s)).length
                const allOn = selectedInPeriod === period.slots.length
                return (
                  <div key={period.label} className="px-5 py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-sm font-semibold text-ink">{period.label}</h3>
                        <span className="text-xs text-subtle">{period.range}</span>
                        {selectedInPeriod > 0 && (
                          <span className="text-xs font-medium text-brand-700">{selectedInPeriod} selected</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePeriod(period.slots)}
                        className="text-xs font-medium text-brand-700 hover:underline"
                      >
                        {allOn ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                      {period.slots.map((time) => {
                        const active = selectedTimes.includes(time)
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => toggleTime(time)}
                            aria-pressed={active}
                            className={cx(
                              "h-9 rounded-lg border text-xs font-medium tabular-nums transition",
                              active
                                ? "border-brand-700 bg-brand-700 text-white shadow-card"
                                : "border-line bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <div className="bg-surface-muted/60 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Selected for this day</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sortedSelected.length > 0 ? (
                    sortedSelected.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTime(t)}
                        title="Remove this slot"
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-100"
                      >
                        {t}
                        <span aria-hidden className="text-[10px] opacity-60">✕</span>
                      </button>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-muted">
                      <CalendarDays className="h-4 w-4 text-subtle" />
                      No slots yet. Click a time above to add it.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </AdminPageShell>
  )
}
