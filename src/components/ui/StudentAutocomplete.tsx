"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  grade: string
  schoolName: string
}

interface StudentAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onStudentSelect: (student: Student | null) => void
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

export default function StudentAutocomplete({
  value,
  onChange,
  onStudentSelect,
  disabled = false,
  placeholder = "Enter student name...",
  required = false,
}: StudentAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.students || [])
          setShowDropdown(data.students && data.students.length > 0)
        }
      } catch (error) {
        console.error("Student search error:", error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
    // Clear student selection when typing
    if (newValue !== value) {
      onStudentSelect(null)
    }
  }

  const handleSelectStudent = (student: Student) => {
    onChange(student.name)
    onStudentSelect(student)
    setSuggestions([])
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectStudent(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-black"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((student, index) => (
            <div
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                selectedIndex === index
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100 text-gray-900"
              }`}
            >
              <div className="font-medium">{student.name}</div>
              <div className="text-sm text-gray-600">
                Grade {student.grade} • {student.schoolName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
