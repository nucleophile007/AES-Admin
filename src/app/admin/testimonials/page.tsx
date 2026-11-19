'use client'

import React, { useEffect, useState } from 'react'
import { Check, CheckCircle2, ChevronDown, ChevronsDownUp, ChevronsUpDown, Circle, Eye, Loader2, MessageSquareQuote, Pencil, RefreshCw, Search, Star, Trash2, User, Users, Video, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { Badge, EmptyState, LoadingState, Panel, Segmented, buttonClass, cx, inputClass } from '@/components/admin/ui'

interface Student {
  id: number
  name: string
  email: string
  grade: string
  graduationYear?: number | null
  schoolName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  program: string
}

interface Testimonial {
  id: number
  content: string
  authorType: string
  authorName: string
  isApproved: boolean
  isVisible: boolean
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  studentName: string | null
  grade: string | null
  school: string | null
  programs: string[]
  rating: number | null
  beforeExpectations: string | null
  afterChanges: string | null
  successStory: string | null
  consentToFeature: boolean
  videoLink: string | null
  contentApproved: boolean
  ratingApproved: boolean
  beforeAfterApproved: boolean
  successStoryApproved: boolean
  programsApproved: boolean
  student: Student
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [authorFilter, setAuthorFilter] = useState<'all' | 'student' | 'parent'>('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Auto-sync on page load, then fetch testimonials
    syncFromSheet()
  }, [])

  const syncFromSheet = async () => {
    try {
      setSyncing(true)
      setSyncMessage('')
      
      const response = await fetch('/api/admin/testimonials/sync', {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to sync from Google Sheets')
      
      const result = await response.json()
      
      if (result.stats) {
        const { imported, skipped, errors } = result.stats
        setSyncMessage(`Synced: ${imported} imported, ${skipped} skipped, ${errors} errors`)
      }
      
      // After syncing, fetch the updated testimonials
      await fetchTestimonials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/testimonials')
      if (!response.ok) throw new Error('Failed to fetch testimonials')
      const data = await response.json()
      setTestimonials(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }


  const toggleApproval = async (testimonialId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialId,
          isApproved: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update testimonial')

      const data = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, isApproved: !currentStatus } : t
      ))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update testimonial')
    }
  }

  const toggleVisibility = async (testimonialId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testimonialId,
          isVisible: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update testimonial visibility')

      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, isVisible: !currentStatus } : t
      ))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update testimonial visibility')
    }
  }

  const toggleSectionApproval = async (testimonialId: number, section: string) => {
    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}/toggle-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      })

      if (!response.ok) throw new Error('Failed to toggle section approval')

      const data = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === testimonialId ? { ...t, [section]: data[section] } : t
      ))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle section approval')
    }
  }

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setEditFormData({
      content: testimonial.content || '',
      authorName: testimonial.authorName || '',
      authorType: testimonial.authorType || 'student',
      studentName: testimonial.studentName || '',
      grade: testimonial.grade || '',
      school: testimonial.school || '',
      programs: testimonial.programs?.join(', ') || '',
      rating: testimonial.rating || '',
      beforeExpectations: testimonial.beforeExpectations || '',
      afterChanges: testimonial.afterChanges || '',
      successStory: testimonial.successStory || '',
      videoLink: testimonial.videoLink || '',
    })
  }

  const closeEditModal = () => {
    setEditingTestimonial(null)
    setEditFormData({})
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTestimonial) return

    try {
      setSaving(true)
      
      // Process programs array
      const programsArray = editFormData.programs
        ? editFormData.programs.split(',').map((p: string) => p.trim()).filter(Boolean)
        : []

      // Build update payload
      const updatePayload: any = {
        testimonialId: editingTestimonial.id,
        content: editFormData.content,
        authorName: editFormData.authorName,
        authorType: editFormData.authorType,
        studentName: editFormData.studentName,
        grade: editFormData.grade,
        school: editFormData.school,
        programs: programsArray,
        rating: editFormData.rating ? parseInt(editFormData.rating) : null,
        beforeExpectations: editFormData.beforeExpectations,
        afterChanges: editFormData.afterChanges,
        successStory: editFormData.successStory,
        videoLink: editFormData.videoLink,
      }

      const response = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) throw new Error('Failed to update testimonial')

      const result = await response.json()
      
      // Update local state
      setTestimonials(testimonials.map(t =>
        t.id === editingTestimonial.id ? { ...t, ...result.testimonial, student: t.student } : t
      ))
      
      closeEditModal()
      toast.success('Testimonial updated successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update testimonial')
    } finally {
      setSaving(false)
    }
  }

  const deleteTestimonial = async (testimonialId: number, authorName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the testimonial from ${authorName}?\n\nNote: This will only delete from the database. You'll need to manually delete the row from the Google Sheet.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/testimonials?id=${testimonialId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete testimonial')

      // Update local state by removing the deleted testimonial
      setTestimonials(testimonials.filter(t => t.id !== testimonialId))
      
      toast.success('Testimonial deleted successfully. Please remember to delete the corresponding row from the Google Sheet.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete testimonial')
    }
  }

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const viewFullContent = (title: string, content: string) => {
    setViewingContent({ title, content })
  }

  const filteredTestimonials = testimonials.filter(t => {
    const statusMatch = filter === 'all' || 
                       (filter === 'approved' && t.isApproved) ||
                       (filter === 'pending' && !t.isApproved)
    
    const authorMatch = authorFilter === 'all' || t.authorType === authorFilter
    
    return statusMatch && authorMatch
  })

  const stats = {
    total: testimonials.length,
    approved: testimonials.filter(t => t.isApproved).length,
    pending: testimonials.filter(t => !t.isApproved).length,
    fromStudents: testimonials.filter(t => t.authorType === 'student').length,
    // fromParents: testimonials.filter(t => t.authorType === 'parent').length,
  }

  const q = search.trim().toLowerCase()
  const visibleTestimonials = q
    ? filteredTestimonials.filter((t) =>
        [t.authorName, t.studentName ?? '', t.student?.schoolName ?? '', t.student?.grade ?? '', t.content ?? '', ...(t.programs || [])]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : filteredTestimonials
  const allOpen = visibleTestimonials.length > 0 && visibleTestimonials.every((t) => expandedRows.has(t.id))

  const fieldClass = cx(inputClass, 'mt-1.5')
  const areaClass =
    'mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100'
  const labelClass = 'block text-sm font-medium text-ink-soft'

  /** Per-section switch: whether this part of the testimonial may appear on the website. */
  const SectionToggle = ({ id, field, on }: { id: number; field: string; on: boolean }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleSectionApproval(id, field)
      }}
      title={on ? 'Shown on the website. Click to hide.' : 'Hidden from the website. Click to approve.'}
      className={cx(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset transition',
        on ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100' : 'bg-surface text-muted ring-line hover:text-ink',
      )}
    >
      {on ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {on ? 'On site' : 'Hidden'}
    </button>
  )

  return (
    <AdminPageShell
      moduleId="testimonials"
      description="Review student testimonials and choose which parts appear on the website."
      actions={
        <>
          <Link href="/admin/video-testimonials" className={buttonClass('secondary')}>
            <Video className="h-4 w-4" /> Video testimonials
          </Link>
          <button type="button" onClick={syncFromSheet} disabled={syncing} className={buttonClass('secondary')}>
            <RefreshCw className={cx('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync from sheet'}
          </button>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}
      {syncMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {syncMessage}
        </div>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Search testimonials</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, school, program or text…"
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Approval"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All', count: stats.total },
                { value: 'pending', label: 'Pending', count: stats.pending },
                { value: 'approved', label: 'Approved', count: stats.approved },
              ]}
            />
            <Segmented
              label="Author"
              value={authorFilter}
              onChange={setAuthorFilter}
              options={[
                { value: 'all', label: 'Everyone' },
                { value: 'student', label: 'Students', count: stats.fromStudents },
              ]}
            />
            {visibleTestimonials.length > 0 && (
              <button
                type="button"
                onClick={() => setExpandedRows(allOpen ? new Set() : new Set(visibleTestimonials.map((t) => t.id)))}
                className={buttonClass('secondary')}
              >
                {allOpen ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingState label={syncing ? 'Syncing from Google Sheets…' : 'Loading testimonials…'} />
        ) : visibleTestimonials.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title={testimonials.length ? 'No testimonials match your filters' : 'No testimonials yet'}
            description={testimonials.length ? 'Try a different search or filter.' : 'Submissions appear here after a sync from the Google Sheet.'}
          />
        ) : (
          <ul className="divide-y divide-line">
            {visibleTestimonials.map((t) => {
              const open = expandedRows.has(t.id)
              const isStudent = t.authorType === 'student'
              const beforeAfter = [t.beforeExpectations && `Before: ${t.beforeExpectations}`, t.afterChanges && `After: ${t.afterChanges}`].filter(Boolean).join('\n\n')
              const sections = [
                { title: 'Experience', field: 'contentApproved', on: t.contentApproved, text: t.content },
                { title: 'Before / after', field: 'beforeAfterApproved', on: t.beforeAfterApproved, text: beforeAfter },
                { title: 'Success story', field: 'successStoryApproved', on: t.successStoryApproved, text: t.successStory },
              ].filter((sec) => sec.text)
              return (
                <li key={t.id} className={cx('transition-colors', open ? 'bg-surface-muted/30' : 'hover:bg-surface-muted/40')}>
                  <div onClick={() => toggleRowExpansion(t.id)} className="flex cursor-pointer flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRowExpansion(t.id)
                        }}
                        aria-expanded={open}
                        aria-label={open ? 'Collapse testimonial' : 'Expand testimonial'}
                        className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-subtle transition hover:bg-surface hover:text-ink"
                      >
                        <ChevronDown className={cx('h-4 w-4 transition-transform duration-200', !open && '-rotate-90')} />
                      </button>
                      <span
                        className={cx(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                          isStudent ? 'bg-violet-50 text-violet-700 ring-violet-100' : 'bg-brand-50 text-brand-700 ring-brand-100',
                        )}
                      >
                        {isStudent ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-semibold text-ink">{t.authorName}</span>
                          <Badge tone={isStudent ? 'violet' : 'brand'}>{isStudent ? 'Student' : 'Parent'}</Badge>
                          {t.consentToFeature && <Badge tone="amber" icon={Star}>Consent to feature</Badge>}
                        </p>
                        <p className="mt-0.5 text-sm text-muted">
                          {[t.student?.grade, t.student?.schoolName].filter(Boolean).join(' · ') || 'No school on file'}
                          {t.submittedAt && <> · {new Date(t.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>}
                          {!open && <span className="text-subtle"> · {sections.length} {sections.length === 1 ? 'section' : 'sections'}</span>}
                        </p>
                        {t.programs?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {t.programs.map((program, idx) => <Badge key={idx} tone="brand">{program}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                      {t.rating ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 py-0.5 pl-2.5 pr-0.5 text-xs font-semibold text-gold-700 ring-1 ring-inset ring-gold-200">
                          <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" /> {t.rating}/5
                          <SectionToggle id={t.id} field="ratingApproved" on={t.ratingApproved} />
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleApproval(t.id, t.isApproved)
                        }}
                        title={t.isApproved ? 'Approved. Click to unapprove.' : 'Approve testimonial'}
                        className={buttonClass(t.isApproved ? 'success' : 'secondary', 'sm', 'min-w-[104px]')}
                      >
                        {t.isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {t.isApproved ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(t)
                        }}
                        title="Edit testimonial"
                        aria-label={`Edit testimonial from ${t.authorName}`}
                        className={buttonClass('ghost', 'icon')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTestimonial(t.id, t.authorName)
                        }}
                        title="Delete testimonial"
                        aria-label={`Delete testimonial from ${t.authorName}`}
                        className={buttonClass('ghost', 'icon', 'text-rose-600 hover:bg-rose-50 hover:text-rose-700')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="space-y-3 px-5 pb-5 lg:pl-[88px]">
                      {sections.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {sections.map((sec) => (
                            <div key={sec.field} className="rounded-lg border border-line bg-surface p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle">{sec.title}</p>
                                <SectionToggle id={t.id} field={sec.field} on={sec.on} />
                              </div>
                              <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{sec.text}</p>
                              <button
                                type="button"
                                onClick={() => viewFullContent(sec.title, sec.text || '')}
                                className="mt-1.5 text-xs font-medium text-brand-700 hover:underline"
                              >
                                Read full text →
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm italic text-subtle">No written sections.</p>
                      )}

                      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-lg border border-line bg-surface-muted/60 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="min-w-0"><dt className="text-xs text-muted">Student email</dt><dd className="truncate text-ink-soft">{t.student?.email || '—'}</dd></div>
                        <div className="min-w-0"><dt className="text-xs text-muted">Parent</dt><dd className="truncate text-ink-soft">{t.student?.parentName || '—'}</dd></div>
                        <div className="min-w-0"><dt className="text-xs text-muted">Parent email</dt><dd className="truncate text-ink-soft">{t.student?.parentEmail || '—'}</dd></div>
                        <div className="min-w-0"><dt className="text-xs text-muted">Parent phone</dt><dd className="truncate text-ink-soft">{t.student?.parentPhone || '—'}</dd></div>
                        {t.videoLink && (
                          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                            <dt className="text-xs text-muted">Video link</dt>
                            <dd className="truncate"><a href={t.videoLink} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">{t.videoLink}</a></dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {/* Full Content Modal */}
      {viewingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]" onClick={() => setViewingContent(null)}>
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{viewingContent.title}</h3>
              <button type="button" onClick={() => setViewingContent(null)} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap leading-relaxed text-ink-soft">{viewingContent.content}</p>
            </div>
            <div className="flex justify-end border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={() => setViewingContent(null)} className={buttonClass('primary')}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Testimonial Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-ink">Edit testimonial</h3>
                <p className="mt-0.5 text-sm text-muted">{editingTestimonial.authorName}</p>
              </div>
              <button type="button" onClick={closeEditModal} disabled={saving} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                <section>
                  <h4 className="mb-3 text-sm font-semibold text-ink">Basic information</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className={labelClass}>
                      Author name <span className="text-rose-600">*</span>
                      <input type="text" value={editFormData.authorName} onChange={(e) => setEditFormData({ ...editFormData, authorName: e.target.value })} className={fieldClass} required />
                    </label>
                    <label className={labelClass}>
                      Author type <span className="text-rose-600">*</span>
                      <select value={editFormData.authorType} onChange={(e) => setEditFormData({ ...editFormData, authorType: e.target.value })} className={fieldClass} required>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                    </label>
                    <label className={labelClass}>
                      Student name
                      <input type="text" value={editFormData.studentName} onChange={(e) => setEditFormData({ ...editFormData, studentName: e.target.value })} className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      Grade
                      <input type="text" value={editFormData.grade} onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })} className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      School
                      <input type="text" value={editFormData.school} onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })} className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      Rating (1–5)
                      <input type="number" min="1" max="5" value={editFormData.rating} onChange={(e) => setEditFormData({ ...editFormData, rating: e.target.value })} className={fieldClass} />
                    </label>
                  </div>
                </section>

                <section className="border-t border-line pt-5">
                  <h4 className="mb-3 text-sm font-semibold text-ink">Content</h4>
                  <div className="space-y-4">
                    <label className={labelClass}>
                      Experience description <span className="text-rose-600">*</span>
                      <textarea value={editFormData.content} onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })} rows={4} className={areaClass} required />
                    </label>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className={labelClass}>
                        Before expectations
                        <textarea value={editFormData.beforeExpectations} onChange={(e) => setEditFormData({ ...editFormData, beforeExpectations: e.target.value })} rows={3} className={areaClass} />
                      </label>
                      <label className={labelClass}>
                        After changes
                        <textarea value={editFormData.afterChanges} onChange={(e) => setEditFormData({ ...editFormData, afterChanges: e.target.value })} rows={3} className={areaClass} />
                      </label>
                    </div>
                    <label className={labelClass}>
                      Success story
                      <textarea value={editFormData.successStory} onChange={(e) => setEditFormData({ ...editFormData, successStory: e.target.value })} rows={3} className={areaClass} />
                    </label>
                  </div>
                </section>

                <section className="border-t border-line pt-5">
                  <h4 className="mb-3 text-sm font-semibold text-ink">Additional information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <label className={labelClass}>
                      Programs <span className="font-normal text-subtle">(comma-separated)</span>
                      <input type="text" value={editFormData.programs} onChange={(e) => setEditFormData({ ...editFormData, programs: e.target.value })} placeholder="e.g., Math Olympiad, Science Research" className={fieldClass} />
                    </label>
                    <label className={labelClass}>
                      Video link
                      <input type="url" value={editFormData.videoLink} onChange={(e) => setEditFormData({ ...editFormData, videoLink: e.target.value })} className={fieldClass} />
                    </label>
                  </div>
                </section>
              </div>
            </form>
            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-3">
              <button type="button" onClick={closeEditModal} disabled={saving} className={buttonClass('secondary')}>Cancel</button>
              <button type="button" onClick={handleEditSubmit} disabled={saving} className={buttonClass('primary')}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
