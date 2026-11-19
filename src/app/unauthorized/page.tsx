'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, ShieldAlert } from 'lucide-react'
import AuthScreen from '@/components/admin/AuthScreen'
import { buttonClass } from '@/components/admin/ui'

export default function UnauthorizedPage() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <AuthScreen
      icon={ShieldAlert}
      tone="rose"
      eyebrow="Access check"
      title="Access denied"
      description="This account doesn't have permission to use the admin console. Sign out and try an authorized account, or ask the administrator for access."
    >
      {session?.user?.email && (
        <div className="mb-4 rounded-xl border border-line bg-surface-muted px-4 py-3 text-sm">
          <p className="text-xs text-muted">Signed in as</p>
          <p className="truncate font-medium text-ink">{session.user.email}</p>
        </div>
      )}
      <button type="button" onClick={handleSignOut} className={buttonClass('primary', 'md', 'h-12 w-full rounded-xl text-[15px]')}>
        <LogOut className="h-4 w-4" /> Sign out and switch account
      </button>
    </AuthScreen>
  )
}
