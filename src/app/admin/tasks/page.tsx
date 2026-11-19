'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import {
  BarChart3,
  ClipboardList,
  Download,
  Kanban,
  List,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { EmptyState, LoadingState, Panel, cx } from '@/components/admin/ui'
import { CreateTaskDialog } from './CreateTaskDialog'
import { TaskDetailPanel } from './TaskDetailPanel'
import { InsightsView } from './InsightsView'
import {
  PRIORITY_META,
  ROLE_META,
  STATUSES,
  STATUS_META,
  assigneeOf,
  buttonClass,
  checklistProgress,
  creatorLabel,
  deadlineLabel,
  fieldClass,
  inputClass,
  isAdminTask,
  isOverdue,
  primaryButtonClass,
  taskApi,
  taskKey,
  type Person,
  type StatusCounts,
  type TaskItem,
  type TaskStatus,
} from './taskUtils'

interface ListResponse {
  items: TaskItem[]
  truncated: boolean
  columnCounts: StatusCounts
  metrics: {
    total: number
    todo: number
    inProgress: number
    pendingReview: number
    changesRequested: number
    completed: number
    overdue: number
  }
  categories?: string[]
  mentors?: Person[]
}

interface Filters {
  search: string
  source: 'all' | 'admin' | 'mentor'
  creatorTeacherId: string
  assigneeRole: string
  status: string
  priority: string
  category: string
  deadlineFilter: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  source: 'all',
  creatorTeacherId: '',
  assigneeRole: '',
  status: '',
  priority: '',
  category: '',
  deadlineFilter: '',
}

type View = 'list' | 'board' | 'insights'

export default function AdminTasksPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-subtle" /></div>}>
      <AdminTasks />
    </Suspense>
  )
}

function AdminTasks() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [detail, setDetail] = useState<{ taskId: number; itemId: number | null } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [lookups, setLookups] = useState<{ categories: string[]; mentors: Person[] } | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.search === searchInput.trim() ? f : { ...f, search: searchInput.trim() })), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Scope only (who created / who it's for): used by insights.
  const scopeQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.source !== 'all') p.set('source', filters.source)
    if (filters.creatorTeacherId) p.set('creatorTeacherId', filters.creatorTeacherId)
    if (filters.assigneeRole) p.set('assigneeRole', filters.assigneeRole)
    return p.toString()
  }, [filters.source, filters.creatorTeacherId, filters.assigneeRole])

  const listQuery = useMemo(() => {
    const p = new URLSearchParams(scopeQuery)
    if (filters.search) p.set('search', filters.search)
    if (filters.status) p.set('status', filters.status)
    if (filters.priority) p.set('priority', filters.priority)
    if (filters.category) p.set('category', filters.category)
    if (filters.deadlineFilter) p.set('deadlineFilter', filters.deadlineFilter)
    p.set('includeCancelled', 'true')
    return p.toString()
  }, [scopeQuery, filters])

  const { data, error, isLoading, isValidating, mutate } = useSWR<ListResponse>(
    `?${listQuery}${lookups ? '' : '&lookups=1'}`,
    (path: string) => taskApi<ListResponse>(path),
    { refreshInterval: 30_000, revalidateOnFocus: true, keepPreviousData: true }
  )

  useEffect(() => {
    if (!lookups && data?.mentors && data.categories) setLookups({ mentors: data.mentors, categories: data.categories })
  }, [data, lookups])

  // Drop selections that are no longer in the list.
  useEffect(() => {
    if (!data) return
    setSelected((prev) => {
      const visible = new Set(data.items.map((i) => i.id))
      const next = new Set([...prev].filter((id) => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [data])

  // ?open=<studentTaskId> (links in emails) opens that task.
  const openParam = searchParams?.get('open')
  useEffect(() => {
    const id = Number(openParam)
    if (!openParam || !Number.isInteger(id) || id <= 0) return
    taskApi<{ taskId: number; studentTaskId: number }>(`/items/${id}`)
      .then((res) => setDetail({ taskId: res.taskId, itemId: res.studentTaskId }))
      .catch((err) => toast.error((err as Error).message))
  }, [openParam])

  const closeDetail = useCallback(() => {
    setDetail(null)
    if (searchParams?.get('open')) router.replace(pathname, { scroll: false })
  }, [searchParams, router, pathname])

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }))
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSearchInput('')
  }
  const hasFilters = JSON.stringify({ ...filters, search: searchInput.trim() }) !== JSON.stringify(EMPTY_FILTERS)

  const items = useMemo(() => data?.items ?? [], [data])
  const selectableIds = useMemo(() => items.map((i) => i.id), [items])
  const mentors = lookups?.mentors ?? []
  const categories = lookups?.categories ?? []
  const metrics = data?.metrics

  const runBulk = async (json: Record<string, unknown>, label: string) => {
    setBulkBusy(true)
    try {
      const res = await taskApi<{ updated: number; skipped: number }>('/bulk', {
        method: 'POST',
        json: { ...json, studentTaskIds: [...selected] },
      })
      toast.success(`${label}: ${res.updated} updated${res.skipped ? `, ${res.skipped} skipped (not in a valid state)` : ''}`)
      setSelected(new Set())
      void mutate()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }

  const statusTabs: Array<{ label: string; value: number | undefined; status?: TaskStatus; overdue?: boolean; dot: string }> = [
    { label: 'All', value: metrics?.total, dot: 'bg-ink-soft' },
    { label: 'To do', value: metrics?.todo, status: 'TODO', dot: 'bg-subtle' },
    { label: 'In progress', value: metrics?.inProgress, status: 'IN_PROGRESS', dot: 'bg-brand-500' },
    { label: 'Needs review', value: metrics?.pendingReview, status: 'SUBMITTED', dot: 'bg-gold-500' },
    { label: 'Changes requested', value: metrics?.changesRequested, status: 'CHANGES_REQUESTED', dot: 'bg-rose-500' },
    { label: 'Completed', value: metrics?.completed, status: 'COMPLETED', dot: 'bg-emerald-500' },
    { label: 'Overdue', value: metrics?.overdue, overdue: true, dot: 'bg-rose-600' },
  ]

  return (
    <AdminPageShell
      moduleId="tasks"
      description="Assign tasks to any student, mentor or parent, review their work, and follow every mentor's tasks."
      actions={
        <>
          <button type="button" className={buttonClass} onClick={() => void mutate()} disabled={isValidating} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <a className={buttonClass} href={`/api/admin/tasks/export?${listQuery}`}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <button type="button" className={primaryButtonClass} onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New task
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && !data && (
          <div role="alert" className="rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{(error as Error).message}</div>
        )}

        <Panel>
          {/* Status tabs (replace the old number cards, same filtering) */}
          <div className="border-b border-line px-4 pt-3">
            <div role="tablist" aria-label="Status" className="-mb-px flex flex-1 gap-1 overflow-x-auto">
              {statusTabs.map((m) => {
                const active = m.overdue ? filters.deadlineFilter === 'overdue' : m.status ? filters.status === m.status : !filters.status && !filters.deadlineFilter
                return (
                  <button
                    key={m.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() =>
                      setFilters((f) =>
                        m.overdue
                          ? { ...f, status: '', deadlineFilter: f.deadlineFilter === 'overdue' ? '' : 'overdue' }
                          : { ...f, deadlineFilter: '', status: m.status && f.status !== m.status ? m.status : '' }
                      )
                    }
                    className={cx(
                      'inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-3 pt-1.5 text-sm font-medium transition',
                      active ? 'border-brand-700 text-ink' : 'border-transparent text-muted hover:border-line-strong hover:text-ink'
                    )}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                    {m.label}
                    <span
                      className={cx(
                        'min-w-[1.5rem] rounded-full px-1.5 py-px text-center text-xs tabular-nums',
                        m.overdue && m.value ? 'bg-rose-50 text-rose-700' : active ? 'bg-brand-50 text-brand-700' : 'bg-surface-muted text-muted'
                      )}
                    >
                      {m.value ?? '–'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filters */}
          <div aria-label="Filters" className="flex flex-wrap items-center gap-2 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search title, person, or TSK-123…" className={`${inputClass} pl-9`} aria-label="Search tasks" />
            </div>
            <select className={`${fieldClass} w-auto`} value={filters.source} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value as Filters['source'], creatorTeacherId: e.target.value === 'admin' ? '' : f.creatorTeacherId }))} aria-label="Created by">
              <option value="all">All tasks</option>
              <option value="admin">Created by admins</option>
              <option value="mentor">Created by mentors</option>
            </select>
            <select className={`${fieldClass} w-auto`} value={filters.creatorTeacherId} onChange={(e) => setFilters((f) => ({ ...f, creatorTeacherId: e.target.value, source: e.target.value ? 'mentor' : f.source }))} aria-label="Mentor">
              <option value="">Any mentor</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className={`${fieldClass} w-auto`} value={filters.assigneeRole} onChange={(e) => setFilter('assigneeRole', e.target.value)} aria-label="Assigned to">
              <option value="">Assigned to anyone</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Mentors</option>
              <option value="PARENT">Parents</option>
            </select>
            <select className={`${fieldClass} w-auto`} value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Priority">
              <option value="">Any priority</option>
              {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className={`${fieldClass} w-auto`} value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
              <option value="">Any category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`${fieldClass} w-auto`} value={filters.deadlineFilter} onChange={(e) => setFilter('deadlineFilter', e.target.value)} aria-label="Deadline">
              <option value="">Any deadline</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="week">Due this week</option>
              <option value="upcoming">Upcoming</option>
              <option value="none">No deadline</option>
            </select>
            {hasFilters && <button type="button" className="px-1 text-sm font-medium text-brand-700 hover:underline" onClick={resetFilters}>Reset filters</button>}
            <div className="ml-auto inline-flex h-9 shrink-0 items-center rounded-lg border border-line bg-surface-muted p-1" role="tablist" aria-label="View">
              {([
                ['list', 'List', List],
                ['board', 'Board', Kanban],
                ['insights', 'Insights', BarChart3],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={view === value}
                  onClick={() => setView(value)}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition',
                    view === value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {view !== 'insights' && selected.size > 0 && (
          <div className="sticky top-[72px] z-30 flex flex-wrap items-center gap-2 rounded-card border border-brand-100 bg-brand-50/95 p-3 text-sm shadow-card-hover backdrop-blur">
            <span className="font-semibold text-brand-900">{selected.size} selected</span>
            <button type="button" className={buttonClass} disabled={bulkBusy} onClick={() => void runBulk({ action: 'APPROVE' }, 'Approved')}>Approve</button>
            <button
              type="button"
              className={buttonClass}
              disabled={bulkBusy}
              onClick={() => {
                const feedback = window.prompt('What needs to change? (sent to everyone selected)')
                if (feedback?.trim()) void runBulk({ action: 'REQUEST_CHANGES', feedback: feedback.trim() }, 'Changes requested')
              }}
            >
              Request changes
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={bulkBusy}
              onClick={() => {
                const days = Number(window.prompt('Move deadlines by how many days? (negative = earlier)', '7'))
                if (Number.isInteger(days) && days !== 0) void runBulk({ action: 'SHIFT_DEADLINE', shiftDays: days }, 'Deadlines moved')
              }}
            >
              Move deadline
            </button>
            <select
              className={`${fieldClass} h-8 w-auto`}
              value=""
              disabled={bulkBusy}
              onChange={(e) => e.target.value && void runBulk({ action: 'SET_PRIORITY', priority: e.target.value }, 'Priority set')}
              aria-label="Set priority"
            >
              <option value="">Set priority…</option>
              {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button type="button" className={buttonClass} disabled={bulkBusy} onClick={() => window.confirm('Cancel the tasks of the selected rows for everyone assigned?') && void runBulk({ action: 'CANCEL' }, 'Cancelled')}>Cancel tasks</button>
            <button type="button" className={buttonClass} disabled={bulkBusy} onClick={() => void runBulk({ action: 'RESTORE' }, 'Restored')}>Restore</button>
            <button type="button" className={`${buttonClass} border-rose-200 text-rose-700 hover:bg-rose-50`} disabled={bulkBusy} onClick={() => window.confirm(`Remove ${selected.size} people from their tasks? Their work on those tasks will be deleted.`) && void runBulk({ action: 'UNASSIGN' }, 'Unassigned')}>Unassign</button>
            <button type="button" className="ml-auto text-sm text-brand-800 hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
            {bulkBusy && <LoaderCircle className="h-4 w-4 animate-spin text-brand-700" />}
          </div>
        )}

        {data?.truncated && view !== 'insights' && (
          <p className="rounded-card border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">Showing the first {items.length} rows. Use search or filters to narrow the list.</p>
        )}

        {view === 'insights' ? (
          <InsightsView scopeQuery={scopeQuery} onOpen={(taskId, itemId) => setDetail({ taskId, itemId })} />
        ) : !data ? (
          <Panel>{isLoading ? <LoadingState label="Loading tasks…" /> : <div className="h-40" />}</Panel>
        ) : items.length === 0 ? (
          <Panel>
            <EmptyState
              icon={ClipboardList}
              title={hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
              description={hasFilters ? 'Try another search, or reset the filters.' : 'Create a task to assign it to students, mentors or parents.'}
              action={
                hasFilters ? (
                  <button type="button" className={buttonClass} onClick={resetFilters}>Reset filters</button>
                ) : (
                  <button type="button" className={primaryButtonClass} onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New task</button>
                )
              }
            />
          </Panel>
        ) : view === 'board' ? (
          <Board items={items} counts={data.columnCounts} truncated={data.truncated} onOpen={(i) => setDetail({ taskId: i.taskId, itemId: i.id })} />
        ) : (
          <TaskTable
            items={items}
            selected={selected}
            selectableIds={selectableIds}
            onToggle={(id) => setSelected((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })}
            onToggleAll={() => setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)))}
            onOpen={(i) => setDetail({ taskId: i.taskId, itemId: i.id })}
          />
        )}
      </div>

      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} mentors={mentors} categories={categories} />
      <TaskDetailPanel
        taskId={detail?.taskId ?? null}
        initialItemId={detail?.itemId ?? null}
        onClose={closeDetail}
        onChanged={() => void mutate()}
        mentors={mentors}
      />
    </AdminPageShell>
  )
}

function SourceBadge({ item }: { item: TaskItem }) {
  return isAdminTask(item.task) ? (
    <span className="rounded-md border border-brand-100 bg-brand-50 px-1.5 text-[11px] font-medium text-brand-700">Admin</span>
  ) : (
    <span className="rounded-md border border-line bg-surface-muted px-1.5 text-[11px] text-muted" title="Created by a mentor. You act with the mentor's permissions.">
      Mentor
    </span>
  )
}

function TaskTable({
  items,
  selected,
  selectableIds,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  items: TaskItem[]
  selected: Set<number>
  selectableIds: number[]
  onToggle: (id: number) => void
  onToggleAll: () => void
  onOpen: (item: TaskItem) => void
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-line bg-surface-muted text-left text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                aria-label="Select all tasks"
                checked={selectableIds.length > 0 && selected.size === selectableIds.length}
                disabled={!selectableIds.length}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-line-strong accent-brand-700"
              />
            </th>
            <th className="px-3 py-3">Task</th>
            <th className="px-3 py-3">Assigned to</th>
            <th className="px-3 py-3">Created by</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Deadline</th>
            <th className="px-3 py-3">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => {
            const person = assigneeOf(item)
            const progress = checklistProgress(item.task, item.checklistDone)
            const overdue = isOverdue(item.task.deadline, item.status)
            return (
              <tr key={item.id} className={`cursor-pointer transition-colors hover:bg-surface-muted/60 ${item.task.isCancelled ? 'opacity-60' : ''}`} onClick={() => onOpen(item)}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${taskKey(item.taskId)} for ${person?.name ?? 'assignee'}`}
                    checked={selected.has(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="h-4 w-4 rounded border-line-strong accent-brand-700 disabled:opacity-30"
                  />
                </td>
                <td className="max-w-[280px] px-3 py-2.5">
                  <p className="truncate font-medium text-ink"><span className="mr-1.5 font-mono text-xs text-muted">{taskKey(item.taskId)}</span>{item.task.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <span className={`rounded border px-1 ${PRIORITY_META[item.task.priority].className}`}>{PRIORITY_META[item.task.priority].label}</span>
                    {item.task.category}
                    {item.task.isCancelled && <span className="font-semibold text-muted">· Cancelled</span>}
                    {!!item._count?.comments && <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{item._count.comments}</span>}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-ink-soft">{person?.name ?? 'Unknown'}</p>
                  <span className={`rounded border px-1.5 text-[11px] ${ROLE_META[item.assigneeRole].className}`}>{ROLE_META[item.assigneeRole].label}</span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-ink-soft">{creatorLabel(item.task)}</p>
                  <SourceBadge item={item} />
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_META[item.status].className}`}>{STATUS_META[item.status].label}</span>
                </td>
                <td className={`px-3 py-3 text-xs ${overdue ? 'font-semibold text-rose-600' : 'text-muted'}`}>{deadlineLabel(item.task.deadline)}</td>
                <td className="px-3 py-3 text-xs text-muted">{progress.total ? `${progress.done}/${progress.total} steps` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Board({ items, counts, truncated, onOpen }: { items: TaskItem[]; counts: StatusCounts; truncated: boolean; onOpen: (item: TaskItem) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {STATUSES.map((status) => {
        const column = items.filter((i) => i.status === status)
        return (
          <section key={status} className="min-h-[200px] rounded-card border border-line bg-surface-muted/70 p-2.5" aria-label={STATUS_META[status].label}>
            <h3 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {STATUS_META[status].label}
              <span className="rounded-full bg-surface px-2 text-ink-soft ring-1 ring-inset ring-line">{counts[status]}</span>
            </h3>
            <div className="space-y-2">
              {column.map((item) => {
                const person = assigneeOf(item)
                const overdue = isOverdue(item.task.deadline, item.status)
                return (
                  <button key={item.id} type="button" onClick={() => onOpen(item)} className={`w-full rounded-lg border bg-surface p-3 text-left shadow-card transition hover:-translate-y-px hover:shadow-card-hover ${overdue ? 'border-rose-200' : 'border-line'} ${item.task.isCancelled ? 'opacity-60' : ''}`}>
                    <p className="text-[11px] font-mono text-muted">{taskKey(item.taskId)}</p>
                    <p className="line-clamp-2 text-sm font-medium text-ink">{item.task.title}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
                      <span className="font-medium text-ink-soft">{person?.name ?? 'Unknown'}</span>
                      <span className={`rounded border px-1 ${ROLE_META[item.assigneeRole].className}`}>{ROLE_META[item.assigneeRole].label}</span>
                      <SourceBadge item={item} />
                    </p>
                    <p className={`mt-1 text-[11px] ${overdue ? 'font-semibold text-rose-600' : 'text-muted'}`}>{deadlineLabel(item.task.deadline)}</p>
                  </button>
                )
              })}
              {truncated && column.length < counts[status] && <p className="px-1 text-[11px] text-muted">+{counts[status] - column.length} more (narrow the filters)</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
