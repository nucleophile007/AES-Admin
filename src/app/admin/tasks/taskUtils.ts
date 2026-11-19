/**
 * Types and display helpers for the admin task page. The task engine (and all
 * its rules) lives in AES; these only shape what AES returns for display.
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'SUBMITTED' | 'CHANGES_REQUESTED' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type AssigneeRole = 'STUDENT' | 'TEACHER' | 'PARENT'
export type ReviewAction = 'APPROVE' | 'REQUEST_CHANGES' | 'REOPEN'

export interface Person {
  id: number
  name: string
  email: string
}

export interface ChecklistItem {
  id: string
  title: string
}

export interface TaskRecord {
  id: number
  title: string
  description: string
  category: string
  priority: TaskPriority
  deadline: string | null
  creatorRole: 'TEACHER' | 'ADMIN'
  creatorId: number | null
  creator?: Person | null
  creatorName: string | null
  creatorAdminEmail: string | null
  isCancelled: boolean
  checklist: ChecklistItem[] | null
  recurrence: string | null
  requireSubmissionNote: boolean
  requireFileUpload: boolean
  requireUrl: boolean
  requireExternalConfirmation: boolean
  requireChecklistComplete: boolean
  requireMentorApproval: boolean
  externalConfirmationPrompt: string | null
  createdAt: string
}

export interface TaskComment {
  id: number
  authorRole: string
  authorName: string
  content: string
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string
}

export interface TaskActivity {
  id: number
  action: string
  details: string | null
  performedByRole: string
  performedByName: string
  createdAt: string
}

/** One assignee's copy of a task. */
export interface TaskItem {
  id: number
  taskId: number
  assigneeRole: AssigneeRole
  studentId: number | null
  assigneeTeacherId: number | null
  assigneeParentId: number | null
  student?: (Person & { grade?: string | null; program?: string | null }) | null
  assigneeTeacher?: Person | null
  assigneeParent?: Person | null
  status: TaskStatus
  startedAt: string | null
  submittedAt: string | null
  completedAt: string | null
  submissionNote: string | null
  submissionUrl: string | null
  submissionFileUrl: string | null
  submissionFileName: string | null
  submissionExternalConfirmed: boolean
  checklistDone: string[] | null
  mentorFeedback: string | null
  reviewedAt: string | null
  updatedAt: string
  task: TaskRecord
  _count?: { comments: number }
  comments?: TaskComment[]
  activities?: TaskActivity[]
}

export interface StatusCounts {
  TODO: number
  IN_PROGRESS: number
  SUBMITTED: number
  CHANGES_REQUESTED: number
  COMPLETED: number
}

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'COMPLETED']

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To do', className: 'bg-surface-muted text-ink-soft border-line' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-brand-50 text-brand-700 border-brand-100' },
  SUBMITTED: { label: 'Needs review', className: 'bg-gold-50 text-gold-700 border-gold-200' },
  CHANGES_REQUESTED: { label: 'Changes requested', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
}

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-surface-muted text-muted border-line' },
  MEDIUM: { label: 'Medium', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  HIGH: { label: 'High', className: 'bg-gold-50 text-gold-700 border-gold-200' },
  URGENT: { label: 'Urgent', className: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export const ROLE_META: Record<AssigneeRole, { label: string; plural: string; className: string }> = {
  STUDENT: { label: 'Student', plural: 'Students', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TEACHER: { label: 'Mentor', plural: 'Mentors', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  PARENT: { label: 'Parent', plural: 'Parents', className: 'bg-sky-50 text-sky-700 border-sky-200' },
}

export const DEFAULT_CATEGORIES = [
  'College Prep',
  'Outreach',
  'Research',
  'Event Registration',
  'Form / Application',
  'Meeting / Interview',
  'Document Upload',
  'General',
]

export const taskKey = (id: number) => `TSK-${id}`

export const isAdminTask = (task: Pick<TaskRecord, 'creatorRole'>) => task.creatorRole === 'ADMIN'

export function creatorLabel(task: TaskRecord): string {
  if (task.creator?.name) return task.creator.name
  if (task.creatorName) return task.creatorName
  return isAdminTask(task) ? 'Admin' : 'Mentor'
}

export function assigneeOf(item: TaskItem): Person | null {
  return item.student ?? item.assigneeTeacher ?? item.assigneeParent ?? null
}

/** Same rule as AES: what a reviewer can do from each status. */
export function canReview(action: ReviewAction, status: TaskStatus): boolean {
  if (action === 'APPROVE') return status === 'SUBMITTED'
  if (action === 'REQUEST_CHANGES') return status === 'SUBMITTED' || status === 'COMPLETED'
  return status === 'COMPLETED'
}

const OPEN: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'CHANGES_REQUESTED']

export function isOverdue(deadline: string | null, status: TaskStatus): boolean {
  return !!deadline && OPEN.includes(status) && new Date(deadline).getTime() < Date.now()
}

export function deadlineLabel(deadline: string | null): string {
  if (!deadline) return 'No deadline'
  const d = new Date(deadline)
  const days = Math.round((new Date(d.toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) / 864e5)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days === 0) return `Due today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  if (days === 1) return `Due tomorrow · ${date}`
  if (days === -1) return `Due yesterday · ${date}`
  if (days < 0) return `${-days} days overdue · ${date}`
  return `Due ${date}`
}

export function checklistProgress(task: TaskRecord, done: string[] | null): { done: number; total: number } {
  const items = Array.isArray(task.checklist) ? task.checklist : []
  const ids = new Set(Array.isArray(done) ? done : [])
  return { done: items.filter((i) => ids.has(i.id)).length, total: items.length }
}

export function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** JSON fetch against the admin proxy; throws with the server's error message. */
export async function taskApi<T = unknown>(path: string, init?: { method?: string; json?: unknown }): Promise<T> {
  const res = await fetch(`/api/admin/tasks${path}`, {
    method: init?.method || 'GET',
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data as T
}

/** Field look without a width (for selects that size to their content). Matches the admin theme. */
export const fieldClass =
  'h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-card placeholder:text-subtle focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100'
export const inputClass = `${fieldClass} w-full`
export const buttonClass =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-soft shadow-card transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
export const primaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50'
