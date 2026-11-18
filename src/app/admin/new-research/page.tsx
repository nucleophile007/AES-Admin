"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import StudentAutocomplete from "@/components/ui/StudentAutocomplete"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Panel, buttonClass, cx, inputClass } from "@/components/admin/ui"

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
      toast.error(err.message)
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

  const fieldClass = cx(inputClass, "mt-1.5")
  const labelClass = "block text-sm font-medium text-ink-soft"
  const hint = "mt-1.5 text-xs text-muted"

  return (
    <AdminPageShell
      moduleId="research"
      title="Add Research"
      description="Enter the paper's details. You'll upload its PDFs on the next step."
      parent={{ label: "Research", href: "/admin/research" }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Steps */}
        <ol className="mb-5 flex items-center gap-3 text-sm">
          <li className="flex items-center gap-2 font-medium text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">1</span>
            Details
          </li>
          <li aria-hidden className="h-px w-10 bg-line-strong" />
          <li className="flex items-center gap-2 text-muted">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted ring-1 ring-inset ring-line-strong">2</span>
            Upload files
          </li>
        </ol>

        <Panel>
          <form onSubmit={handleSubmit}>
            <div className="space-y-8 p-6">
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">Paper</h2>
                <label className={labelClass}>
                  Research title <span className="text-rose-600">*</span>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={fieldClass}
                    placeholder="Cancer Detection using Nanosensors"
                    required
                  />
                </label>
                <label className={labelClass}>
                  Slug <span className="text-rose-600">*</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className={cx(fieldClass, "font-mono text-[13px]")}
                    required
                  />
                  <span className={cx(hint, "block font-normal")}>
                    Page address: <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-ink-soft ring-1 ring-inset ring-line">/research/{formData.slug || "slug"}</code>
                  </span>
                </label>
              </section>

              <section className="space-y-4 border-t border-line pt-6">
                <h2 className="text-sm font-semibold text-ink">Author</h2>
                <div>
                  <p className={labelClass}>Author name <span className="text-rose-600">*</span></p>
                  <div className="mt-1.5">
                    <StudentAutocomplete
                      value={formData.author}
                      onChange={(value) => setFormData({ ...formData, author: value })}
                      onStudentSelect={handleStudentSelect}
                      placeholder="Start typing student name…"
                      required
                    />
                  </div>
                  <p className={hint}>Pick a student to fill in their grade and school automatically.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className={labelClass}>
                    Grade {selectedStudent && <span className="font-normal text-brand-700">(auto-filled)</span>}
                    <input type="text" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className={fieldClass} placeholder="e.g. 10, 11, 12" />
                  </label>
                  <label className={labelClass}>
                    School {selectedStudent && <span className="font-normal text-brand-700">(auto-filled)</span>}
                    <input type="text" value={formData.school} onChange={(e) => setFormData({ ...formData, school: e.target.value })} className={fieldClass} placeholder="School name" />
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t border-line pt-6">
                <h2 className="text-sm font-semibold text-ink">Classification</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className={labelClass}>
                    Category <span className="font-normal text-subtle">(optional)</span>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={fieldClass}>
                      <option value="">Select category…</option>
                      <option value="IGNITE">IGNITE</option>
                      <option value="ELEVATE">ELEVATE</option>
                      <option value="TRANSFORM">TRANSFORM</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Domain <span className="font-normal text-subtle">(optional)</span>
                    <select value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} className={fieldClass}>
                      <option value="">Select domain…</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Pre-Med/BIO/CHEM">Pre-Med/BIO/CHEM</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Law & Political Sciences">Law & Political Sciences</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Research date <span className="text-rose-600">*</span>
                    <input type="date" value={formData.createdAt} onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })} className={fieldClass} required />
                  </label>
                </div>
                <label className={labelClass}>
                  Description <span className="font-normal text-subtle">(optional)</span>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                    placeholder="Short description shown on the research page"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-line bg-surface-muted/60 px-4 py-3 text-sm text-ink-soft">
                  <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="h-4 w-4 accent-brand-700" />
                  Published (visible on the website)
                </label>
              </section>
            </div>

            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-3">
              <Link href="/admin/research" className={buttonClass("secondary")}>Cancel</Link>
              <button type="submit" disabled={loading} className={buttonClass("primary")}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create and continue
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </AdminPageShell>
  )
}
