"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react"
import StudentAutocomplete from "@/components/ui/StudentAutocomplete"

export default function NewResearchPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    grade: "",
    school: "",
    category: "",
    domain: "",
    createdAt: new Date().toISOString().split('T')[0], // Default to today
    description: "",
    published: true,
  })

  const [selectedStudent, setSelectedStudent] = useState<{
    id: number
    name: string
    grade: string
    schoolName: string
  } | null>(null)

  const [loading, setLoading] = useState(false)

  // 🔹 Auto-generate slug from title
  useEffect(() => {
    if (!formData.title) return

    const generatedSlug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")

    setFormData((prev) => ({
      ...prev,
      slug: generatedSlug,
    }))
  }, [formData.title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/admin/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          author: formData.author,
          grade: formData.grade || null,
          school: formData.school || null,
          category: formData.category || null,
          domain: formData.domain || null,
          createdAt: formData.createdAt,
          studentId: selectedStudent?.id || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create research")
      }

      const created = await res.json()

      router.push(`/admin/research/${created.research.id}/upload`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (student: any) => {
    if (student) {
      setSelectedStudent(student)
      setFormData((prev) => ({
        ...prev,
        author: student.name,
        grade: student.grade,
        school: student.schoolName,
      }))
    } else {
      setSelectedStudent(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/research"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Research
              </h1>
              <p className="text-sm text-gray-600">
                Add research metadata before uploading files
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                placeholder="Cancer Detection using Nanosensors"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                URL: <code>/research/{formData.slug || "slug"}</code>
              </p>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Name *
              </label>
              <StudentAutocomplete
                value={formData.author}
                onChange={(value) => setFormData({ ...formData, author: value })}
                onStudentSelect={handleStudentSelect}
                placeholder="Start typing student name..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Type to search for students. Grade & school auto-fill if found.
              </p>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade {selectedStudent && <span className="text-blue-600">(auto-filled)</span>}
              </label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10, 11, 12"
              />
            </div>

            {/* School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School {selectedStudent && <span className="text-blue-600">(auto-filled)</span>}
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) =>
                  setFormData({ ...formData, school: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                placeholder="School name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                <option value="IGNITE">IGNITE</option>
                <option value="ELEVATE">ELEVATE</option>
                <option value="TRANSFORM">TRANSFORM</option>
              </select>
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain (optional)
              </label>
              <select
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select domain...</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Pre-Med/BIO/CHEM">Pre-Med/BIO/CHEM</option>
                <option value="Engg">Engg</option>
                <option value="Law & Political Sciences">Law & Political Sciences</option>
              </select>
            </div>

            {/* Research Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Research Date *
              </label>
              <input
                type="date"
                value={formData.createdAt}
                onChange={(e) =>
                  setFormData({ ...formData, createdAt: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Set the research creation/publication date
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Short description shown on research page"
              />
            </div>

            {/* Published */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700">
                Published (visible on site)
              </span>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Research
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
