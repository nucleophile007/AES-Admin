import { getServerSession } from 'next-auth'
import { authOptions, allowedEmails } from '@/lib/authOptions'

export interface AdminAuthResult {
  success: boolean
  session?: any
  error?: string
  statusCode?: number
}

/**
 * Server-side admin authentication helper
 * Validates that the user is authenticated and has admin privileges
 */
export async function validateAdminAuth(): Promise<AdminAuthResult> {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Not authenticated - please sign in',
        statusCode: 401
      }
    }

    // Check if email is in allowed admin list
    const userEmail = session.user.email.toLowerCase()
    if (!allowedEmails.includes(userEmail)) {
      return {
        success: false,
        error: `Not authorized - admin access required. Email ${userEmail} is not in the allowed list.`,
        statusCode: 403
      }
    }

    return {
      success: true,
      session
    }
  } catch (error) {
    console.error('Admin auth validation error:', error)
    return {
      success: false,
      error: 'Authentication validation failed',
      statusCode: 500
    }
  }
}

/**
 * Middleware wrapper for admin API routes
 */
export function withAdminAuth(handler: (session: any, ...args: any[]) => Promise<Response>) {
  return async (...args: any[]): Promise<Response> => {
    const authResult = await validateAdminAuth()
    
    if (!authResult.success) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.statusCode || 500 }
      )
    }

    return handler(authResult.session, ...args)
  }
}
