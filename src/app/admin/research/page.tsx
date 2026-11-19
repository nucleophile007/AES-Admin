'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, FileText, FlaskConical, Pencil, Plus, Presentation, Search, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { Badge, EmptyState, LoadingState, Panel, buttonClass, cx, inputClass, type BadgeTone } from '@/components/admin/ui'
import EditMetadataModal from '@/app/admin/research/EditMetadataModal'
import ManagePdfDialog from '@/app/admin/research/ManagePdfDialog'
import ManagePresentationDialog from '@/app/admin/research/ManagePresentationDialog'

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
  pendingAccessRequestCount?: number
  student: Student | null
  _count: {
    AccessRequest: number
  }
}

export default function ResearchAdminPage() {
  const [research, setResearch] = useState<Research[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'IGNITE' | 'ELEVATE' | 'TRANSFORM'>('all')
  const [domainFilter, setDomainFilter] = useState<'all' | 'AI/ML' | 'Pre-Med/BIO/CHEM' | 'Engineering' | 'Law & Political Sciences'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [editingResearch, setEditingResearch] = useState<Research | null>(null)
  const [managingPdfId, setManagingPdfId] = useState<string | null>(null)
  const [managingPresentationId, setManagingPresentationId] = useState<string | null>(null)

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
      ? `⚠️ WARNING: This research is PUBLISHED and visible to users.\n\nAre you sure you want to delete "${item.title}"?\n\nThis will permanently delete:\n- The research entry\n- Presentation PDF (if exists)\n- Technical report PDF (if exists)\n- All ${item._count?.AccessRequest || 0} access requests\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${item.title}"?\n\nThis will permanently delete:\n- The research entry\n- Presentation PDF (if exists)\n- Technical report PDF (if exists)\n- All ${item._count?.AccessRequest || 0} access requests\n\nThis action cannot be undone.`

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
    withPresentation: research.filter(r => r.presentationPdfFilename).length,
    withPdf: research.filter(r => r.pdfFilename).length,
  }

  const CATEGORY_TONE: Record<string, BadgeTone> = { IGNITE: 'amber', ELEVATE: 'brand', TRANSFORM: 'violet' }
  const filterChip = (active: boolean) =>
    cx(
      'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition',
      active ? 'bg-brand-700 text-white shadow-card' : 'bg-surface-muted text-ink-soft ring-1 ring-inset ring-line hover:bg-canvas hover:text-ink',
    )
  const CATEGORIES = ['IGNITE', 'ELEVATE', 'TRANSFORM'] as const
  const DOMAINS = ['AI/ML', 'Pre-Med/BIO/CHEM', 'Engineering', 'Law & Political Sciences'] as const

  return (
    <AdminPageShell
      moduleId="research"
      description="Manage research papers, their presentation and report PDFs, and access requests."
      actions={
        <Link href="/admin/new-research" className={buttonClass('primary')}>
          <Plus className="h-4 w-4" /> Add research
        </Link>
      }
    >
        {error && (
          <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        )}

        <Panel className="overflow-hidden">
          <div className="space-y-3 border-b border-line p-4">
            <label className="relative block">
              <span className="sr-only">Search research</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                placeholder="Search by title, author or school…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cx(inputClass, 'pl-9')}
              />
            </label>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Category">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-subtle">Category</span>
                <button type="button" onClick={() => setCategoryFilter('all')} className={filterChip(categoryFilter === 'all')}>All</button>
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={filterChip(categoryFilter === c)}>{c}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Domain">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.06em] text-subtle">Domain</span>
                <button type="button" onClick={() => setDomainFilter('all')} className={filterChip(domainFilter === 'all')}>All</button>
                {DOMAINS.map((d) => (
                  <button key={d} type="button" onClick={() => setDomainFilter(d)} className={filterChip(domainFilter === d)}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          {!loading && (
            <div className="flex items-center justify-between border-b border-line bg-surface-muted/60 px-5 py-2 text-xs text-muted">
              <span>
                Showing <span className="font-semibold text-ink">{filteredResearch.length}</span> of {stats.total} papers · {stats.published} published · {stats.draft} drafts
              </span>
            </div>
          )}

          {loading ? (
            <LoadingState label="Loading research…" />
          ) : filteredResearch.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title={research.length ? 'No research matches your filters' : 'No research yet'}
              description={research.length ? 'Try a different search, category or domain.' : 'Add a research paper to get started.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                    <th className="px-5 py-3">Research</th>
                    <th className="px-4 py-3">Category · Domain</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Files</th>
                    <th className="px-4 py-3">Access</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredResearch.map((item) => {
                    const pending = item.pendingAccessRequestCount || 0
                    return (
                      <tr key={item.id} className="align-top transition-colors hover:bg-surface-muted/60">
                        <td className="max-w-[360px] px-5 py-4">
                          <p className="font-medium leading-snug text-ink">{item.title}</p>
                          <p className="mt-1 text-xs text-muted">
                            {[item.author && `By ${item.author}`, item.grade && `Grade ${item.grade}`, item.school].filter(Boolean).join(' · ')}
                          </p>
                          {item.student && <p className="mt-0.5 text-xs text-brand-700">Student account: {item.student.name}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex max-w-[200px] flex-col items-start gap-1.5">
                            {item.category ? <Badge tone={CATEGORY_TONE[item.category] ?? 'slate'}>{item.category}</Badge> : <span className="text-xs text-subtle">No category</span>}
                            {item.domain ? <Badge tone="slate">{item.domain}</Badge> : <span className="text-xs text-subtle">No domain</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => togglePublished(item.id, item.published)}
                            title={item.published ? 'Published. Click to unpublish.' : 'Draft. Click to publish.'}
                            className={cx(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition',
                              item.published ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100' : 'bg-surface-muted text-ink-soft ring-line hover:bg-canvas',
                            )}
                          >
                            {item.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            {item.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-xs">
                            <p className={cx('flex items-center gap-1.5', item.presentationPdfFilename ? 'text-ink-soft' : 'text-subtle')}>
                              <Presentation className="h-3.5 w-3.5" />
                              {item.presentationPdfFilename ? 'Presentation' : 'No presentation'}
                            </p>
                            <p className={cx('flex items-center gap-1.5', item.pdfFilename ? 'text-ink-soft' : 'text-subtle')}>
                              <FileText className="h-3.5 w-3.5" />
                              {item.pdfFilename ? 'Report PDF' : 'No report PDF'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/research/${item.id}/access-requests`}
                            title="View access requests"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-ink-soft transition hover:bg-canvas hover:text-ink"
                          >
                            <Users className="h-4 w-4 text-muted" />
                            <span className="tabular-nums">{item._count?.AccessRequest || 0}</span>
                            {pending > 0 && <Badge tone="rose">{pending} new</Badge>}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => setEditingResearch(item)} title="Edit details" aria-label={`Edit ${item.title}`} className={buttonClass('ghost', 'icon')}>
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setManagingPresentationId(item.id)} title="Manage presentation PDF" aria-label="Manage presentation PDF" className={buttonClass('ghost', 'icon')}>
                              <Presentation className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setManagingPdfId(item.id)} title="Manage report PDF" aria-label="Manage report PDF" className={buttonClass('ghost', 'icon')}>
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteResearch(item)} title="Delete research" aria-label={`Delete ${item.title}`} className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

      {/* Modals */}
      {editingResearch && (
        <EditMetadataModal
          research={editingResearch}
          onClose={() => setEditingResearch(null)}
          onSave={handleEditComplete}
        />
      )}

      {managingPdfId && (
        <ManagePdfDialog
          researchId={managingPdfId}
          onClose={() => setManagingPdfId(null)}
          onUpdate={handlePdfUpdated}
        />
      )}

      {managingPresentationId && (
        <ManagePresentationDialog
          researchId={managingPresentationId}
          onClose={() => setManagingPresentationId(null)}
          onUpdate={handlePdfUpdated}
        />
      )}
    </AdminPageShell>
  )
}
