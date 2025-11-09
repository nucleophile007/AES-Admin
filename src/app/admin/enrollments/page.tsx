'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

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

  async function fetchEnrollments() {
    try {
      setLoading(true)
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
      setLoading(false)
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
      await fetchEnrollments()
    } catch (err) {
      console.error('Error toggling access:', err)
      alert(err instanceof Error ? err.message : 'Failed to update access')
    }
  }

  function openReminderModal(enrollment: Enrollment) {
    if (!enrollment.student.parentEmail) {
      alert('No parent email available for this student')
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
      alert('Please fill in all required fields')
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

      alert('Payment reminder sent successfully!')
      closeReminderModal()
    } catch (err) {
      console.error('Error sending payment reminder:', err)
      alert(err instanceof Error ? err.message : 'Failed to send payment reminder')
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
      alert(err instanceof Error ? err.message : 'Failed to send message')
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Enrollments</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Program Filter Buttons */}
      {uniquePrograms.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Filter by Program:</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedProgram('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedProgram === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Programs ({enrollments.length})
            </button>
            {uniquePrograms.map((program) => {
              const count = enrollments.filter(e => e.program === program).length
              return (
                <button
                  key={program}
                  onClick={() => setSelectedProgram(program)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedProgram === program
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {program} ({count})
                </button>
              )
            })}
          </div>
          {selectedProgram !== 'all' && (
            <p className="text-sm text-gray-600 mt-3">
              Showing {filteredEnrollments.length} enrollment(s) for <span className="font-semibold">{selectedProgram}</span>
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Reminder
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chat
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  {selectedProgram === 'all' ? 'No enrollments found' : `No enrollments found for ${selectedProgram}`}
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.student.parentEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.program}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {enrollment.teacherStudents.length > 0
                      ? enrollment.teacherStudents.map(ts => ts.teacher.name).join(', ')
                      : 'No teacher assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        enrollment.access === 'blocked'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {enrollment.access === 'blocked' ? 'Blocked' : 'Unblocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleAccess(enrollment.id, enrollment.access)}
                      className={`px-4 py-2 rounded ${
                        enrollment.access === 'blocked'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } transition-colors`}
                    >
                      {enrollment.access === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openReminderModal(enrollment)}
                      disabled={!enrollment.student.parentEmail}
                      className={`px-4 py-2 rounded transition-colors ${
                        enrollment.student.parentEmail
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!enrollment.student.parentEmail ? 'No parent email available' : 'Send payment reminder'}
                    >
                      Send Reminder
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="relative inline-block">
                      <select
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === 'student') {
                            openChat(enrollment.studentId, 'student', enrollment.student.email)
                          } else if (value === 'parent' && enrollment.student.parentEmail) {
                            openChat(enrollment.studentId, 'parent', enrollment.student.parentEmail)
                          }
                          e.target.value = '' // Reset dropdown
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Chat with...</option>
                        <option value="student">Student</option>
                        <option value="parent" disabled={!enrollment.student.parentEmail}>
                          Parent{!enrollment.student.parentEmail ? ' (N/A)' : ''}
                        </option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Chat Modal */}
      {showChatModal && chatRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold">Chat with {chatRecipient.role === 'student' ? 'Student' : 'Parent'}</h2>
                  <p className="text-sm text-gray-600">{chatRecipient.name}</p>
                </div>
              </div>
              <button
                onClick={closeChatModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isAdmin = message.senderRole === 'admin'
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isAdmin
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isAdmin ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
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

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Reminder Modal */}
      {showReminderModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Send Payment Reminder</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Student:</strong> {selectedEnrollment.student.email}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Parent:</strong> {selectedEnrollment.student.parentEmail}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Program:</strong> {selectedEnrollment.program}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Subject:</strong> {selectedEnrollment.subject}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Information *
              </label>
              <textarea
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="Enter payment details (e.g., invoice number, payment method, notes)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., $500, ₹10000)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Invoice/Receipt (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.csv,.jpg,.jpeg,.png"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {paymentFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {paymentFile.name} ({(paymentFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeReminderModal}
                disabled={sendingEmail}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendPaymentReminder}
                disabled={sendingEmail || !paymentInfo || !dueDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
