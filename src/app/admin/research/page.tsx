'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FileText, Image, Users, CheckCircle, XCircle, Eye, EyeOff, 
  Edit, Trash2, FolderOpen, Search, ArrowLeft 
} from 'lucide-react'
import { toast } from 'sonner'
import EditMetadataModal from '@/app/admin/research/EditMetadataModal'
import ManageSlidesDialog from '@/app/admin/research/ManageSlidesDialog'
import ManagePdfDialog from '@/app/admin/research/ManagePdfDialog'

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

export default function ResearchAdminPage() {
  const [research, setResearch] = useState<Research[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'IGNITE' | 'ELEVATE' | 'TRANSFORM'>('all')
  const [domainFilter, setDomainFilter] = useState<'all' | 'AI/ML' | 'Pre-Med/BIO/CHEM' | 'Engg' | 'Law & Political Sciences'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [editingResearch, setEditingResearch] = useState<Research | null>(null)
  const [managingSlidesId, setManagingSlidesId] = useState<string | null>(null)
  const [managingPdfId, setManagingPdfId] = useState<string | null>(null)

  useEffect(() => {
    fetchResearch()
  }, [])

  const fetchResearch = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/research')
      if (!response.ok) throw new Error('Failed to fetch research')
      const data = await response.json()
      setResearch(data.research)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch research')
      toast.error('Failed to load research')
    } finally {
      setLoading(false)
    }
  }

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/research/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update published status')

      const data = await response.json()
      setResearch(research.map(r => r.id === id ? { ...r, published: data.research.published } : r))
      toast.success(`Research ${data.research.published ? 'published' : 'unpublished'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const deleteResearch = async (item: Research) => {
    const warningMessage = item.published
      ? `⚠️ WARNING: This research is PUBLISHED and visible to users.\n\nAre you sure you want to delete "${item.title}"?\n\nThis will permanently delete:\n- The research entry\n- All ${item._count?.Slide || 0} slide images\n- The PDF file\n- All ${item._count?.AccessRequest || 0} access requests\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${item.title}"?\n\nThis will permanently delete:\n- The research entry\n- All ${item._count?.Slide || 0} slide images\n- The PDF file (if exists)\n- All ${item._count?.AccessRequest || 0} access requests\n\nThis action cannot be undone.`

    const confirmed = window.confirm(warningMessage)
    if (!confirmed) return

    const loadingToast = toast.loading('Deleting research...')

    try {
      const response = await fetch(`/api/admin/research/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete research')
      }

      setResearch(research.filter(r => r.id !== item.id))
      toast.success('Research deleted successfully', { id: loadingToast })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete research', { id: loadingToast })
    }
  }

  const handleEditComplete = (updatedResearch: Research) => {
    setResearch(research.map(r => r.id === updatedResearch.id ? updatedResearch : r))
    setEditingResearch(null)
  }

  const handleSlidesUpdated = () => {
    // Refresh the research list to get updated slide counts
    fetchResearch()
  }

  const handlePdfUpdated = () => {
    // Refresh the research list
    fetchResearch()
  }

  const filteredResearch = research.filter(r => {
    const categoryMatch = categoryFilter === 'all' || r.category === categoryFilter
    
    const domainMatch = domainFilter === 'all' || r.domain === domainFilter
    
    const searchMatch = searchTerm === '' || 
                       r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.school?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return categoryMatch && domainMatch && searchMatch
  })

  const stats = {
    total: research.length,
    published: research.filter(r => r.published).length,
    draft: research.filter(r => !r.published).length,
    totalSlides: research.reduce((sum, r) => sum + (r._count?.Slide || 0), 0),
    withPdf: research.filter(r => r.pdfFilename).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading research...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Management</h1>
              <p className="text-gray-600">Manage all research papers, slides, and PDFs</p>
            </div>
            <a
              href="/admin/new-research"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <FileText className="w-5 h-5" />
              Add New Research
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Research</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Slides</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSlides}</p>
              </div>
              <Image className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With PDF</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.withPdf}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    categoryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCategoryFilter('IGNITE')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    categoryFilter === 'IGNITE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  IGNITE
                </button>
                <button
                  onClick={() => setCategoryFilter('ELEVATE')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    categoryFilter === 'ELEVATE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ELEVATE
                </button>
                <button
                  onClick={() => setCategoryFilter('TRANSFORM')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    categoryFilter === 'TRANSFORM'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  TRANSFORM
                </button>
              </div>
            </div>

            {/* Domain Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDomainFilter('all')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    domainFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDomainFilter('AI/ML')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    domainFilter === 'AI/ML'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  AI/ML
                </button>
                <button
                  onClick={() => setDomainFilter('Pre-Med/BIO/CHEM')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    domainFilter === 'Pre-Med/BIO/CHEM'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pre-Med/BIO/CHEM
                </button>
                <button
                  onClick={() => setDomainFilter('Engg')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    domainFilter === 'Engg'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Engg
                </button>
                <button
                  onClick={() => setDomainFilter('Law & Political Sciences')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    domainFilter === 'Law & Political Sciences'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Law & Political Sciences
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Showing {filteredResearch.length} research paper{filteredResearch.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Research Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Research Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Requests
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResearch.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No research found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredResearch.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.author && `By ${item.author}`}
                            {item.grade && ` • Grade ${item.grade}`}
                            {item.school && ` • ${item.school}`}
                          </p>
                          {item.student && (
                            <p className="text-xs text-blue-600 mt-1">
                              Student: {item.student.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.category ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.category === 'IGNITE' ? 'bg-yellow-100 text-yellow-800' :
                            item.category === 'ELEVATE' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.domain ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {item.domain}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => togglePublished(item.id, item.published)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.published
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {item.published ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-900">
                              {item._count?.Slide || 0} slides
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-900">
                              {item.pdfFilename ? 'PDF' : 'No PDF'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">
                            {item._count?.AccessRequest || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingResearch(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit metadata"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setManagingSlidesId(item.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Manage slides"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setManagingPdfId(item.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Manage PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteResearch(item)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete research"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      {editingResearch && (
        <EditMetadataModal
          research={editingResearch}
          onClose={() => setEditingResearch(null)}
          onSave={handleEditComplete}
        />
      )}

      {managingSlidesId && (
        <ManageSlidesDialog
          researchId={managingSlidesId}
          onClose={() => setManagingSlidesId(null)}
          onUpdate={handleSlidesUpdated}
        />
      )}

      {managingPdfId && (
        <ManagePdfDialog
          researchId={managingPdfId}
          onClose={() => setManagingPdfId(null)}
          onUpdate={handlePdfUpdated}
        />
      )}
    </div>
  )
}
