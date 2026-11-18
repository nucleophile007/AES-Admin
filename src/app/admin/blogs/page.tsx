'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronDown, ExternalLink, EyeOff, FileText, Globe, ImageIcon, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass, selectClass } from '@/components/admin/ui'
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

  const fieldClass = cx(inputClass, 'mt-1.5')
  const labelClass = 'block text-sm font-medium text-ink-soft'
  const req = <span className="text-rose-600">*</span>

  return (
    <AdminPageShell
      moduleId="blogs"
      description="Manage student blog posts, approve them and choose what's published on the website."
      actions={
        <button type="button" onClick={() => setShowForm(true)} className={buttonClass('primary')}>
          <Plus className="h-4 w-4" /> Add blog
        </button>
      }
    >
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search blogs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Search by title or student…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block w-36">
              <span className="sr-only">Year</span>
              <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className={selectClass}>
                <option value="all">All years</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            </label>
            <Segmented
              label="Status"
              value={filters.status as 'all' | 'pending' | 'approved' | 'published'}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'all', label: 'All', count: stats.total },
                { value: 'pending', label: 'Pending', count: stats.pending },
                { value: 'approved', label: 'Approved', count: stats.approved },
                { value: 'published', label: 'Published', count: stats.published },
              ]}
            />
          </div>
        </div>

        {status === 'loading' || loading ? (
          <LoadingState label="Loading blogs…" />
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={blogs.length ? 'No blogs match your filters' : 'No blogs yet'}
            description={blogs.length ? 'Try a different search, year or status.' : 'Add a student blog to feature it on the website.'}
            action={!blogs.length ? (
              <button type="button" onClick={() => setShowForm(true)} className={buttonClass('primary', 'sm')}>
                <Plus className="h-3.5 w-3.5" /> Add blog
              </button>
            ) : undefined}
          />
        ) : (
          <ul className="divide-y divide-line">
            {filteredBlogs.map((blog) => (
              <li key={blog.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/40 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {blog.studentPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blog.studentPhoto} alt={blog.student?.name || 'Student'} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-surface shadow-card" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold uppercase text-violet-800 ring-1 ring-inset ring-violet-100">
                      {(blog.student?.name || '?').split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                    </span>
                  )}
                  <div className="min-w-0">
                    <a href={blog.externalUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1.5 font-semibold text-ink hover:text-brand-700">
                      <span>{blog.title}</span>
                      <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-subtle group-hover:text-brand-700" />
                    </a>
                    <p className="mt-0.5 text-sm text-muted">
                      <span className="font-medium text-ink-soft">{blog.student?.name || 'Unknown student'}</span>
                      {blog.student?.grade && <> · Grade {blog.student.grade}</>}
                      {blog.student?.schoolName && <> · {blog.student.schoolName}</>}
                      <> · {MONTHS[blog.publicationMonth - 1]} {blog.publicationYear}</>
                    </p>
                    {blog.abstract && <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-ink-soft">{blog.abstract}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {blog.isApproved ? <Badge tone="emerald" icon={CheckCircle2}>Approved</Badge> : <Badge tone="amber" dot>Pending approval</Badge>}
                      {blog.published ? <Badge tone="brand" icon={Globe}>Published</Badge> : <Badge tone="slate" icon={EyeOff}>Not published</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                  <button type="button" onClick={() => toggleApproval(blog)} className={buttonClass(blog.isApproved ? 'secondary' : 'success', 'sm')}>
                    {blog.isApproved ? <X className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {blog.isApproved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button type="button" onClick={() => togglePublished(blog)} className={buttonClass('secondary', 'sm')}>
                    {blog.published ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    {blog.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => handleEdit(blog)} title="Edit blog" aria-label={`Edit ${blog.title}`} className={buttonClass('ghost', 'icon')}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(blog)}
                    title="Delete blog"
                    aria-label={`Delete ${blog.title}`}
                    className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetForm()
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">{editingBlog ? 'Edit blog' : 'Add new blog'}</h2>
                <p className="mt-0.5 text-sm text-muted">Link a student's published blog post.</p>
              </div>
              <button type="button" onClick={resetForm} disabled={formLoading} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form id="blog-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className={labelClass}>Student {req}</p>
                  <div className="mt-1.5">
                    <StudentAutocomplete
                      value={formData.author}
                      onChange={(value) => setFormData({ ...formData, author: value })}
                      onStudentSelect={handleStudentSelect}
                      placeholder="Start typing student name…"
                      disabled={formLoading}
                      required
                    />
                  </div>
                  {selectedStudent && (
                    <p className="mt-1.5 text-xs text-muted">
                      Selected: {selectedStudent.name} · Grade {selectedStudent.grade} · {selectedStudent.schoolName}
                    </p>
                  )}
                </div>
                <div>
                  <p className={labelClass}>Student photo {req}</p>
                  <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface-muted/60 p-2 pr-4 transition hover:border-brand-300 hover:bg-brand-50/40">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-subtle ring-1 ring-inset ring-line">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                    )}
                    <span className="text-sm font-medium text-brand-700">{photoPreview ? 'Change photo' : 'Upload photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={formLoading}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <label className={labelClass}>
                Blog title {req}
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={fieldClass} placeholder="Enter blog title" disabled={formLoading} required />
              </label>

              <label className={labelClass}>
                Abstract {req}
                <textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                  placeholder="Brief summary of the blog (200–300 characters)"
                  disabled={formLoading}
                  required
                />
                <span className="mt-1 block text-right text-xs font-normal tabular-nums text-subtle">{formData.abstract.length} characters</span>
              </label>

              <label className={labelClass}>
                External blog URL {req}
                <input type="url" value={formData.externalUrl} onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })} className={fieldClass} placeholder="https://medium.com/@student/blog-post" disabled={formLoading} required />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className={labelClass}>
                  Publication year {req}
                  <select value={formData.publicationYear} onChange={(e) => setFormData({ ...formData, publicationYear: parseInt(e.target.value) })} className={fieldClass} disabled={formLoading} required>
                    {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  Publication month {req}
                  <select value={formData.publicationMonth} onChange={(e) => setFormData({ ...formData, publicationMonth: parseInt(e.target.value) })} className={fieldClass} disabled={formLoading} required>
                    {MONTHS.map((month, index) => <option key={index} value={index + 1}>{month}</option>)}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-line bg-surface-muted/60 px-4 py-3">
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={formData.isApproved} onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })} className="h-4 w-4 accent-brand-700" disabled={formLoading} />
                  Approved
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="h-4 w-4 accent-brand-700" disabled={formLoading} />
                  Published (visible on the website)
                </label>
              </div>
            </form>

            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-3">
              <button type="button" onClick={resetForm} disabled={formLoading} className={buttonClass('secondary')}>Cancel</button>
              <button type="submit" form="blog-form" disabled={formLoading} className={buttonClass('primary')}>
                {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {formLoading ? 'Saving…' : editingBlog ? 'Update blog' : 'Create blog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
