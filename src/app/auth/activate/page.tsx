"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Lock, User, XCircle } from "lucide-react"
import AuthScreen from "@/components/admin/AuthScreen"
import { buttonClass } from "@/components/admin/ui"

const STUDENT_PORTAL_URL = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL || process.env.NEXT_PUBLIC_USER_SITE_URL || 'http://localhost:3001'
const PARENT_PORTAL_URL = process.env.NEXT_PUBLIC_PARENT_PORTAL_URL || STUDENT_PORTAL_URL
const TEACHER_PORTAL_URL = process.env.NEXT_PUBLIC_TEACHER_PORTAL_URL || STUDENT_PORTAL_URL

function ActivateContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{
    name: string
    email: string
    role: string
    expiresAt: string
  } | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Verify the token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No activation token provided")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/auth/activate?token=${token}`)
        
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Invalid activation token")
        }

        const data = await res.json()
        setUserData(data.user)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validate password
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to activate account")
      }

      setSuccess(true)
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AuthScreen audience="account" eyebrow="Account setup" icon={Loader2} iconClassName="animate-spin" title="Verifying your activation link" description="Please wait while we check your account…">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-inset ring-line">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-600" />
        </div>
      </AuthScreen>
    )
  }

  if (error) {
    return (
      <AuthScreen audience="account" eyebrow="Account setup" icon={XCircle} tone="rose" title="Activation failed" description={error}>
        <a href="/auth/signin" className={buttonClass("primary", "md", "h-12 w-full rounded-xl text-[15px]")}>Return to sign in</a>
      </AuthScreen>
    )
  }

  if (success) {
    // Determine the redirect URL based on role
    let redirectUrl = '/auth/signin'
    let roleMessage = 'admin dashboard'

    if (userData?.role === 'TEACHER') {
      redirectUrl = TEACHER_PORTAL_URL
      roleMessage = 'teacher portal'
    } else if (userData?.role === 'STUDENT') {
      redirectUrl = STUDENT_PORTAL_URL
      roleMessage = 'student portal'
    } else if (userData?.role === 'PARENT') {
      redirectUrl = PARENT_PORTAL_URL
      roleMessage = 'parent portal'
    }

    return (
      <AuthScreen
        audience="account"
        eyebrow="All set"
        icon={CheckCircle2}
        tone="emerald"
        title="Account activated"
        description={`Your account is ready. Sign in to the ${roleMessage} with your email and the password you just created.`}
        footer={
          (userData?.role === 'TEACHER' || userData?.role === 'STUDENT') ? (
            <>You will be taken to <span className="font-mono text-ink-soft">{redirectUrl}</span></>
          ) : undefined
        }
      >
        <a href={redirectUrl} className={buttonClass("primary", "md", "h-12 w-full rounded-xl text-[15px]")}>
          Go to {roleMessage === 'admin dashboard' ? 'sign in' : 'portal'} <ArrowRight className="h-4 w-4" />
        </a>
      </AuthScreen>
    )
  }

  const fieldClass = "h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm text-ink shadow-card outline-none transition placeholder:text-subtle focus:border-brand-300 focus:ring-4 focus:ring-brand-100"

  return (
    <AuthScreen
      audience="account"
      eyebrow="Account setup"
      icon={KeyRound}
      title="Set your password"
      description="Create a password to activate your Acharya account."
      footer={
        <>Already have an account? <a href="/auth/signin" className="font-medium text-brand-700 hover:underline">Sign in</a></>
      }
    >
      {userData && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-card">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{userData.name}</p>
            <p className="truncate text-xs text-muted">{userData.email}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium capitalize text-ink-soft ring-1 ring-inset ring-line">
            {userData.role.toLowerCase()}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-soft">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${fieldClass} pr-16`}
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink-soft">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass}
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>

        {formError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formError}</div>
        )}

        <button type="submit" disabled={submitting} className={buttonClass("primary", "md", "h-12 w-full rounded-xl text-[15px]")}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Activating…</> : "Activate account"}
        </button>
      </form>
    </AuthScreen>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <AuthScreen audience="account" icon={Loader2} iconClassName="animate-spin" title="Loading…" />
    }>
      <ActivateContent />
    </Suspense>
  )
}
