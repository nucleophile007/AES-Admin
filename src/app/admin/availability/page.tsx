"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"

// Helper to get interval (in minutes) for a program
function getIntervalForProgram(program: string) {
  if (program === 'Academic Tutoring' || program === 'SAT Coaching') return 30;
  return 60;
}

// Generate time slots for a day based on interval (full 24 hours)
function generateTimeSlots(interval: number) {
  const slots: string[] = [];
  let hour = 0;
  let minute = 0;
  while (hour < 24) {
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, '0');
    slots.push(`${displayHour}:${displayMinute} ${ampm}`);
    minute += interval;
    if (minute >= 60) {
      hour += 1;
      minute = 0;
    }
  }
  return slots;
}

// Available programs
const PROGRAMS = [
  'Academic Tutoring',
  'College Prep', 
  'SAT Coaching',
  'Research Program',
  'Olympiads',
  'Profile Building'
]

export default function AdminAvailabilityPage() {
  const [selectedProgram, setSelectedProgram] = useState<string>(PROGRAMS[0])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [allAvailability, setAllAvailability] = useState<Record<string, Record<string, string[]>>>({}) // program -> date -> times
  const [draftChanges, setDraftChanges] = useState<Record<string, Record<string, string[]>>>({}) // program -> date -> times
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set()) // "program-date" keys

  // Calendar state & helpers
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
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
    e.preventDefault(); e.stopPropagation()
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
  
  const dayHasAvailability = (day: number) => {
    const date = formatDate(day)
    if (!selectedProgram) return false
    const times = getCurrentTimesForProgramDate(selectedProgram, date)
    return times.length > 0
  }

  const calendarDays = getDaysInMonth(currentMonth)

  // Helper to get current times for a program-date combination (including draft changes)
  const getCurrentTimesForProgramDate = (program: string, date: string): string[] => {
    if (draftChanges[program]?.[date] !== undefined) {
      return draftChanges[program][date]
    }
    return allAvailability[program]?.[date] || []
  }

  // Load all availability data
  const loadAllAvailability = async () => {
    setInitialLoading(true)
    try {
      const data: Record<string, Record<string, string[]>> = {}
      
      for (const program of PROGRAMS) {
        const res = await fetch(`/api/admin/availability?program=${encodeURIComponent(program)}`)
        if (res.ok) {
          const json = await res.json()
          const programData: Record<string, string[]> = {}
          for (const d of json.days || []) {
            programData[d.date] = d.times || []
          }
          data[program] = programData
        } else {
          data[program] = {}
        }
      }
      
      setAllAvailability(data)
      setDraftChanges({})
      setDirtyKeys(new Set())
    } catch (error) {
      console.error('Failed to load availability:', error)
      const emptyData: Record<string, Record<string, string[]>> = {}
      PROGRAMS.forEach(p => emptyData[p] = {})
      setAllAvailability(emptyData)
      setDraftChanges({})
    } finally {
      setInitialLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadAllAvailability()
  }, [])

  // Update selected times when date or program changes
  const updateSelectedTimes = () => {
    if (!selectedDate || !selectedProgram) {
      setSelectedTimes([])
      return
    }
    setSelectedTimes(getCurrentTimesForProgramDate(selectedProgram, selectedDate))
  }

  useEffect(() => {
    updateSelectedTimes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedProgram, allAvailability, draftChanges])

  // Select a program (only one at a time)
  const selectProgram = (program: string) => {
    setSelectedProgram(program)
  }

  // Mark dirty key
  const markDirty = (program: string, date: string) => {
    const newDirtyKeys = new Set(dirtyKeys)
    newDirtyKeys.add(`${program}-${date}`)
    setDirtyKeys(newDirtyKeys)
  }

  // Toggle time slot for selected program
  const toggleTime = (time: string) => {
    if (!selectedDate || !selectedProgram) return

    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time].sort()

    setSelectedTimes(newTimes)

    // Update draft changes for selected program
    setDraftChanges(prev => {
      const next = { ...prev }
      if (!next[selectedProgram]) next[selectedProgram] = {}
      next[selectedProgram][selectedDate] = newTimes
      return next
    })

    markDirty(selectedProgram, selectedDate)
  }

  // Save all changes
  const saveAll = async () => {
    if (dirtyKeys.size === 0) return

    setLoading(true)
    try {
      const payload: Array<{ date: string; times: string[]; program: string }> = []

      // Build payload from dirty keys
      for (const dirtyKey of dirtyKeys) {
        const [program, date] = dirtyKey.split('-')
        const times = draftChanges[program]?.[date] ?? []
        payload.push({
          date,
          times: times.slice().sort((a, b) => a.localeCompare(b)),
          program
        })
      }

      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Save failed')
      await loadAllAvailability()
    } catch (e) {
      console.error(e)
      alert('Failed to save availability')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="max-w-7xl mx-auto p-6">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registrations
        </Link>
        <h1 className="text-3xl font-bold mb-2">Manage Program Availability</h1>
        <p className="text-gray-600">Set available time slots for multiple programs at once</p>
      </div>

      {/* Program Selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Select Program</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PROGRAMS.map((program) => (
            <button
              key={program}
              onClick={() => selectProgram(program)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedProgram === program
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {program}
              {selectedProgram === program && (
                <CheckCircle2 className="w-4 h-4 ml-2 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Program Info */}
      {selectedProgram && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Managing: {selectedProgram}
              </h3>
              <p className="text-sm text-blue-700">
                Set available time slots for this program
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-600">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"/> has slots
              </span>
              {dirtyKeys.size > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"/> unsaved changes ({dirtyKeys.size})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar column */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              type="button" 
              onClick={(e: React.MouseEvent)=>navigateMonth('prev', e)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-xl font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <button 
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              type="button" 
              onClick={(e: React.MouseEvent)=>navigateMonth('next', e)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-3">
            {daysOfWeek.map(d => (
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
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                    disabled={!selectedProgram}
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
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Time Slots</h2>
              <p className="text-sm text-gray-600">
                {selectedDate 
                  ? `Selected: ${selectedDate} | ${selectedProgram}`
                  : !selectedProgram
                    ? 'Select program first'
                    : 'Select a date from calendar'
                }
              </p>
            </div>
            <button 
              onClick={saveAll} 
              disabled={loading || dirtyKeys.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : `Save All ${dirtyKeys.size > 0 ? `(${dirtyKeys.size})` : ''}`}
            </button>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {generateTimeSlots(getIntervalForProgram(selectedProgram)).map((time) => {
              const active = selectedTimes.includes(time)
              return (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`p-2 rounded border text-xs font-medium transition-all ${
                    active
                      ? 'bg-blue-500 text-white border-blue-500 shadow'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  disabled={!selectedDate || !selectedProgram}
                >
                  {time}
                </button>
              )
            })}
          </div>

          {selectedDate && selectedProgram && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">
                Selected Times for {selectedDate}
                <span className="ml-2 text-sm font-normal text-blue-600">
                  ({selectedProgram})
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTimes.length > 0 ? (
                  selectedTimes.sort((a,b)=>a.localeCompare(b)).map(t => (
                    <span 
                      key={t} 
                      className="px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-800"
                    >
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
  )
}