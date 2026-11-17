'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from './Modal'
import { PeoplePicker, emptySelection, selectionCount, selectionIds, type PeopleSelection } from './PeoplePicker'
import {
  DEFAULT_CATEGORIES,
  buttonClass,
  inputClass,
  primaryButtonClass,
  taskApi,
  type Person,
  type TaskPriority,
} from './taskUtils'

interface FormState {
  title: string
  description: string
  category: string
  priority: TaskPriority
  deadline: string
  recurrence: '' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  recurrenceEndsAt: string
  checklist: string[]
  requireSubmissionNote: boolean
  requireFileUpload: boolean
  requireUrl: boolean
  requireExternalConfirmation: boolean
  externalConfirmationPrompt: string
  requireMentorApproval: boolean
  requireChecklistComplete: boolean
}

const initialForm = (): FormState => ({
  title: '',
  description: '',
  category: 'General',
  priority: 'MEDIUM',
  deadline: '',
  recurrence: '',
  recurrenceEndsAt: '',
  checklist: [],
  requireSubmissionNote: false,
  requireFileUpload: false,
  requireUrl: false,
  requireExternalConfirmation: false,
  externalConfirmationPrompt: '',
  requireMentorApproval: true,
  requireChecklistComplete: true,
})

/** Create an admin task and assign it to any mix of students, mentors and parents. */
export function CreateTaskDialog({
  open,
  onClose,
  onCreated,
  mentors,
  categories,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  mentors: Person[]
  categories: string[]
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [people, setPeople] = useState<PeopleSelection>(emptySelection)
  const [newStep, setNewStep] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialForm())
      setPeople(emptySelection())
      setNewStep('')
    }
  }, [open])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const count = selectionCount(people)
  const steps = form.checklist.filter((s) => s.trim())
  const canSave = form.title.trim() && form.description.trim() && count > 0 && (!form.recurrence || form.deadline)

  const addStep = () => {
    if (!newStep.trim()) return
    set('checklist', [...form.checklist, newStep.trim()])
    setNewStep('')
  }

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const res = await taskApi<{ assignedCount: number; task: { id: number } }>('', {
        method: 'POST',
        json: {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim() || 'General',
          priority: form.priority,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
          recurrence: form.recurrence || null,
          recurrenceEndsAt: form.recurrence && form.recurrenceEndsAt ? new Date(form.recurrenceEndsAt).toISOString() : null,
          checklist: steps,
          requireSubmissionNote: form.requireSubmissionNote,
          requireFileUpload: form.requireFileUpload,
          requireUrl: form.requireUrl,
          requireExternalConfirmation: form.requireExternalConfirmation,
          externalConfirmationPrompt: form.requireExternalConfirmation ? form.externalConfirmationPrompt.trim() || null : null,
          requireMentorApproval: form.requireMentorApproval,
          requireChecklistComplete: steps.length > 0 && form.requireChecklistComplete,
          ...selectionIds(people),
        },
      })
      toast.success(`TSK-${res.task.id} assigned to ${res.assignedCount} ${res.assignedCount === 1 ? 'person' : 'people'}`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]))

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="New task"
      description="Assign a task to any students, mentors or parents. Everyone gets their own copy to work on."
      width="max-w-3xl"
      footer={
        <>
          <button type="button" className={buttonClass} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={primaryButtonClass} onClick={() => void submit()} disabled={!canSave || saving}>
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {count > 0 ? `Assign to ${count} ${count === 1 ? 'person' : 'people'}` : 'Choose who to assign'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3">
          <label className="block text-sm font-medium text-slate-800">
            Title
            <input className={`${inputClass} mt-1`} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={300} placeholder="e.g. Submit your SAT registration confirmation" />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Description & instructions
            <textarea className={`${inputClass} mt-1 h-24 py-2`} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What needs to be done, and how?" />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium text-slate-800">
              Category
              <input className={`${inputClass} mt-1`} list="admin-task-categories" value={form.category} onChange={(e) => set('category', e.target.value)} />
              <datalist id="admin-task-categories">
                {allCategories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Priority
              <select className={`${inputClass} mt-1`} value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Deadline
              <input type="datetime-local" className={`${inputClass} mt-1`} value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800">
              Repeats
              <select className={`${inputClass} mt-1`} value={form.recurrence} onChange={(e) => set('recurrence', e.target.value as FormState['recurrence'])}>
                <option value="">Does not repeat</option>
                <option value="WEEKLY">Every week</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="MONTHLY">Every month</option>
              </select>
            </label>
            {form.recurrence && (
              <label className="block text-sm font-medium text-slate-800">
                Repeat until (optional)
                <input type="date" className={`${inputClass} mt-1`} value={form.recurrenceEndsAt} onChange={(e) => set('recurrenceEndsAt', e.target.value)} />
              </label>
            )}
          </div>
          {form.recurrence && !form.deadline && <p className="text-xs text-rose-700">Repeating tasks need a deadline to repeat from.</p>}
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Checklist (optional)</h3>
          {form.checklist.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-right text-xs text-slate-500">{i + 1}.</span>
              <input className={inputClass} value={step} onChange={(e) => set('checklist', form.checklist.map((s, j) => (j === i ? e.target.value : s)))} />
              <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label={`Remove step ${i + 1}`} onClick={() => set('checklist', form.checklist.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addStep()
                }
              }}
              placeholder="Add a step and press Enter"
            />
            <button type="button" className={buttonClass} onClick={addStep} disabled={!newStep.trim()}><Plus className="h-4 w-4" /> Add</button>
          </div>
          {steps.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.requireChecklistComplete} onChange={(e) => set('requireChecklistComplete', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              All steps must be ticked before submitting
            </label>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">What they must provide</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['requireSubmissionNote', 'A written note'],
              ['requireFileUpload', 'A file upload'],
              ['requireUrl', 'A link (URL)'],
              ['requireExternalConfirmation', 'Confirm an outside step'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                {label}
              </label>
            ))}
          </div>
          {form.requireExternalConfirmation && (
            <input className={inputClass} value={form.externalConfirmationPrompt} onChange={(e) => set('externalConfirmationPrompt', e.target.value)} placeholder='e.g. "I have registered on the College Board website"' />
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.requireMentorApproval} onChange={(e) => set('requireMentorApproval', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Requires admin approval (otherwise it completes when submitted)
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Assign to</h3>
          <PeoplePicker value={people} onChange={setPeople} mentors={mentors} />
        </section>
      </div>
    </Modal>
  )
}
