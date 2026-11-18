"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, EyeOff, Globe, Link2, Loader2, Pencil, Plus, Search, Trash2, Upload, UserRound, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import AdminPageShell from "@/components/admin/AdminPageShell"
import { Badge, EmptyState, LoadingState, Panel, buttonClass, cx, inputClass } from "@/components/admin/ui"

interface Teacher {
  id: number
  name: string
  email: string
}

interface Mentor {
  id: number
  teacherId: number | null
  name: string
  role: string
  workplace: string
  education: string
  institution: string
  image: string
  experience: string | null
  specialties: string[]
  achievements: string[]
  bio: string
  isActive: boolean
  displayOrder: number
  department: string
  createdAt: string
  updatedAt: string
  teacher?: Teacher
}

export default function MentorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mentors, setMentors] = useState<Mentor[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    teacherId: "",
    name: "",
    role: "",
    workplace: "",
    education: "",
    institution: "",
    experience: "",
    specialties: [""],
    achievements: [""],
    bio: "",
    isActive: true,
    department: "engg-ai",
  })

  // Auth check
  useEffect(() => {
    console.log("👤 Page Auth Check:", {
      status,
      sessionEmail: session?.user?.email,
      role: (session?.user as any)?.role,
      isAdmin: (session?.user as any)?.role === 'admin'
    })

    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    // Check the role assigned by the server instead of checking email list on client
    if ((session.user as any).role !== 'admin') {
      console.log("❌ Access denied - not admin role, redirecting to /unauthorized")
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  // Fetch mentors and teachers
  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email) return
    if ((session.user as any).role !== 'admin') return

    fetchMentors()
    fetchTeachers()
  }, [session, status])

  const fetchMentors = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch("/api/admin/mentors")
      if (!res.ok) throw new Error("Failed to load mentors")
      const data = await res.json()
      setMentors(data.mentors || [])
    } catch (error) {
      console.error("Error fetching mentors:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/teachers")
      if (!res.ok) throw new Error("Failed to load teachers")
      const data = await res.json()
      setTeachers(data.teachers || [])
    } catch (error) {
      console.error("Error fetching teachers:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const submitData = new FormData()

      if (editingMentor) {
        submitData.append("id", editingMentor.id.toString())
      }

      submitData.append("teacherId", formData.teacherId)
      submitData.append("name", formData.name)
      submitData.append("role", formData.role)
      submitData.append("workplace", formData.workplace)
      submitData.append("education", formData.education)
      submitData.append("institution", formData.institution)
      submitData.append("experience", formData.experience)
      submitData.append("bio", formData.bio)
      submitData.append("isActive", formData.isActive.toString())
      submitData.append("department", formData.department)
      submitData.append("specialties", JSON.stringify(formData.specialties.filter(s => s.trim())))
      submitData.append("achievements", JSON.stringify(formData.achievements.filter(a => a.trim())))

      if (imageFile) {
        submitData.append("image", imageFile)
      }

      const res = await fetch("/api/admin/mentors", {
        method: editingMentor ? "PUT" : "POST",
        body: submitData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save mentor")
      }

      await fetchMentors(false)
      resetForm()
      toast.success(editingMentor ? "Mentor updated successfully!" : "Mentor added successfully!")
    } catch (error) {
      console.error("Error saving mentor:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save mentor")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (mentor: Mentor) => {
    setEditingMentor(mentor)
    setFormData({
      teacherId: mentor.teacherId?.toString() || "",
      name: mentor.name,
      role: mentor.role,
      workplace: mentor.workplace,
      education: mentor.education,
      institution: mentor.institution,
      experience: mentor.experience || "",
      specialties: mentor.specialties.length > 0 ? mentor.specialties : [""],
      achievements: mentor.achievements.length > 0 ? mentor.achievements : [""],
      bio: mentor.bio,
      isActive: mentor.isActive,
      department: mentor.department || "engg-ai",
    })
    setImagePreview(mentor.image)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mentor?")) return

    try {
      const res = await fetch(`/api/admin/mentors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete mentor")
      await fetchMentors(false)
      toast.success("Mentor deleted successfully!")
    } catch (error) {
      console.error("Error deleting mentor:", error)
      toast.error("Failed to delete mentor")
    }
  }

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/admin/mentors/${id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) throw new Error("Failed to reorder")
      await fetchMentors()
    } catch (error) {
      console.error("Error reordering:", error)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingMentor(null)
    setFormData({
      teacherId: "",
      name: "",
      role: "",
      workplace: "",
      education: "",
      institution: "",
      experience: "",
      specialties: [""],
      achievements: [""],
      bio: "",
      isActive: true,
      department: "engg-ai",
    })
    setImageFile(null)
    setImagePreview("")
  }

  const addArrayField = (field: 'specialties' | 'achievements') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const updateArrayField = (field: 'specialties' | 'achievements', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayField = (field: 'specialties' | 'achievements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  if (status !== 'loading' && !session) return null

  const DEPARTMENTS: Record<string, string> = {
    'engg-ai': 'Engineering & AI',
    'premed-bio-chem': 'Pre-Med / Bio / Chem',
    'law-humanities': 'Law & Humanities',
    'tech-creative-writing': 'Tech & Creative Writing',
    associate: 'Associate',
  }

  const filteredMentors = mentors.filter(m =>
    (departmentFilter === 'all' || m.department === departmentFilter) && (
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.workplace.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const departmentChip = (active: boolean) =>
    cx(
      'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition',
      active ? 'bg-brand-700 text-white shadow-card' : 'bg-surface-muted text-ink-soft ring-1 ring-inset ring-line hover:bg-canvas hover:text-ink',
    )

  return (
    <AdminPageShell
      moduleId="mentors"
      description="Manage the mentor profiles shown on the website's Our Team page."
      actions={
        <button
          type="button"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className={buttonClass('primary')}
        >
          <Plus className="h-4 w-4" /> Add mentor
        </button>
      }
    >
        <Panel className="mb-6">
          <div className="space-y-3 p-4">
            <label className="relative block">
              <span className="sr-only">Search mentors</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="Search by name, role or workplace…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cx(inputClass, 'pl-9')}
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Filter by department">
              <button type="button" onClick={() => setDepartmentFilter('all')} className={departmentChip(departmentFilter === 'all')}>
                All departments <span className="text-xs tabular-nums opacity-70">{mentors.length}</span>
              </button>
              {Object.entries(DEPARTMENTS).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setDepartmentFilter(value)} className={departmentChip(departmentFilter === value)}>
                  {label} <span className="text-xs tabular-nums opacity-70">{mentors.filter((m) => m.department === value).length}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {status === 'loading' || loading ? (
          <Panel><LoadingState label="Loading mentors…" /></Panel>
        ) : filteredMentors.length === 0 ? (
          <Panel>
            <EmptyState
              icon={UserRound}
              title={mentors.length ? 'No mentors match your filters' : 'No mentor profiles yet'}
              description={mentors.length ? 'Try a different name or department.' : 'Add a mentor to show them on the Our Team page.'}
            />
          </Panel>
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMentors.map((mentor, index) => (
              <div key={mentor.id} className={cx('group flex flex-col rounded-card border border-line bg-surface shadow-card transition hover:shadow-card-hover', !mentor.isActive && 'opacity-75')}>
                <div className="flex items-center justify-between px-3 pt-3">
                  <div className="inline-flex items-center rounded-lg border border-line bg-surface">
                    <button
                      type="button"
                      onClick={() => handleReorder(mentor.id, 'up')}
                      disabled={index === 0}
                      title="Move earlier"
                      aria-label={`Move ${mentor.name} earlier`}
                      className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted transition hover:bg-canvas hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <span className="border-x border-line px-1.5 font-mono text-[11px] text-subtle">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleReorder(mentor.id, 'down')}
                      disabled={index === filteredMentors.length - 1}
                      title="Move later"
                      aria-label={`Move ${mentor.name} later`}
                      className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted transition hover:bg-canvas hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => handleEdit(mentor)} title="Edit profile" aria-label={`Edit ${mentor.name}`} className={buttonClass('ghost', 'icon')}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(mentor.id)} title="Delete profile" aria-label={`Delete ${mentor.name}`} className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-2 text-center">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-surface-muted ring-4 ring-surface shadow-card">
                    {mentor.image ? (
                      <Image src={mentor.image} alt={mentor.name} width={80} height={80} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-subtle"><UserRound className="h-8 w-8" /></span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-ink">{mentor.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-brand-700">{mentor.role}</p>
                  <p className="mt-0.5 text-sm text-muted">{mentor.workplace}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-subtle">{[mentor.education, mentor.institution].filter(Boolean).join(' · ')}</p>
                  <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-4">
                    <Badge tone="violet">{DEPARTMENTS[mentor.department] ?? mentor.department}</Badge>
                    {mentor.isActive ? <Badge tone="emerald" icon={Globe}>On website</Badge> : <Badge tone="slate" icon={EyeOff}>Hidden</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
              {/* Fixed Header */}
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-ink">
                    {editingMentor ? 'Edit mentor profile' : 'Add new mentor'}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">This profile appears on the website's Our Team page.</p>
                </div>
                <button type="button" onClick={resetForm} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-5">
                  <form id="mentor-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="rounded-card border border-line bg-surface-muted/60 p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Upload className="h-4 w-4 text-muted" />
                        <div>
                          <h3 className="text-sm font-semibold text-ink">Profile image</h3>
                          <p className="text-sm text-muted">Upload a professional photo</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-6 md:flex-row">
                        <div className="flex-shrink-0">
                          {imagePreview ? (
                            <div className="h-28 w-28 overflow-hidden rounded-full bg-surface ring-4 ring-surface shadow-card">
                              <Image src={imagePreview} alt="Preview" width={128} height={128} className="object-cover w-full h-full" />
                            </div>
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface ring-1 ring-inset ring-line">
                              <UserRound className="h-12 w-12 text-subtle" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <label className={buttonClass('secondary', 'md', 'cursor-pointer')}>
                            <Upload className="h-4 w-4" />
                            {imagePreview ? 'Change image' : 'Choose image'}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>

                          <div className="space-y-0.5 text-xs text-muted">
                            <p>• Maximum file size: 5MB</p>
                            <p>• Recommended: Square image (500x500px or larger)</p>
                            <p>• Use a clear, professional headshot</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Selection */}
                    <div className="rounded-card border border-line bg-surface-muted/60 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted" />
                        <div>
                          <label className="text-sm font-semibold text-ink">Link to teacher account</label>
                          <p className="text-xs text-muted">Optional - Auto-fills name when selected</p>
                        </div>
                      </div>
                      <select
                        value={formData.teacherId}
                        onChange={(e) => {
                          const selectedId = e.target.value
                          setFormData(prev => ({ ...prev, teacherId: selectedId }))
                          if (selectedId) {
                            const teacher = teachers.find(t => t.id === Number(selectedId))
                            if (teacher && !editingMentor) {
                              setFormData(prev => ({ ...prev, name: teacher.name }))
                            }
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">Select a teacher (optional)</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-line pb-2">
                        <h3 className="text-sm font-semibold text-ink">Basic information</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-ink-soft">
                            Full Name <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={inputClass}
                            placeholder="Dr. John Doe"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-ink-soft">
                            Role/Title <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className={inputClass}
                            placeholder="Founder/CEO/Research Program Director"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-ink-soft">
                          Workplace <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.workplace}
                          onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                          className={inputClass}
                          placeholder="ACHARYA Educational Services"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-ink-soft">
                            Education/Degree <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.education}
                            onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                            className={inputClass}
                            placeholder="Ph.D. in Computer Science"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-ink-soft">
                            Institution <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.institution}
                            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                            className={inputClass}
                            placeholder="Indian Institute of Technology"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-ink-soft">Experience Summary</label>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                          className={inputClass}
                          placeholder="Research, Leadership & Educational Innovation"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-ink-soft">
                          Department <span className="text-rose-600">*</span>
                        </label>
                        <select
                          required
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className={inputClass}
                        >
                          <option value="engg-ai">Engineering & AI</option>
                          <option value="premed-bio-chem">Pre-Med / Bio / Chem</option>
                          <option value="law-humanities">Law & Humanities</option>
                          <option value="tech-creative-writing">Tech & Creative Writing</option>
                          <option value="associate">Associate</option>
                        </select>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="rounded-card border border-line bg-surface-muted/60 p-5">
                      <h4 className="mb-3 text-sm font-semibold text-ink">Specialties</h4>
                      <div className="space-y-2">
                        {formData.specialties.map((specialty, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={specialty}
                              onChange={(e) => updateArrayField('specialties', index, e.target.value)}
                              className={cx(inputClass, 'flex-1')}
                              placeholder="e.g., Mechanical Engineering, AI Research"
                            />
                            {formData.specialties.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('specialties', index)}
                                className="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('specialties')}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add Specialty
                        </button>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="rounded-card border border-line bg-surface-muted/60 p-5">
                      <h4 className="mb-3 text-sm font-semibold text-ink">Achievements</h4>
                      <div className="space-y-2">
                        {formData.achievements.map((achievement, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => updateArrayField('achievements', index, e.target.value)}
                              className={cx(inputClass, 'flex-1')}
                              placeholder="e.g., Founder & CEO, Published 50+ Papers"
                            />
                            {formData.achievements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('achievements', index)}
                                className="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('achievements')}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add Achievement
                        </button>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1 text-sm font-semibold text-ink">
                        Biography <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                        placeholder="Write a comprehensive biography describing the mentor's background, expertise, achievements, and passion for education..."
                      />
                      <p className="text-xs text-muted">
                        Provide a detailed overview of the mentor's professional journey and accomplishments
                      </p>
                    </div>

                    {/* Active Status */}
                    <div className="rounded-card border border-line bg-surface-muted/60 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="h-5 w-5 cursor-pointer rounded border-line-strong accent-brand-700"
                          />
                          <label htmlFor="isActive" className="cursor-pointer">
                            <div className="text-sm font-semibold text-ink">Publish profile</div>
                            <p className="text-sm text-muted">Make this mentor visible on the public website</p>
                          </label>
                        </div>
                        {formData.isActive ? <Badge tone="emerald" icon={Globe}>On website</Badge> : <Badge tone="slate" icon={EyeOff}>Hidden</Badge>}
                      </div>
                    </div>

                  </form>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-3">
                <button type="button" onClick={resetForm} className={buttonClass('secondary')}>Cancel</button>
                <button type="submit" form="mentor-form" disabled={formLoading || (!imageFile && !editingMentor)} className={buttonClass('primary')}>
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {formLoading ? 'Saving…' : editingMentor ? 'Update mentor' : 'Create mentor'}
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminPageShell>
  )
}
