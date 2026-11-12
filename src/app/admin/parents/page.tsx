"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Edit3, Loader2, Mail, Save, Users, X } from "lucide-react"
import { toast } from "sonner"

interface Parent {
  id: number
  name: string
  email: string
  phone: string | null
  isActivated: boolean
  students: Array<{ id: number; name: string; email: string }>
}

export default function ParentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Parent | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)

  const loadParents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/parents")
      if (!response.ok) throw new Error("Failed to load parents")
      const data = await response.json()
      setParents(data.parents || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load parents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin")
    if (status === "authenticated") void loadParents()
  }, [status, router])

  const saveParent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setError("")
    try {
      const response = await fetch("/api/admin/parents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update parent")
      setParents((current) => current.map((parent) => parent.id === data.parent.id ? data.parent : parent))
      setEditing(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update parent")
    } finally {
      setSaving(false)
    }
  }

  const resendActivation = async (parent: Parent) => {
    setSendingId(parent.id)
    setError("")
    try {
      const response = await fetch(`/api/admin/parents/${parent.id}/send-activation`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to resend activation")
      toast.success(data.message)
      setParents((current) => current.map((item) => item.id === parent.id ? { ...item, isActivated: false } : item))
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to resend activation")
    } finally {
      setSendingId(null)
    }
  }

  if (status === "loading" || !session) return <div className="p-8">Loading...</div>

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Admin Dashboard</p>
            <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
            <p className="mt-1 text-gray-600">Edit parent contact details and resend activation links.</p>
          </div>
          <button onClick={() => router.push("/")} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800">Back to Dashboard</button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="divide-y divide-gray-200">
              {parents.map((parent) => (
                <div key={parent.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><Users className="h-5 w-5" /></div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{parent.name}</h2>
                        <p className="text-sm text-gray-600">{parent.email}{parent.phone ? ` · ${parent.phone}` : ""}</p>
                        <p className="mt-1 text-xs text-gray-500">Student{parent.students.length === 1 ? "" : "s"}: {parent.students.map((student) => student.name).join(", ") || "None"}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${parent.isActivated ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {parent.isActivated ? "Activated" : "Not activated"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditing(parent)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit3 className="h-4 w-4" /> Edit</button>
                      <button onClick={() => void resendActivation(parent)} disabled={sendingId === parent.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {sendingId === parent.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Resend Activation
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!parents.length && <div className="p-12 text-center text-gray-500">No parent accounts found.</div>}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveParent} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Parent</h2>
              <button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              {(["name", "email", "phone"] as const).map((field) => (
                <label key={field} className="block text-sm font-medium capitalize text-gray-700">
                  {field}
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={editing[field] || ""}
                    onChange={(event) => setEditing({ ...editing, [field]: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    required={field !== "phone"}
                  />
                </label>
              ))}
            </div>
            <button type="submit" disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
