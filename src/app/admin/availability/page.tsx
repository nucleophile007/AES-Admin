"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const hours = Array.from({ length: 24 }, (_, i) => i) // 0..23
function toLabel(h: number) {
  const hr = ((h + 11) % 12) + 1
  const ampm = h < 12 ? 'AM' : 'PM'
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hr)}:00 ${ampm}`
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
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([PROGRAMS[0]])
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
    
    // If no programs selected, no availability indicator
    if (selectedPrograms.length === 0) return false
    
    // For single program, check if it has any times for this date
    if (selectedPrograms.length === 1) {
      const times = getCurrentTimesForProgramDate(selectedPrograms[0], date)
      return times.length > 0
    }
    
    // For multiple programs, check if ALL programs have at least one time slot for this date
    return selectedPrograms.every(program => {
      const times = getCurrentTimesForProgramDate(program, date)
      return times.length > 0
    })
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

  // Update selected times when date or programs change
  const updateSelectedTimes = () => {
    if (!selectedDate) {
      setSelectedTimes([])
      return
    }

    // Find common times across all selected programs for this date
    if (selectedPrograms.length === 0) {
      setSelectedTimes([])
    } else if (selectedPrograms.length === 1) {
      setSelectedTimes(getCurrentTimesForProgramDate(selectedPrograms[0], selectedDate))
    } else {
      // For multiple programs, show intersection of times
      const timeSets = selectedPrograms.map(program => 
        new Set(getCurrentTimesForProgramDate(program, selectedDate))
      )
      const intersection = Array.from(timeSets[0]).filter(time => 
        timeSets.every(set => set.has(time))
      )
      setSelectedTimes(intersection)
    }
  }

  useEffect(() => {
    updateSelectedTimes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedPrograms, allAvailability, draftChanges])

  // Toggle program selection
  const toggleProgram = (program: string) => {
    setSelectedPrograms(prev => 
      prev.includes(program) 
        ? prev.filter(p => p !== program)
        : [...prev, program]
    )
  }

  // Mark dirty keys
  const markDirty = (programs: string[], date: string) => {
    const newDirtyKeys = new Set(dirtyKeys)
    programs.forEach(program => newDirtyKeys.add(`${program}-${date}`))
    setDirtyKeys(newDirtyKeys)
  }

  // Toggle time slot for selected programs
  const toggleTime = (time: string) => {
    if (!selectedDate || selectedPrograms.length === 0) return

    const newTimes = selectedTimes.includes(time) 
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time].sort()

    setSelectedTimes(newTimes)

    // Update draft changes for all selected programs
    setDraftChanges(prev => {
      const next = { ...prev }
      selectedPrograms.forEach(program => {
        if (!next[program]) next[program] = {}
        next[program][selectedDate] = newTimes
      })
      return next
    })

    markDirty(selectedPrograms, selectedDate)
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
      
      // Reload all data to get fresh state
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
        <h2 className="text-lg font-semibold mb-3">Select Programs ({selectedPrograms.length} selected)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PROGRAMS.map((program) => (
            <button
              key={program}
              onClick={() => toggleProgram(program)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedPrograms.includes(program)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {program}
              {selectedPrograms.includes(program) && (
                <CheckCircle2 className="w-4 h-4 ml-2 inline-block" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Programs Info */}
      {selectedPrograms.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Managing: {selectedPrograms.length === 1 ? selectedPrograms[0] : `${selectedPrograms.length} Programs`}
              </h3>
              <p className="text-sm text-blue-700">
                {selectedPrograms.length === 1 
                  ? 'Set available time slots for this program'
                  : `Set common time slots for: ${selectedPrograms.join(', ')}`
                }
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
                    disabled={selectedPrograms.length === 0}
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
                  ? `Selected: ${selectedDate} | ${selectedPrograms.length} program(s)`
                  : selectedPrograms.length === 0 
                    ? 'Select programs first'
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

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {hours.map(h => {
              const label = toLabel(h)
              const active = selectedTimes.includes(label)
              
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleTime(label)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    active 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                  disabled={!selectedDate || selectedPrograms.length === 0}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {selectedDate && selectedPrograms.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">
                Selected Times for {selectedDate}
                <span className="ml-2 text-sm font-normal text-blue-600">
                  ({selectedPrograms.join(', ')})
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
              
              {selectedPrograms.length > 1 && selectedTimes.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  ℹ️ These time slots will be set for all {selectedPrograms.length} selected programs
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
