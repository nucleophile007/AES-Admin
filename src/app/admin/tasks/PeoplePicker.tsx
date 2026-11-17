'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle, Search, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_META, buttonClass, fieldClass, inputClass, taskApi, type AssigneeRole, type Person } from './taskUtils'

export type PeopleSelection = Record<AssigneeRole, Record<number, Person>>

export const emptySelection = (): PeopleSelection => ({ STUDENT: {}, TEACHER: {}, PARENT: {} })

export const selectionCount = (s: PeopleSelection) =>
  Object.keys(s.STUDENT).length + Object.keys(s.TEACHER).length + Object.keys(s.PARENT).length

export const selectionIds = (s: PeopleSelection) => ({
  studentIds: Object.keys(s.STUDENT).map(Number),
  teacherIds: Object.keys(s.TEACHER).map(Number),
  parentIds: Object.keys(s.PARENT).map(Number),
})

interface PeopleResult extends Person {
  grade?: string | null
  program?: string | null
  programs?: string[]
  students?: { id: number; name: string }[]
}

interface PeopleResponse {
  people: PeopleResult[]
  total: number
  programs?: string[]
}

const ROLES: AssigneeRole[] = ['STUDENT', 'TEACHER', 'PARENT']

/**
 * Choose any mix of students, mentors and parents. Students can be narrowed
 * by program or by mentor; "Select all" adds every match; parents can be
 * picked as "parents of the selected students".
 */
export function PeoplePicker({
  value,
  onChange,
  mentors,
  alreadyAssigned,
}: {
  value: PeopleSelection
  onChange: (next: PeopleSelection) => void
  mentors: Person[]
  /** People already on the task (shown as assigned, not selectable). */
  alreadyAssigned?: Set<string>
}) {
  const [role, setRole] = useState<AssigneeRole>('STUDENT')
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [program, setProgram] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [programs, setPrograms] = useState<string[]>([])
  const [data, setData] = useState<PeopleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const params = useMemo(() => {
    const p = new URLSearchParams({ role })
    if (debounced) p.set('q', debounced)
    if (role === 'STUDENT' && program) p.set('program', program)
    if (role === 'STUDENT' && mentorId) p.set('teacherId', mentorId)
    return p
  }, [role, debounced, program, mentorId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const p = new URLSearchParams(params)
    if (!programs.length) p.set('programs', '1')
    taskApi<PeopleResponse>(`/people?${p}`)
      .then((res) => {
        if (cancelled) return
        setData(res)
        if (res.programs) setPrograms(res.programs)
      })
      .catch((err) => !cancelled && toast.error((err as Error).message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // programs only needs loading once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const selected = value[role]
  const toggle = (person: Person) => {
    const next = { ...value, [role]: { ...value[role] } }
    if (next[role][person.id]) delete next[role][person.id]
    else next[role][person.id] = { id: person.id, name: person.name, email: person.email }
    onChange(next)
  }

  const addMany = (r: AssigneeRole, people: Person[]) => {
    const next = { ...value, [r]: { ...value[r] } }
    people.forEach((p) => {
      if (!alreadyAssigned?.has(`${r}:${p.id}`)) next[r][p.id] = { id: p.id, name: p.name, email: p.email }
    })
    onChange(next)
  }

  const selectAllMatching = async () => {
    setBulkLoading(true)
    try {
      const p = new URLSearchParams(params)
      p.set('all', '1')
      const res = await taskApi<PeopleResponse>(`/people?${p}`)
      addMany(role, res.people)
      toast.success(`Added ${res.people.length} ${ROLE_META[role].plural.toLowerCase()}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBulkLoading(false)
    }
  }

  const addParentsOfSelectedStudents = async () => {
    const studentIds = Object.keys(value.STUDENT)
    if (!studentIds.length) return
    setBulkLoading(true)
    try {
      const res = await taskApi<PeopleResponse>(`/people?role=PARENT&all=1&studentIds=${studentIds.join(',')}`)
      addMany('PARENT', res.people)
      toast.success(
        res.people.length
          ? `Added ${res.people.length} parent account${res.people.length === 1 ? '' : 's'}`
          : 'None of the selected students have a parent account yet'
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBulkLoading(false)
    }
  }

  const chips = ROLES.flatMap((r) => Object.values(value[r]).map((p) => ({ role: r, person: p })))

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1.5" role="tablist" aria-label="Who to assign">
        {ROLES.map((r) => {
          const count = Object.keys(value[r]).length
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${role === r ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {ROLE_META[r].plural}
              {count > 0 && <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 text-xs text-white">{count}</span>}
            </button>
          )
        })}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${ROLE_META[role].plural.toLowerCase()} by name or email`}
              className={`${inputClass} pl-8`}
              aria-label={`Search ${ROLE_META[role].plural.toLowerCase()}`}
            />
          </div>
          {role === 'STUDENT' && (
            <>
              <select value={program} onChange={(e) => setProgram(e.target.value)} className={`${fieldClass} w-auto`} aria-label="Filter by program">
                <option value="">All programs</option>
                {programs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className={`${fieldClass} w-auto`} aria-label="Filter by mentor">
                <option value="">Any mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}&apos;s students</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>{loading ? 'Searching…' : `${data?.total ?? 0} match${data?.total === 1 ? '' : 'es'}`}</span>
          <div className="flex flex-wrap gap-2">
            {role === 'PARENT' && (
              <button type="button" className={buttonClass} disabled={bulkLoading || !Object.keys(value.STUDENT).length} onClick={() => void addParentsOfSelectedStudents()} title="Adds the parent accounts linked to the students you selected">
                <Users className="h-3.5 w-3.5" /> Parents of selected students
              </button>
            )}
            <button type="button" className={buttonClass} disabled={bulkLoading || !data?.total} onClick={() => void selectAllMatching()}>
              {bulkLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Select all {data?.total ?? ''} matching
            </button>
          </div>
        </div>

        <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200" aria-label="Search results">
          {loading && !data ? (
            <li className="flex items-center justify-center p-6 text-slate-400"><LoaderCircle className="h-5 w-5 animate-spin" /></li>
          ) : !data?.people.length ? (
            <li className="p-4 text-center text-sm text-slate-500">No {ROLE_META[role].plural.toLowerCase()} found.</li>
          ) : (
            data.people.map((p) => {
              const assigned = alreadyAssigned?.has(`${role}:${p.id}`)
              const isSelected = Boolean(selected[p.id])
              return (
                <li key={p.id}>
                  <label className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 ${assigned ? 'cursor-not-allowed opacity-60' : ''}`}>
                    <input type="checkbox" checked={assigned || isSelected} disabled={assigned} onChange={() => toggle(p)} className="h-4 w-4 rounded border-slate-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{p.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {p.email}
                        {p.program ? ` · ${p.program}` : ''}
                        {p.grade ? ` · Grade ${p.grade}` : ''}
                        {p.students?.length ? ` · Parent of ${p.students.map((s) => s.name).join(', ')}` : ''}
                      </span>
                    </span>
                    {assigned && <span className="text-xs text-slate-500">Already assigned</span>}
                  </label>
                </li>
              )
            })
          )}
        </ul>
        {data && data.total > data.people.length && (
          <p className="text-xs text-slate-500">Showing the first {data.people.length}. Search to narrow, or use “Select all”.</p>
        )}

        {chips.length > 0 && (
          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span><Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />{chips.length} selected</span>
              <button type="button" className="text-blue-700 hover:underline" onClick={() => onChange(emptySelection())}>Clear all</button>
            </div>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {chips.slice(0, 60).map(({ role: r, person }) => (
                <span key={`${r}:${person.id}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${ROLE_META[r].className}`}>
                  {person.name}
                  <span className="opacity-70">({ROLE_META[r].label})</span>
                  <button
                    type="button"
                    aria-label={`Remove ${person.name}`}
                    onClick={() => {
                      const next = { ...value, [r]: { ...value[r] } }
                      delete next[r][person.id]
                      onChange(next)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {chips.length > 60 && <span className="text-xs text-slate-500">+{chips.length - 60} more</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
