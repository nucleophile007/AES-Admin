'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: number
  name: string
  graduationYear?: number | null
}

interface Research {
  id: string
  title: string
  slug: string
  description: string | null
  author: string | null
  grade: string | null
  school: string | null
  category: string | null
  domain: string | null
  published: boolean
  createdAt: string
  abstract: string | null
  keywords: string[]
  presentationPdfFilename: string | null
  pdfFilename: string | null
  student: Student | null
  _count: {
    AccessRequest: number
  }
}

interface EditMetadataModalProps {
  research: Research
  onClose: () => void
  onSave: (updated: Research) => void
}

export default function EditMetadataModal({ research, onClose, onSave }: EditMetadataModalProps) {
  const [formData, setFormData] = useState({
    title: research.title || '',
    description: research.description || '',
    author: research.author || '',
    grade: research.grade || '',
    school: research.school || '',
    category: research.category || '',
    domain: research.domain || '',
    abstract: research.abstract || '',
    keywords: research.keywords.join(', '),
    published: research.published,
    studentId: research.student?.id?.toString() || '',
  })
  const [saving, setSaving] = useState(false)
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState(research.student?.name || '')
  const [studentResults, setStudentResults] = useState<Student[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatePayload = {
        title: formData.title,
        description: formData.description || null,
        author: formData.author || null,
        grade: formData.grade || null,
        school: formData.school || null,
        category: formData.category || null,
        domain: formData.domain || null,
        abstract: formData.abstract || null,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        published: formData.published,
        studentId: formData.studentId ? parseInt(formData.studentId) : null,
      }

      const response = await fetch(`/api/admin/research/${research.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update research')
      }

      const data = await response.json()
      toast.success('Research updated successfully')
      onSave(data.research)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update research')
    } finally {
      setSaving(false)
    }
  }

  const searchStudents = async (term: string) => {
    if (!term || term.length < 2) {
      setStudentResults([])
      return
    }

    setSearchingStudents(true)
    try {
      const response = await fetch(`/api/admin/students?search=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setStudentResults(data.students || [])
      }
    } catch (err) {
      console.error('Failed to search students:', err)
    } finally {
      setSearchingStudents(false)
    }
  }

  const selectStudent = (student: Student) => {
    setFormData({ ...formData, studentId: student.id.toString() })
    setStudentSearchTerm(student.name)
    setStudentResults([])
  }

  const clearStudent = () => {
    setFormData({ ...formData, studentId: '' })
    setStudentSearchTerm('')
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchStudents(studentSearchTerm)
    }, 300)
    return () => clearTimeout(debounce)
  }, [studentSearchTerm])

  return (
    <div className="fixed inset-0 bg-brand-950/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-[2px]">
      <div className="bg-surface rounded-2xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-hidden border border-line flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line bg-surface flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-ink">Edit research details</h3>
            <p className="text-sm text-muted mt-1">Update research information and settings</p>
          </div>
          <button
            onClick={onClose}
            className="text-subtle hover:text-muted hover:bg-canvas rounded-lg p-1.5 transition-all duration-200"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-surface-muted">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
              <h4 className="text-lg font-bold text-ink mb-6 pb-2 border-b border-line">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink font-medium shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong resize-none bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  >
                    <option value="">None</option>
                    <option value="IGNITE">IGNITE</option>
                    <option value="ELEVATE">ELEVATE</option>
                    <option value="TRANSFORM">TRANSFORM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Domain
                  </label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                  >
                    <option value="">None</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Pre-Med/BIO/CHEM">Pre-Med/BIO/CHEM</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Law & Political Sciences">Law & Political Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Published Status
                  </label>
                  <div className="flex items-center gap-4 mt-3 bg-surface-muted rounded-lg p-3 border border-line">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        className="rounded border-line-strong text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer transition-transform hover:scale-110"
                      />
                      <span className="ml-3 text-sm font-medium text-ink-soft">Published</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Link to Student (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Search for student by name..."
                      className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                    />
                    {formData.studentId && (
                      <button
                        type="button"
                        onClick={clearStudent}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-subtle hover:text-muted hover:bg-surface-muted rounded-full p-1 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {searchingStudents && (
                    <div className="absolute z-10 w-full mt-2 bg-surface border border-line-strong rounded-lg shadow-lg p-3">
                      <p className="text-sm text-muted">Searching...</p>
                    </div>
                  )}
                  {studentResults.length > 0 && !formData.studentId && (
                    <div className="absolute z-10 w-full mt-2 bg-surface border border-line-strong rounded-2xl shadow-pop max-h-60 overflow-y-auto border border-line">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => selectStudent(student)}
                          className="w-full text-left px-4 py-3 hover:bg-brand-50 focus:bg-brand-50 focus:outline-none transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <p className="text-sm font-medium text-ink">{student.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Content */}
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-line">
              <h4 className="text-lg font-bold text-ink mb-6 pb-2 border-b border-line">Academic Content</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Abstract
                  </label>
                  <textarea
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong resize-none bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                    placeholder="Brief summary of the research..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:ring-4 focus:ring-brand-100 focus:border-brand-300 transition-all duration-200 text-ink shadow-sm hover:border-line-strong bg-surface shadow-card outline-none placeholder:text-subtle text-sm"
                    placeholder="science, environment, climate change"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-line bg-surface-muted flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 border border-line-strong rounded-lg text-ink-soft font-semibold hover:bg-white hover:shadow-md disabled:opacity-50 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 bg-brand-700 text-white font-semibold rounded-lg hover:bg-brand-800 disabled:opacity-50 shadow-card transition"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
