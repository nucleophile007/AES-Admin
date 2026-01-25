import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { allowedEmails } from "./src/lib/adminConfig"

export default withAuth(
  function middleware(req) {
    // This function will only run if the user is authenticated
    const { pathname } = req.nextUrl
    const email = req.nextauth.token?.email?.toLowerCase() || ''
    
    console.log("🛡️ Middleware Check:", { pathname, email, allowedEmails, isAllowed: allowedEmails.includes(email) })
    
    // Check if the user's email is in the allowed list
    if (!allowedEmails.includes(email)) {
      const url = req.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth and unauthorized pages without authentication
        if (pathname.startsWith('/auth') || pathname.startsWith('/unauthorized') || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // For all other pages, require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
