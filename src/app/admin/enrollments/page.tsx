'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { BellRing, BookOpen, Lock, MessageCircle, Search, Send, Unlock, X } from 'lucide-react'
import { toast } from 'sonner'
import AdminPageShell from '@/components/admin/AdminPageShell'
import { Badge, EmptyState, LoadingState, Panel, buttonClass, cx, inputClass } from '@/components/admin/ui'

interface Enrollment {
  id: number
  studentId: number
  program: string
  subject: string
  access: string
  student: {
    email: string
    parentEmail: string | null
  }
  teacherStudents: Array<{
    teacher: {
      name: string
    }
  }>
}

interface Message {
  id: string
  senderId: number
  senderRole: string
  recipientId: number
  recipientRole: string
  content: string
  createdAt: string
  updatedAt: string
  isRead: boolean
}

export default function EnrollmentsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [paymentInfo, setPaymentInfo] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Chat states
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatRecipient, setChatRecipient] = useState<{ id: number; role: 'student' | 'parent'; name: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEnrollments()
    }
  }, [status])

  async function fetchEnrollments(showLoading = true) {
    try {
      if (showLoading) setLoading(true)
      setError('')
      const response = await fetch('/api/admin/enrollments')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch enrollments')
      }

      const data = await response.json()
      setEnrollments(data.enrollments || [])
      setFilteredEnrollments(data.enrollments || [])
    } catch (err) {
      console.error('Error fetching enrollments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load enrollments')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Get unique programs from enrollments
  const uniquePrograms = Array.from(new Set(enrollments.map(e => e.program)))

  // Filter enrollments by selected program
  useEffect(() => {
    if (selectedProgram === 'all') {
      setFilteredEnrollments(enrollments)
    } else {
      setFilteredEnrollments(enrollments.filter(e => e.program === selectedProgram))
    }
  }, [selectedProgram, enrollments])

  async function toggleAccess(enrollmentId: number, currentAccess: string) {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/toggle-access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access: currentAccess === 'blocked' ? 'unblocked' : 'blocked'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update access')
      }

      // Refresh enrollments after update
      await fetchEnrollments(false)
    } catch (err) {
      console.error('Error toggling access:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update access')
    }
  }

  function openReminderModal(enrollment: Enrollment) {
    if (!enrollment.student.parentEmail) {
      toast.error('No parent email available for this student')
      return
    }
    setSelectedEnrollment(enrollment)
    setPaymentInfo('')
    setAmount('')
    setDueDate('')
    setPaymentFile(null)
    setShowReminderModal(true)
  }

  function closeReminderModal() {
    setShowReminderModal(false)
    setSelectedEnrollment(null)
    setPaymentInfo('')
    setAmount('')
    setDueDate('')
    setPaymentFile(null)
  }

  async function sendPaymentReminder() {
    if (!selectedEnrollment || !paymentInfo || !amount || !dueDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSendingEmail(true)
      
      // Create FormData for multipart form upload
      const formData = new FormData()
      formData.append('enrollmentId', selectedEnrollment.id.toString())
      formData.append('studentId', selectedEnrollment.studentId.toString())
      formData.append('studentEmail', selectedEnrollment.student.email)
      formData.append('parentEmail', selectedEnrollment.student.parentEmail || '')
      formData.append('program', selectedEnrollment.program)
      formData.append('subject', selectedEnrollment.subject)
      formData.append('paymentInfo', paymentInfo)
      formData.append('amount', amount)
      formData.append('dueDate', dueDate)
      
      if (paymentFile) {
        formData.append('file', paymentFile)
      }

      const response = await fetch('/api/admin/enrollments/send-payment-reminder', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send payment reminder')
      }

      toast.success('Payment reminder sent successfully!')
      closeReminderModal()
    } catch (err) {
      console.error('Error sending payment reminder:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to send payment reminder')
    } finally {
      setSendingEmail(false)
    }
  }

  // Chat functions
  async function openChat(recipientId: number, recipientRole: 'student' | 'parent', recipientName: string) {
    setChatRecipient({ id: recipientId, role: recipientRole, name: recipientName })
    setShowChatModal(true)
    await fetchMessages(recipientId, recipientRole)
  }

  function closeChatModal() {
    setShowChatModal(false)
    setChatRecipient(null)
    setMessages([])
    setNewMessage('')
  }

  async function fetchMessages(recipientId: number, recipientRole: string) {
    try {
      setLoadingMessages(true)
      const response = await fetch(
        `/api/admin/chat?recipientId=${recipientId}&recipientRole=${recipientRole}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  async function sendMessage() {
    if (!chatRecipient || !newMessage.trim()) return

    try {
      setSendingMessage(true)
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: chatRecipient.id,
          recipientRole: chatRecipient.role,
          content: newMessage.trim(),
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      // Clear input and refresh messages
      setNewMessage('')
      await fetchMessages(chatRecipient.id, chatRecipient.role)
    } catch (err) {
      console.error('Error sending message:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const q = search.trim().toLowerCase()
  const visibleEnrollments = q
    ? filteredEnrollments.filter((e) =>
        [e.student.email, e.student.parentEmail ?? '', e.program, e.subject, ...e.teacherStudents.map((ts) => ts.teacher.name)]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : filteredEnrollments

  const programChip = (active: boolean) =>
    cx(
      'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium transition',
      active ? 'bg-brand-700 text-white shadow-card' : 'bg-surface-muted text-ink-soft ring-1 ring-inset ring-line hover:bg-canvas hover:text-ink',
    )

  const fieldLabel = 'block text-sm font-medium text-ink-soft'

  return (
    <AdminPageShell moduleId="enrollments" description="Manage enrollments, program access, payment reminders and chat.">
      {error && (
        <div role="alert" className="mb-4 rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      <Panel className="overflow-hidden">
        {/* Search + program filter */}
        <div className="space-y-3 border-b border-line p-4">
          <label className="relative block">
            <span className="sr-only">Search enrollments</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, parent, subject or teacher…"
              className={cx(inputClass, 'pl-9')}
            />
          </label>
          {uniquePrograms.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Filter by program">
              <button type="button" onClick={() => setSelectedProgram('all')} className={programChip(selectedProgram === 'all')}>
                All programs <span className="text-xs opacity-70 tabular-nums">{enrollments.length}</span>
              </button>
              {uniquePrograms.map((program) => {
                const count = enrollments.filter((e) => e.program === program).length
                return (
                  <button key={program} type="button" onClick={() => setSelectedProgram(program)} className={programChip(selectedProgram === program)}>
                    {program} <span className="text-xs opacity-70 tabular-nums">{count}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {status === 'loading' || loading ? (
          <LoadingState label="Loading enrollments…" />
        ) : visibleEnrollments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={enrollments.length ? 'No enrollments match your filters' : 'No enrollments found'}
            description={
              enrollments.length
                ? selectedProgram === 'all' ? 'Try a different search.' : `Nothing matches in ${selectedProgram}.`
                : 'Enrollments appear here once students are enrolled in a program.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Chat</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleEnrollments.map((enrollment) => {
                  const blocked = enrollment.access === 'blocked'
                  const parentEmail = enrollment.student.parentEmail
                  return (
                    <tr key={enrollment.id} className="align-top transition-colors hover:bg-surface-muted/60">
                      <td className="max-w-[260px] px-5 py-4">
                        <p className="truncate font-medium text-ink" title={enrollment.student.email}>{enrollment.student.email}</p>
                        <p className="mt-1 truncate text-xs text-muted" title={parentEmail ?? undefined}>
                          Parent: {parentEmail || <span className="text-subtle">not on file</span>}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-4 py-4">
                        <Badge tone="brand">{enrollment.program}</Badge>
                        <p className="mt-1.5 truncate text-xs text-muted">{enrollment.subject}</p>
                      </td>
                      <td className="max-w-[200px] px-4 py-4">
                        {enrollment.teacherStudents.length > 0 ? (
                          <p className="truncate text-ink-soft">{enrollment.teacherStudents.map((ts) => ts.teacher.name).join(', ')}</p>
                        ) : (
                          <span className="text-xs text-subtle">No teacher assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {blocked ? <Badge tone="rose" icon={Lock}>Blocked</Badge> : <Badge tone="emerald" icon={Unlock}>Unblocked</Badge>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5">
                          <button
                            type="button"
                            onClick={() => openChat(enrollment.studentId, 'student', enrollment.student.email)}
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-ink-soft transition hover:bg-surface hover:text-brand-700 hover:shadow-card"
                            title="Chat with student"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Student
                          </button>
                          <button
                            type="button"
                            onClick={() => parentEmail && openChat(enrollment.studentId, 'parent', parentEmail)}
                            disabled={!parentEmail}
                            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-ink-soft transition hover:bg-surface hover:text-brand-700 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none"
                            title={parentEmail ? 'Chat with parent' : 'No parent email available'}
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Parent
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openReminderModal(enrollment)}
                            disabled={!parentEmail}
                            className={buttonClass('secondary', 'sm')}
                            title={!parentEmail ? 'No parent email available' : 'Send payment reminder'}
                          >
                            <BellRing className="h-3.5 w-3.5" /> Reminder
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAccess(enrollment.id, enrollment.access)}
                            className={buttonClass(blocked ? 'success' : 'dangerOutline', 'sm', 'min-w-[84px]')}
                          >
                            {blocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            {blocked ? 'Unblock' : 'Block'}
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

      {/* Chat Modal */}
      {showChatModal && chatRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
          <div className="flex h-[600px] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">Chat with {chatRecipient.role === 'student' ? 'student' : 'parent'}</h2>
                  <p className="truncate text-sm text-muted">{chatRecipient.name}</p>
                </div>
              </div>
              <button type="button" onClick={closeChatModal} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close chat">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-muted/70 p-5">
              {loadingMessages ? (
                <LoadingState label="Loading messages…" />
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">No messages yet. Start the conversation!</div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isAdmin = message.senderRole === 'admin'
                    return (
                      <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={cx(
                            'max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-card',
                            isAdmin ? 'rounded-br-md bg-brand-700 text-white' : 'rounded-bl-md border border-line bg-surface text-ink',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <p className={`mt-1 text-[11px] ${isAdmin ? 'text-brand-100' : 'text-subtle'}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-line bg-surface p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message…"
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button type="button" onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} className={buttonClass('primary')}>
                  <Send className="h-4 w-4" />
                  {sendingMessage ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p className="mt-2 text-xs text-subtle">Press Enter to send, Shift+Enter for a new line</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Reminder Modal */}
      {showReminderModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-ink">Send payment reminder</h2>
                <p className="mt-0.5 text-sm text-muted">Emails the parent with the details below.</p>
              </div>
              <button type="button" onClick={closeReminderModal} disabled={sendingEmail} className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-line bg-surface-muted/60 p-3 text-sm">
                <dt className="text-muted">Student</dt><dd className="truncate text-ink">{selectedEnrollment.student.email}</dd>
                <dt className="text-muted">Parent</dt><dd className="truncate text-ink">{selectedEnrollment.student.parentEmail}</dd>
                <dt className="text-muted">Program</dt><dd className="truncate text-ink">{selectedEnrollment.program}</dd>
                <dt className="text-muted">Subject</dt><dd className="truncate text-ink">{selectedEnrollment.subject}</dd>
              </dl>

              <label className={fieldLabel}>
                Payment information <span className="text-rose-600">*</span>
                <textarea
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="Invoice number, payment method, notes…"
                  className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                  rows={3}
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={fieldLabel}>
                  Amount <span className="text-rose-600">*</span>
                  <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$500" className={cx(inputClass, 'mt-1.5')} required />
                </label>
                <label className={fieldLabel}>
                  Due date <span className="text-rose-600">*</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cx(inputClass, 'mt-1.5')} required />
                </label>
              </div>

              <label className={fieldLabel}>
                Attach invoice or receipt <span className="font-normal text-subtle">(optional)</span>
                <input
                  type="file"
                  accept=".pdf,.csv,.jpg,.jpeg,.png"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full rounded-lg border border-dashed border-line-strong bg-surface-muted/60 p-2 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {paymentFile && (
                  <span className="mt-1.5 block text-xs font-normal text-muted">
                    Selected: {paymentFile.name} ({(paymentFile.size / 1024).toFixed(2)} KB)
                  </span>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line bg-surface-muted/60 px-5 py-3">
              <button type="button" onClick={closeReminderModal} disabled={sendingEmail} className={buttonClass('secondary')}>Cancel</button>
              <button type="button" onClick={sendPaymentReminder} disabled={sendingEmail || !paymentInfo || !dueDate} className={buttonClass('primary')}>
                <BellRing className="h-4 w-4" />
                {sendingEmail ? 'Sending…' : 'Send reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
