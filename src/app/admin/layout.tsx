import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { allowedEmails } from '@/lib/adminConfig'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/')
  }

  // Check if user is authorized admin
  if (!allowedEmails.includes(session.user.email.toLowerCase())) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
