import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { allowedEmails } from '@/lib/adminConfig'
import type { Session } from 'next-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions) as Session | null
  
  if (!session?.user?.email) {
    redirect('/')
  }

  // Check if user is authorized admin
  if (!allowedEmails.includes(session.user.email.toLowerCase())) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
