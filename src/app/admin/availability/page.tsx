"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar } from "lucide-react"
import Link from "next/link"

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

  const isSelectedDate = (day: number) => selectedDate === formatDate(day)

  const getCurrentTimesForDate = (date: string): string[] => {
    if (draftChanges[date] !== undefined) {
      return draftChanges[date]
    }
    return allAvailability[date] || []
  }

  const dayHasAvailability = (day: number) => {
    const date = formatDate(day)
    return getCurrentTimesForDate(date).length > 0
  }

  const calendarDays = getDaysInMonth(currentMonth)

  const loadAllAvailability = async () => {
    setInitialLoading(true)
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
      setInitialLoading(false)
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

  const toggleTime = (time: string) => {
    if (!selectedDate) return

    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter((t) => t !== time)
      : [...selectedTimes, time].sort()

    setSelectedTimes(newTimes)

    setDraftChanges((prev) => ({
      ...prev,
      [selectedDate]: newTimes
    }))

    markDirty(selectedDate)
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
      await loadAllAvailability()
    } catch (e) {
      console.error(e)
      alert("Failed to save availability")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Availability Slots</h1>
                <p className="text-sm text-gray-700">Select only date and time slots</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Slot Availability</h3>
              <p className="text-sm text-blue-700">Choose date first, then select one or more time slots</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-600">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> has slots
              </span>
              {dirtyDates.size > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" /> unsaved changes ({dirtyDates.size})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar column */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                onClick={(e: React.MouseEvent) => navigateMonth("prev", e)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h4 className="text-xl font-semibold text-gray-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                onClick={(e: React.MouseEvent) => navigateMonth("next", e)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-3">
              {daysOfWeek.map((d) => (
                <div key={d} className="text-center text-sm font-semibold text-gray-700 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {day && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(formatDate(day))}
                      className={`w-12 h-12 rounded-full text-sm font-semibold transition-all ${
                        isSelectedDate(day)
                          ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-300"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      <span className="relative">
                        {day}
                        {dayHasAvailability(day) && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Times column */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Time Slots</h2>
                <p className="text-sm text-gray-600">
                  {selectedDate ? `Selected: ${selectedDate}` : "Select a date from calendar"}
                </p>
              </div>
              <button
                onClick={saveAll}
                disabled={loading || dirtyDates.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : `Save All ${dirtyDates.size > 0 ? `(${dirtyDates.size})` : ""}`}
              </button>
            </div>

            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-xs bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-500 border border-blue-500 rounded"></span>
                <span className="text-gray-700">Selected slot</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-white border border-gray-200 rounded"></span>
                <span className="text-gray-700">Available to select</span>
              </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {generateTimeSlots(SLOT_INTERVAL_MINUTES).map((time) => {
                const active = selectedTimes.includes(time)

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTime(time)}
                    className={`p-2 rounded border text-xs font-medium transition-all ${
                      active
                        ? "bg-blue-500 text-white border-blue-500 shadow"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                    disabled={!selectedDate}
                  >
                    {time}
                  </button>
                )
              })}
            </div>

            {selectedDate && (
              <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-3 text-gray-900">Selected Times for {selectedDate}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTimes.length > 0 ? (
                    [...selectedTimes].sort((a, b) => a.localeCompare(b)).map((t) => (
                      <span key={t} className="px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-800">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-700 text-sm font-medium">No times selected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
