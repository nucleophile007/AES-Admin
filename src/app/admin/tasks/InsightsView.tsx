'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { LoaderCircle } from 'lucide-react'
import { ROLE_META, STATUS_META, fieldClass, taskApi, type AssigneeRole, type TaskStatus } from './taskUtils'

interface InsightsResponse {
  days: number
  summary: { total: number; completed: number; completionRate: number; avgReviewHours: number | null; stuck: number }
  assignees: Array<{
    studentName: string
    assigneeRole: AssigneeRole
    assigneeId: number
    total: number
    completed: number
    overdue: number
    completionRate: number
    onTimeRate: number | null
    [key: string]: unknown
  }>
  categories: Array<{ category: string; total: number; completed: number }>
  stuck: Array<{
    studentTaskId: number
    taskId: number
    title: string
    assigneeName: string
    assigneeRole: AssigneeRole
    fromAdmin: boolean
    status: TaskStatus
    since: string
  }>
}

const pct = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v * 100)}%`)

/** Completion, review time, stuck items and per-person breakdown for the current scope. */
export function InsightsView({ scopeQuery, onOpen }: { scopeQuery: string; onOpen: (taskId: number, itemId: number) => void }) {
  const [days, setDays] = useState('90')
  const { data, error, isLoading } = useSWR<InsightsResponse>(
    `/insights?${scopeQuery}${scopeQuery ? '&' : ''}days=${days}`,
    (path: string) => taskApi<InsightsResponse>(path),
    { revalidateOnFocus: false }
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Tasks created in the selected period, for the source and assignee filters above.</p>
        <select value={days} onChange={(e) => setDays(e.target.value)} className={`${fieldClass} w-auto`} aria-label="Period">
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {!data ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          {error ? (error as Error).message : isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {([
              ['Task copies', data.summary.total],
              ['Completed', data.summary.completed],
              ['Completion rate', pct(data.summary.completionRate)],
              ['Avg. review time', data.summary.avgReviewHours == null ? '—' : `${Math.round(data.summary.avgReviewHours)} h`],
              ['Stuck', data.summary.stuck],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-ink">Stuck (no movement for a while)</h3>
              {!data.stuck.length ? (
                <p className="text-sm text-muted">Nothing is stuck.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {data.stuck.map((s) => (
                    <li key={s.studentTaskId}>
                      <button type="button" className="w-full py-2 text-left hover:bg-surface-muted" onClick={() => onOpen(s.taskId, s.studentTaskId)}>
                        <span className="font-medium text-ink">{s.title}</span>
                        <span className="block text-xs text-muted">
                          {s.assigneeName} ({ROLE_META[s.assigneeRole]?.label ?? s.assigneeRole}) · {STATUS_META[s.status]?.label} since {new Date(s.since).toLocaleDateString()}
                          {s.fromAdmin ? '' : ' · mentor task'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-ink">By category</h3>
              <ul className="space-y-2 text-sm">
                {data.categories.map((c) => (
                  <li key={c.category}>
                    <div className="flex justify-between text-xs text-muted"><span>{c.category}</span><span>{c.completed}/{c.total}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-surface-muted">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${c.total ? (c.completed / c.total) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
                {!data.categories.length && <li className="text-muted">No tasks in this period.</li>}
              </ul>
            </section>
          </div>

          <section className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5">Person</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Tasks</th>
                  <th className="px-4 py-2.5">Completed</th>
                  <th className="px-4 py-2.5">Overdue</th>
                  <th className="px-4 py-2.5">On time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.assignees.map((a) => (
                  <tr key={`${a.assigneeRole}:${a.assigneeId}`}>
                    <td className="px-4 py-2 font-medium text-ink">{a.studentName}</td>
                    <td className="px-4 py-2"><span className={`rounded border px-1.5 text-xs ${ROLE_META[a.assigneeRole]?.className}`}>{ROLE_META[a.assigneeRole]?.label}</span></td>
                    <td className="px-4 py-2">{a.total}</td>
                    <td className="px-4 py-2">{a.completed} ({pct(a.completionRate)})</td>
                    <td className={`px-4 py-2 ${a.overdue ? 'font-semibold text-rose-600' : ''}`}>{a.overdue}</td>
                    <td className="px-4 py-2">{pct(a.onTimeRate)}</td>
                  </tr>
                ))}
                {!data.assignees.length && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No tasks in this period.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
