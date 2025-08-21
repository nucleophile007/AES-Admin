import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/')
  }

  // Check if user is authorized admin
  const allowedEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
  if (!allowedEmails.includes(session.user.email)) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
