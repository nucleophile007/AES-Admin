'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { KeyRound, Loader2, ShieldCheck, UserCheck } from 'lucide-react'
import AuthScreen from '@/components/admin/AuthScreen'

type ProvidersType = Awaited<ReturnType<typeof getProviders>>

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function SignInPage() {
  const [providers, setProviders] = useState<ProvidersType>(null)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      const providers = await getProviders()
      setProviders(providers)
    }
    fetchProviders()
  }, [])

  return (
    <AuthScreen
      icon={ShieldCheck}
      eyebrow="Secure sign-in"
      title="Welcome back"
      description="Sign in with your authorized Google account to open the admin console."
      footer={<>Need access? Ask an existing admin to add your email to the approved list.</>}
    >
      {!providers ? (
        <div className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sign-in options…
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(providers).map((provider) => (
            <button
              key={provider.name}
              type="button"
              disabled={pending !== null}
              onClick={() => {
                setPending(provider.id)
                void signIn(provider.id, { callbackUrl: '/' })
              }}
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-surface text-[15px] font-semibold text-ink shadow-card transition hover:-translate-y-px hover:border-brand-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
            >
              {pending === provider.id ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : provider.id === 'google' ? <GoogleMark /> : null}
              {pending === provider.id ? 'Redirecting to Google…' : `Continue with ${provider.name}`}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-2">
        <li className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-inset ring-line">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-brand-600" /> Google single sign-on
        </li>
        <li className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-inset ring-line">
          <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Approved admins only
        </li>
      </ul>
    </AuthScreen>
  )
}
