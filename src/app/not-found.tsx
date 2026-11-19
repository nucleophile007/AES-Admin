import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import AuthScreen from '@/components/admin/AuthScreen'
import { buttonClass } from '@/components/admin/ui'

export default function NotFound() {
  return (
    <AuthScreen
      icon={Compass}
      tone="amber"
      eyebrow="Error 404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved. Check the address, or head back to the dashboard."
    >
      <Link href="/" className={buttonClass('primary', 'md', 'h-12 w-full rounded-xl text-[15px]')}>
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
    </AuthScreen>
  )
}
