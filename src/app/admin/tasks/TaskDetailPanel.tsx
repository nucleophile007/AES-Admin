'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Ban,
  CheckCircle2,
  Info,
  ExternalLink,
  History,
  LoaderCircle,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './Modal'
import { PeoplePicker, emptySelection, selectionCount, selectionIds, type PeopleSelection } from './PeoplePicker'
import {
  PRIORITY_META,
  ROLE_META,
  STATUS_META,
  assigneeOf,
  buttonClass,
  canReview,
  checklistProgress,
  creatorLabel,
  deadlineLabel,
  formatDateTime,
  inputClass,
  isOverdue,
  isSafeHttpUrl,
  primaryButtonClass,
  taskApi,
  taskKey,
  type Person,
  type ReviewAction,
  type TaskItem,
  type TaskPriority,
  type TaskRecord,
} from './taskUtils'

type DetailTask = TaskRecord & { studentTasks: Omit<TaskItem, 'task'>[] }
interface DetailResponse {
  task: DetailTask
  readOnly: boolean
  /** False on a mentor's task: only the mentor can delete it. */
  canDelete?: boolean
  /** Set on a mentor's task: only this mentor's students can be added. */
  mentorId?: number | null
}

const ROLE_WORD: Record<string, string> = { teacher: 'Mentor', student: 'Student', parent: 'Parent', admin: 'Admin' }

/**
 * One task with every assignee's progress. Admin-created tasks can be reviewed,
 * commented on, edited, cancelled and deleted. On a mentor-created task the
 * admin has the mentor's own permissions: everything except delete, and only
 * that mentor's students can be added. AES enforces both.
 */
export function TaskDetailPanel({
  taskId,
  initialItemId,
  onClose,
  onChanged,
  mentors,
}: {
  taskId: number | null
  initialItemId: number | null
  onClose: () => void
  onChanged: () => void
  mentors: Person[]
}) {
  const { data, error, isLoading, mutate } = useSWR<DetailResponse>(
    taskId ? `/${taskId}` : null,
    (path: string) => taskApi<DetailResponse>(path),
    { refreshInterval: 30_000, revalidateOnFocus: true }
  )
  const [selectedId, setSelectedId] = useState<number | null>(initialItemId)
  const [editing, setEditing] = useState(false)
  const [addingPeople, setAddingPeople] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSelectedId(initialItemId)
    setEditing(false)
  }, [taskId, initialItemId])

  const task = data?.task
  const readOnly = data?.readOnly ?? true
  const canDelete = data?.canDelete ?? !readOnly
  const mentorId = data?.mentorId ?? null
  const items = useMemo(() => task?.studentTasks ?? [], [task])
  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null

  const refresh = () => {
    void mutate()
    onChanged()
  }

  const patchTask = async (json: Record<string, unknown>, success: string) => {
    if (!task) return false
    setBusy(true)
    try {
      await taskApi(`/${task.id}`, { method: 'PATCH', json })
      toast.success(success)
      refresh()
      return true
    } catch (err) {
      toast.error((err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const deleteTask = async () => {
    if (!task) return
    if (!window.confirm(`Delete ${taskKey(task.id)} "${task.title}" for all ${items.length} people? Their work, comments and history will be removed. This cannot be undone.`)) return
    setBusy(true)
    try {
      await taskApi(`/${task.id}`, { method: 'DELETE' })
      toast.success(`${taskKey(task.id)} deleted`)
      onChanged()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1))
    return c
  }, [items])

  return (
    <Modal
      open={taskId != null}
      onClose={onClose}
      variant="side"
      width="max-w-4xl"
      title={task ? <span><span className="mr-2 font-mono text-sm text-slate-500">{taskKey(task.id)}</span>{task.title}</span> : 'Task'}
      description={
        task && (
          <span>
            {task.category} · Created by {creatorLabel(task)} ({task.creatorRole === 'ADMIN' ? 'admin' : 'mentor'}) · {formatDateTime(task.createdAt)}
          </span>
        )
      }
    >
      {!task ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          {error ? (error as Error).message : isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Task not found'}
        </div>
      ) : (
        <div className="space-y-5">
          {mentorId != null && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Created by mentor {creatorLabel(task)}. You can do what the mentor can: edit, cancel, review and comment.
                Only their students can be added, only the mentor can delete it, and they are emailed about your changes.
              </span>
            </div>
          )}
          {task.isCancelled && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
              <Ban className="h-4 w-4" /> This task is cancelled. Assignees no longer see it.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded border px-2 py-0.5 font-medium ${PRIORITY_META[task.priority].className}`}>{PRIORITY_META[task.priority].label} priority</span>
            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-slate-700">{deadlineLabel(task.deadline)}</span>
            {task.recurrence && <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700">Repeats {task.recurrence.toLowerCase()}</span>}
            {Object.entries(counts).map(([status, n]) => (
              <span key={status} className={`rounded-full border px-2 py-0.5 ${STATUS_META[status as keyof typeof STATUS_META].className}`}>
                {n} {STATUS_META[status as keyof typeof STATUS_META].label.toLowerCase()}
              </span>
            ))}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClass} onClick={() => setEditing((v) => !v)} disabled={busy}><Pencil className="h-4 w-4" /> Edit</button>
              <button type="button" className={buttonClass} onClick={() => setAddingPeople(true)} disabled={busy || task.isCancelled}><UserPlus className="h-4 w-4" /> Add people</button>
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => void patchTask({ isCancelled: !task.isCancelled }, task.isCancelled ? 'Task restored' : 'Task cancelled')}
              >
                {task.isCancelled ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                {task.isCancelled ? 'Restore' : 'Cancel task'}
              </button>
              {canDelete && (
                <button type="button" className={`${buttonClass} border-rose-200 text-rose-700 hover:bg-rose-50`} onClick={() => void deleteTask()} disabled={busy}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
            </div>
          )}

          {editing && !readOnly ? (
            <EditTaskForm task={task} busy={busy} onCancel={() => setEditing(false)} onSave={async (json) => (await patchTask(json, 'Task updated')) && setEditing(false)} />
          ) : (
            <TaskSummary task={task} />
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,15rem)_1fr]">
            <section aria-label="Assignees" className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Assigned to ({items.length})</h3>
              <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                {items.map((item) => {
                  const person = assigneeOf(item as TaskItem)
                  const progress = checklistProgress(task, item.checklistDone)
                  const active = selected?.id === item.id
                  return (
                    <li key={item.id}>
                      <button type="button" onClick={() => setSelectedId(item.id)} aria-pressed={active} className={`w-full px-3 py-2 text-left text-sm ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <span className="block truncate font-medium text-slate-900">{person?.name ?? 'Unknown'}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                          <span className={`rounded border px-1.5 ${ROLE_META[item.assigneeRole].className}`}>{ROLE_META[item.assigneeRole].label}</span>
                          <span className={`rounded-full border px-1.5 ${STATUS_META[item.status].className}`}>{STATUS_META[item.status].label}</span>
                          {progress.total > 0 && <span className="text-slate-500">{progress.done}/{progress.total} steps</span>}
                          {isOverdue(task.deadline, item.status) && <span className="font-semibold text-rose-600">Overdue</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            {selected && (
              <AssigneeWork
                key={selected.id}
                task={task}
                item={selected}
                readOnly={readOnly}
                onChanged={refresh}
              />
            )}
          </div>
        </div>
      )}

      <Modal
        open={addingPeople}
        onClose={() => setAddingPeople(false)}
        title={mentorId != null && task ? `Add ${creatorLabel(task)}'s students to this task` : 'Add people to this task'}
        width="max-w-2xl"
      >
        {task && (
          <AddPeopleForm
            task={task}
            mentors={mentors}
            mentorId={mentorId}
            onDone={(added) => {
              setAddingPeople(false)
              if (added) refresh()
            }}
          />
        )}
      </Modal>
    </Modal>
  )
}

function TaskSummary({ task }: { task: TaskRecord }) {
  const checklist = Array.isArray(task.checklist) ? task.checklist : []
  const requirements = [
    task.requireSubmissionNote && 'a written note',
    task.requireFileUpload && 'a file',
    task.requireUrl && 'a link',
    task.requireExternalConfirmation && (task.externalConfirmationPrompt ? `confirmation: “${task.externalConfirmationPrompt}”` : 'an outside confirmation'),
    task.requireChecklistComplete && checklist.length > 0 && 'every checklist step ticked',
  ].filter(Boolean)
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 [overflow-wrap:anywhere]">{task.description}</p>
      <p className="text-xs text-slate-600">
        <strong>Must provide:</strong> {requirements.length ? requirements.join(', ') : 'nothing extra'} ·{' '}
        <strong>Approval:</strong> {task.requireMentorApproval ? 'needs review' : 'completes on submit'}
      </p>
      {checklist.length > 0 && (
        <ol className="list-decimal space-y-0.5 pl-5 text-sm text-slate-700">
          {checklist.map((c) => <li key={c.id}>{c.title}</li>)}
        </ol>
      )}
    </div>
  )
}

function EditTaskForm({
  task,
  busy,
  onCancel,
  onSave,
}: {
  task: TaskRecord
  busy: boolean
  onCancel: () => void
  onSave: (json: Record<string, unknown>) => void
}) {
  const toLocal = (value: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  }
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [category, setCategory] = useState(task.category)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [deadline, setDeadline] = useState(toLocal(task.deadline))
  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
      <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <textarea className={`${inputClass} h-24 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
      <div className="grid gap-2 sm:grid-cols-3">
        <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" />
        <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} aria-label="Priority">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <input type="datetime-local" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="Deadline" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass} onClick={onCancel} disabled={busy}>Cancel</button>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={busy || !title.trim() || !description.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              description: description.trim(),
              category: category.trim(),
              priority,
              deadline: deadline ? new Date(deadline).toISOString() : null,
            })
          }
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  )
}

function AddPeopleForm({
  task,
  mentors,
  mentorId,
  onDone,
}: {
  task: DetailTask
  mentors: Person[]
  /** A mentor's task: only that mentor's students can be added. */
  mentorId: number | null
  onDone: (added: boolean) => void
}) {
  const [people, setPeople] = useState<PeopleSelection>(emptySelection)
  const [saving, setSaving] = useState(false)
  const already = useMemo(
    () => new Set(task.studentTasks.map((st) => `${st.assigneeRole}:${st.studentId ?? st.assigneeTeacherId ?? st.assigneeParentId}`)),
    [task]
  )
  const count = selectionCount(people)
  const save = async () => {
    setSaving(true)
    try {
      const ids = selectionIds(people)
      const res = await taskApi<{ added: number }>(`/${task.id}`, {
        method: 'PATCH',
        json: { addStudentIds: ids.studentIds, addTeacherIds: ids.teacherIds, addParentIds: ids.parentIds },
      })
      toast.success(`Added ${res.added} ${res.added === 1 ? 'person' : 'people'}`)
      onDone(true)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-3">
      <PeoplePicker
        value={people}
        onChange={setPeople}
        mentors={mentors}
        alreadyAssigned={already}
        onlyStudentsOfMentor={mentorId ?? undefined}
      />
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass} onClick={() => onDone(false)} disabled={saving}>Cancel</button>
        <button type="button" className={primaryButtonClass} onClick={() => void save()} disabled={!count || saving}>
          {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Add {count || ''} {count === 1 ? 'person' : 'people'}
        </button>
      </div>
    </div>
  )
}

function AssigneeWork({
  task,
  item,
  readOnly,
  onChanged,
}: {
  task: TaskRecord
  item: Omit<TaskItem, 'task'>
  readOnly: boolean
  onChanged: () => void
}) {
  const person = assigneeOf(item as TaskItem)
  const [feedback, setFeedback] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const checklist = Array.isArray(task.checklist) ? task.checklist : []
  const done = new Set(item.checklistDone ?? [])
  const canAct = !readOnly && !task.isCancelled

  const review = async (action: ReviewAction) => {
    if (action === 'REQUEST_CHANGES' && !feedback.trim()) {
      toast.error('Write what needs to change first.')
      return
    }
    setBusy(action)
    try {
      await taskApi('/review', { method: 'POST', json: { studentTaskId: item.id, action, feedback: feedback.trim() } })
      toast.success(action === 'APPROVE' ? 'Approved' : action === 'REQUEST_CHANGES' ? 'Changes requested' : 'Reopened')
      setFeedback('')
      onChanged()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const postComment = async () => {
    if (!comment.trim()) return
    setBusy('comment')
    try {
      await taskApi('/comments', { method: 'POST', json: { studentTaskId: item.id, content: comment.trim() } })
      setComment('')
      onChanged()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const hasSubmission = item.submissionNote || item.submissionUrl || item.submissionFileUrl || item.submissionExternalConfirmed

  return (
    <section className="min-w-0 space-y-4" aria-label={`${person?.name ?? 'Assignee'}'s work`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{person?.name ?? 'Unknown'}</h3>
          <p className="text-xs text-slate-500">{ROLE_META[item.assigneeRole].label} · {person?.email}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_META[item.status].className}`}>{STATUS_META[item.status].label}</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {([
          ['Started', item.startedAt],
          ['Submitted', item.submittedAt],
          ['Completed', item.completedAt],
          ['Reviewed', item.reviewedAt],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded border border-slate-200 p-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(value)}</dd>
          </div>
        ))}
      </dl>

      {checklist.length > 0 && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Checklist · {checklist.filter((c) => done.has(c.id)).length}/{checklist.length}</p>
          <ul className="space-y-1 text-sm">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                {done.has(c.id) ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                <span className={done.has(c.id) ? 'text-slate-500 line-through' : 'text-slate-800'}>{c.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 p-3 text-sm">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Submission</p>
        {!hasSubmission ? (
          <p className="text-slate-500">Nothing submitted yet.</p>
        ) : (
          <div className="space-y-1.5">
            {item.submissionNote && <p className="whitespace-pre-wrap text-slate-800 [overflow-wrap:anywhere]">{item.submissionNote}</p>}
            {isSafeHttpUrl(item.submissionUrl) && (
              <a href={item.submissionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-blue-700 underline">
                {item.submissionUrl} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
            {isSafeHttpUrl(item.submissionFileUrl) && (
              <a href={item.submissionFileUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-blue-700 underline">
                {item.submissionFileName || 'Attached file'}
              </a>
            )}
            {item.submissionExternalConfirmed && <p className="text-emerald-700">✓ Confirmed the outside step</p>}
          </div>
        )}
        {item.mentorFeedback && (
          <p className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700"><strong>Last feedback:</strong> {item.mentorFeedback}</p>
        )}
      </div>

      {canAct && (canReview('APPROVE', item.status) || canReview('REQUEST_CHANGES', item.status) || canReview('REOPEN', item.status)) && (
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-900">Review</p>
          <textarea className={`${inputClass} h-16 py-2`} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback (required when requesting changes)" />
          <div className="flex flex-wrap gap-2">
            {canReview('APPROVE', item.status) && (
              <button type="button" className={`${primaryButtonClass} bg-emerald-600 hover:bg-emerald-700`} disabled={!!busy} onClick={() => void review('APPROVE')}>
                {busy === 'APPROVE' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
              </button>
            )}
            {canReview('REQUEST_CHANGES', item.status) && (
              <button type="button" className={`${buttonClass} border-rose-200 text-rose-700 hover:bg-rose-50`} disabled={!!busy} onClick={() => void review('REQUEST_CHANGES')}>
                {busy === 'REQUEST_CHANGES' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Request changes
              </button>
            )}
            {canReview('REOPEN', item.status) && (
              <button type="button" className={buttonClass} disabled={!!busy} onClick={() => void review('REOPEN')}>
                {busy === 'REOPEN' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reopen
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><MessageSquare className="h-3.5 w-3.5" /> Comments ({item.comments?.length ?? 0})</p>
        <ul className="space-y-2">
          {(item.comments ?? []).map((c) => (
            <li key={c.id} className={`rounded-lg border p-2.5 text-sm ${c.authorRole === 'admin' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-800">{c.authorName}</span> · {ROLE_WORD[c.authorRole] ?? c.authorRole} · {formatDateTime(c.createdAt)}
              </p>
              {c.content && <p className="mt-0.5 whitespace-pre-wrap text-slate-800 [overflow-wrap:anywhere]">{c.content}</p>}
              {isSafeHttpUrl(c.attachmentUrl) && (
                <a href={c.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">{c.attachmentName || 'Attachment'}</a>
              )}
            </li>
          ))}
          {!item.comments?.length && <li className="text-sm text-slate-500">No comments yet.</li>}
        </ul>
        {canAct && (
          <div className="flex gap-2">
            <textarea className={`${inputClass} h-16 py-2`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Message ${person?.name ?? 'them'}…`} maxLength={5000} />
            <button type="button" className={`${primaryButtonClass} self-end`} disabled={!comment.trim() || busy === 'comment'} onClick={() => void postComment()}>
              {busy === 'comment' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><History className="h-3.5 w-3.5" /> Activity</p>
        <ul className="space-y-1.5 border-l-2 border-slate-200 pl-3 text-xs">
          {(item.activities ?? []).map((a) => (
            <li key={a.id}>
              <span className="text-slate-800">{a.details || a.action}</span>
              <span className="text-slate-500"> · {a.performedByName} ({(ROLE_WORD[a.performedByRole] ?? a.performedByRole).toLowerCase()}) · {formatDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
