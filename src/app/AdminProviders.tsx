"use client"

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import type { ReactNode } from 'react'

export default function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  )
}
