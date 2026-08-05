'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StudentAutocomplete from '@/components/ui/StudentAutocomplete'
import { toast } from 'sonner'

interface Student {
  id: number
  name: string
  email: string
  grade: string
  graduationYear?: number | null
  schoolName: string
}

interface Blog {
  id: number
  title: string
  abstract: string
  externalUrl: string
  studentId: number | null
  studentPhoto: string | null
  publicationYear: number
  publicationMonth: number
  isApproved: boolean
  published: boolean
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  student: Student | null
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i) // 2020-2035

export default function BlogsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    year: 'all',
    status: 'all',
    search: '',
  })

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    externalUrl: '',
    author: '',
    publicationYear: new Date().getFullYear(),
    publicationMonth: new Date().getMonth() + 1,
    isApproved: false,
    published: false,
  })

  const [selectedStudent, setSelectedStudent] = useState<{
    id: number
    name: string
    grade: string
    schoolName: string
  } | null>(null)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user?.role !== 'admin') {
      router.push('/unauthorized')
    }
  }, [session, status, router])

  // Fetch blogs
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchBlogs()
    }
  }, [session])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/blogs')
      if (!response.ok) throw new Error('Failed to fetch blogs')
      const data = await response.json()
      setBlogs(data)
    } catch (error) {
      toast.error('Failed to fetch blogs: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return uploadedPhotoUrl

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', photoFile)

      const response = await fetch('/api/admin/blogs/upload-photo', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload photo')
      }

      const result = await response.json()
      return result.fileUrl
    } catch (error) {
      throw new Error('Photo upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title || !formData.abstract || !formData.externalUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedStudent) {
      toast.error('Please select a student')
      return
    }

    if (!photoFile && !editingBlog?.studentPhoto) {
      toast.error('Please upload a student photo')
      return
    }

    setFormLoading(true)

    try {
      // Upload photo if new file selected
      let photoUrl = editingBlog?.studentPhoto || null
      if (photoFile) {
        photoUrl = await uploadPhoto()
      }

      const blogData = {
        title: formData.title,
        abstract: formData.abstract,
        externalUrl: formData.externalUrl,
        studentId: selectedStudent.id,
        studentPhoto: photoUrl,
        publicationYear: formData.publicationYear,
        publicationMonth: formData.publicationMonth,
        isApproved: formData.isApproved,
        published: formData.published,
      }

      const url = editingBlog 
        ? `/api/admin/blogs/${editingBlog.id}`
        : '/api/admin/blogs'
      
      const method = editingBlog ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save blog')
      }

      await fetchBlogs()
      resetForm()
      toast.success(`Blog ${editingBlog ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save blog')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title,
      abstract: blog.abstract,
      externalUrl: blog.externalUrl,
      author: blog.student?.name || '',
      publicationYear: blog.publicationYear,
      publicationMonth: blog.publicationMonth,
      isApproved: blog.isApproved,
      published: blog.published,
    })
    if (blog.student) {
      setSelectedStudent({
        id: blog.student.id,
        name: blog.student.name,
        grade: blog.student.grade,
        schoolName: blog.student.schoolName,
      })
    }
    setUploadedPhotoUrl(blog.studentPhoto)
    setPhotoPreview(blog.studentPhoto)
    setShowForm(true)
  }

  const handleDelete = async (blog: Blog) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the blog "${blog.title}" by ${blog.student?.name}?\n\n` +
      `This will NOT delete the student record.\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete blog')
      }

      setBlogs(blogs.filter(b => b.id !== blog.id))
      toast.success('Blog deleted successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog')
    }
  }

  const toggleApproval = async (blog: Blog) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !blog.isApproved }),
      })

      if (!response.ok) throw new Error('Failed to update approval status')

      await fetchBlogs()
      toast.success('Approval status updated successfully')
    } catch (error) {
      toast.error('Failed to update approval status')
    }
  }

  const togglePublished = async (blog: Blog) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !blog.published }),
      })

      if (!response.ok) throw new Error('Failed to update published status')

      await fetchBlogs()
      toast.success('Published status updated successfully')
    } catch (error) {
      toast.error('Failed to update published status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      abstract: '',
      externalUrl: '',
      author: '',
      publicationYear: new Date().getFullYear(),
      publicationMonth: new Date().getMonth() + 1,
      isApproved: false,
      published: false,
    })
    setSelectedStudent(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setUploadedPhotoUrl(null)
    setEditingBlog(null)
    setShowForm(false)
  }

  const handleStudentSelect = (student: any) => {
    if (student) {
      setSelectedStudent(student)
      setFormData((prev) => ({
        ...prev,
        author: student.name,
      }))
    } else {
      setSelectedStudent(null)
    }
  }

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const yearMatch = filters.year === 'all' || blog.publicationYear.toString() === filters.year
    const statusMatch = filters.status === 'all' || 
                       (filters.status === 'approved' && blog.isApproved) ||
                       (filters.status === 'pending' && !blog.isApproved) ||
                       (filters.status === 'published' && blog.published)
    const searchMatch = filters.search === '' ||
                       blog.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                       blog.student?.name.toLowerCase().includes(filters.search.toLowerCase())
    
    return yearMatch && statusMatch && searchMatch
  })

  // Statistics
  const stats = {
    total: blogs.length,
    approved: blogs.filter(b => b.isApproved).length,
    pending: blogs.filter(b => !b.isApproved).length,
    published: blogs.filter(b => b.published).length,
  }

  // Get unique years from blogs
  const availableYears = Array.from(new Set(blogs.map(b => b.publicationYear))).sort((a, b) => b - a)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AES Student Blogs</h1>
          <p className="text-gray-600">Manage student blog posts and external links</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Blogs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-bold text-blue-600">{stats.published}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by title or student..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
            </select>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Add New Blog
            </Button>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abstract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No blogs found. Click "Add New Blog" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {blog.studentPhoto && (
                            <img
                              src={blog.studentPhoto}
                              alt={blog.student?.name || 'Student'}
                              className="w-12 h-12 rounded-full object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {blog.student?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {blog.student?.grade} • {blog.student?.schoolName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {blog.abstract}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {MONTHS[blog.publicationMonth - 1]} {blog.publicationYear}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            blog.isApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.isApproved ? 'Approved' : 'Pending'}
                          </span>
                          {blog.published && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Published
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          <a
                            href={blog.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 text-left"
                          >
                            View Blog ↗
                          </a>
                          <button
                            onClick={() => handleEdit(blog)}
                            className="text-indigo-600 hover:text-indigo-900 text-left"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleApproval(blog)}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            {blog.isApproved ? 'Unapprove' : 'Approve'}
                          </button>
                          <button
                            onClick={() => togglePublished(blog)}
                            className="text-purple-600 hover:text-purple-900 text-left"
                          >
                            {blog.published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(blog)}
                            className="text-red-600 hover:text-red-900 text-left"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetForm()
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBlog ? 'Edit Blog' : 'Add New Blog'}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
                disabled={formLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student <span className="text-red-500">*</span>
                </label>
                <StudentAutocomplete
                  value={formData.author}
                  onChange={(value) => setFormData({ ...formData, author: value })}
                  onStudentSelect={handleStudentSelect}
                  placeholder="Start typing student name..."
                  disabled={formLoading}
                  required
                />
                {selectedStudent && (
                  <p className="mt-1 text-sm text-gray-500">
                    Selected: {selectedStudent.name} • Grade {selectedStudent.grade} • {selectedStudent.schoolName}
                  </p>
                )}
              </div>

              {/* Student Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={formLoading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mt-2 w-24 h-24 rounded-full object-cover"
                  />
                )}
              </div>

              {/* Blog Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blog Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog title"
                  disabled={formLoading}
                  required
                />
              </div>

              {/* Abstract */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abstract <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief summary of the blog (200-300 characters)"
                  disabled={formLoading}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.abstract.length} characters
                </p>
              </div>

              {/* External URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External Blog URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                  placeholder="https://medium.com/@student/blog-post"
                  disabled={formLoading}
                  required
                />
              </div>

              {/* Publication Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.publicationYear}
                    onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                    disabled={formLoading}
                    required
                  >
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publication Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.publicationMonth}
                    onChange={(e) => setFormData({ ...formData, publicationMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                    disabled={formLoading}
                    required
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                    className="h-4 w-4"
                    disabled={formLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Approved</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="h-4 w-4"
                    disabled={formLoading}
                  />
                  <span className="ml-2 text-gray-700">Published (visible on site)</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {formLoading ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
