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
  pdfFilename: string | null
  student: Student | null
  _count: {
    Slide: number
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
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 via-slate-900/50 to-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Research Metadata</h3>
            <p className="text-sm text-gray-600 mt-1">Update research information and settings</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full p-2 transition-all duration-200"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-gray-50">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black font-medium shadow-sm hover:border-gray-400"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400 bg-white"
                  >
                    <option value="">None</option>
                    <option value="IGNITE">IGNITE</option>
                    <option value="ELEVATE">ELEVATE</option>
                    <option value="TRANSFORM">TRANSFORM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Domain
                  </label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400 bg-white"
                  >
                    <option value="">None</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Pre-Med/BIO/CHEM">Pre-Med/BIO/CHEM</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Law & Political Sciences">Law & Political Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Published Status
                  </label>
                  <div className="flex items-center gap-4 mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer transition-transform hover:scale-110"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">Published</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Link to Student (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Search for student by name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400"
                    />
                    {formData.studentId && (
                      <button
                        type="button"
                        onClick={clearStudent}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {searchingStudents && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  )}
                  {studentResults.length > 0 && !formData.studentId && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => selectStudent(student)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Academic Content</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Abstract
                  </label>
                  <textarea
                    value={formData.abstract}
                    onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400 resize-none"
                    placeholder="Brief summary of the research..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-black shadow-sm hover:border-gray-400"
                    placeholder="science, environment, climate change"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-white hover:shadow-md disabled:opacity-50 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
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
