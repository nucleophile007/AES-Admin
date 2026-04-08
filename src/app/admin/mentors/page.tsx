"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, User, Plus, Edit, Trash2, Loader2, Upload, X, MoveUp, MoveDown } from "lucide-react"
import Image from "next/image"

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

  const fetchMentors = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/mentors")
      if (!res.ok) throw new Error("Failed to load mentors")
      const data = await res.json()
      setMentors(data.mentors || [])
    } catch (error) {
      console.error("Error fetching mentors:", error)
    } finally {
      setLoading(false)
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
        alert("Image size must be less than 5MB")
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

      await fetchMentors()
      resetForm()
      alert(editingMentor ? "Mentor updated successfully!" : "Mentor added successfully!")
    } catch (error) {
      console.error("Error saving mentor:", error)
      alert(error instanceof Error ? error.message : "Failed to save mentor")
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
      await fetchMentors()
      alert("Mentor deleted successfully!")
    } catch (error) {
      console.error("Error deleting mentor:", error)
      alert("Failed to delete mentor")
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

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) return null

  const filteredMentors = mentors.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.workplace.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mentor Management</h1>
                <p className="text-sm text-gray-700">Manage mentor profiles and information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Add Mentor
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search mentors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredMentors.map((mentor, index) => (
            <div key={mentor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <button onClick={() => handleReorder(mentor.id, 'up')} className="p-1 hover:bg-gray-100 rounded">
                      <MoveUp className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                  {index < filteredMentors.length - 1 && (
                    <button onClick={() => handleReorder(mentor.id, 'down')} className="p-1 hover:bg-gray-100 rounded">
                      <MoveDown className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(mentor)} className="p-2 hover:bg-gray-100 rounded">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(mentor.id)} className="p-2 hover:bg-gray-100 rounded">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {mentor.image && (
                    <Image src={mentor.image} alt={mentor.name} width={96} height={96} className="object-cover" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{mentor.name}</h3>
                <p className="text-sm text-purple-600 font-medium mb-1">{mentor.role}</p>
                <p className="text-sm text-yellow-600 italic mb-2">{mentor.workplace}</p>
                <p className="text-xs text-gray-600 mb-1">{mentor.education}</p>
                <p className="text-xs text-gray-500 mb-3">{mentor.institution}</p>
                <div className={`px-3 py-1 rounded-full text-xs ${mentor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {mentor.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-gray-200 flex flex-col">
              {/* Fixed Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">
                      {editingMentor ? 'Edit Mentor Profile' : 'Add New Mentor'}
                    </h2>
                    <p className="text-gray-300 text-sm">Create a comprehensive mentor profile</p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload */}
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      <div className="flex items-center gap-2 mb-6">
                        <Upload className="h-5 w-5 text-gray-700" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Profile Image</h3>
                          <p className="text-sm text-gray-600">Upload a professional photo</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0">
                          {imagePreview ? (
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-white ring-2 ring-gray-300 shadow-sm">
                              <Image src={imagePreview} alt="Preview" width={128} height={128} className="object-cover w-full h-full" />
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center ring-2 ring-gray-300 shadow-sm">
                              <User className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <label className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors font-medium">
                            <Upload className="h-4 w-4" />
                            Choose Image
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p>• Maximum file size: 5MB</p>
                            <p>• Recommended: Square image (500x500px or larger)</p>
                            <p>• Use a clear, professional headshot</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Selection */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-4 w-4 text-gray-700" />
                        <div>
                          <label className="text-sm font-semibold text-gray-900">Link to Teacher</label>
                          <p className="text-xs text-gray-600">Optional - Auto-fills name when selected</p>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all text-gray-900"
                      >
                        <option value="">Select a teacher (optional)</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>
                        ))}
                      </select>
                    </div>

                    {/* Basic Info Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                            placeholder="Dr. John Doe"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Role/Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                            placeholder="Founder/CEO/Research Program Director"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Workplace <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.workplace}
                          onChange={(e) => setFormData(prev => ({ ...prev, workplace: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                          placeholder="ACHARYA Educational Services"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Education/Degree <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.education}
                            onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                            placeholder="Ph.D. in Computer Science"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Institution <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.institution}
                            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                            placeholder="Indian Institute of Technology"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Experience Summary</label>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-900"
                          placeholder="Research, Leadership & Educational Innovation"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white text-gray-900"
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
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Specialties</h4>
                      <div className="space-y-3">
                        {formData.specialties.map((specialty, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={specialty}
                              onChange={(e) => updateArrayField('specialties', index, e.target.value)}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all text-gray-900"
                              placeholder="e.g., Mechanical Engineering, AI Research"
                            />
                            {formData.specialties.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('specialties', index)}
                                className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('specialties')}
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-all w-full justify-center"
                        >
                          <Plus className="h-4 w-4" />
                          Add Specialty
                        </button>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Achievements</h4>
                      <div className="space-y-3">
                        {formData.achievements.map((achievement, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => updateArrayField('achievements', index, e.target.value)}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all text-gray-900"
                              placeholder="e.g., Founder & CEO, Published 50+ Papers"
                            />
                            {formData.achievements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeArrayField('achievements', index)}
                                className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addArrayField('achievements')}
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-all w-full justify-center"
                        >
                          <Plus className="h-4 w-4" />
                          Add Achievement
                        </button>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-3">
                      <label className="text-base font-semibold text-gray-900 flex items-center gap-1">
                        Biography <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all resize-none text-gray-900"
                        placeholder="Write a comprehensive biography describing the mentor's background, expertise, achievements, and passion for education..."
                      />
                      <p className="text-xs text-gray-500">
                        Provide a detailed overview of the mentor's professional journey and accomplishments
                      </p>
                    </div>

                    {/* Active Status */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="w-5 h-5 text-gray-900 focus:ring-gray-900 border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor="isActive" className="cursor-pointer">
                            <div className="font-semibold text-gray-900">Publish Profile</div>
                            <p className="text-sm text-gray-600">Make this mentor visible on the public website</p>
                          </label>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full font-medium text-sm ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={formLoading || (!imageFile && !editingMentor)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {formLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>{editingMentor ? 'Update Mentor' : 'Create Mentor'}</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
