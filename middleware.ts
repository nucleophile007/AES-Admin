import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { allowedEmails } from "./src/lib/adminConfig"

export default auth((req: any) => {
  const { pathname } = req.nextUrl

  // Allow access to auth, unauthorized, API auth, and QStash job endpoints without authentication
  if (
    pathname.startsWith('/auth') || 
    pathname.startsWith('/unauthorized') || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/jobs/') ||
    pathname.startsWith('/api/webhooks/')
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!req.auth) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  const email = req.auth.user?.email?.toLowerCase() || ''

  console.log("🛡️ Middleware Check:", { pathname, email, allowedEmails, isAllowed: allowedEmails.includes(email) })

  // Check if the user's email is in the allowed list
  if (!allowedEmails.includes(email)) {
    const url = req.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
