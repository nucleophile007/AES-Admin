import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'

/**
 * Pass-through to the AES task engine (/api/integrations/admin/tasks/*).
 * The admin is checked here (Google sign-in + allowlist); AES trusts the
 * shared key plus the acting admin's email/name headers. All task rules
 * (including "mentor-created tasks are view-only") are enforced in AES.
 */

type RouteContext = { params: Promise<{ path?: string[] }> }

// Only these paths and methods are forwarded.
const ROUTES: Array<{ pattern: RegExp; methods: string[] }> = [
  { pattern: /^$/, methods: ['GET', 'POST'] },
  { pattern: /^(people|insights|export)$/, methods: ['GET'] },
  { pattern: /^(review|comments|bulk)$/, methods: ['POST'] },
  { pattern: /^items\/\d+$/, methods: ['GET'] },
  { pattern: /^\d+$/, methods: ['GET', 'PATCH', 'DELETE'] },
]

async function forward(request: NextRequest, context: RouteContext, method: string) {
  const authResult = await checkAdminAuth()
  if (!authResult.success || !authResult.session?.user?.email) {
    return NextResponse.json({ success: false, error: authResult.error || 'Not authorized' }, { status: authResult.statusCode || 403 })
  }

  const path = ((await context.params).path || []).join('/')
  const route = ROUTES.find((r) => r.pattern.test(path))
  if (!route) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  if (!route.methods.includes(method)) return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 })

  const aesApiBaseUrl = process.env.AES_API_BASE_URL
  const serviceKey = process.env.AES_ADMIN_TASKS_API_KEY
  if (!aesApiBaseUrl || !serviceKey) {
    console.error('AES_API_BASE_URL and AES_ADMIN_TASKS_API_KEY must be configured for admin tasks.')
    return NextResponse.json({ success: false, error: 'Task integration is not configured.' }, { status: 503 })
  }

  let upstreamUrl: URL
  try {
    const baseUrl = new URL(aesApiBaseUrl)
    if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost' && baseUrl.hostname !== '127.0.0.1') {
      return NextResponse.json({ success: false, error: 'AES_API_BASE_URL must use HTTPS.' }, { status: 503 })
    }
    upstreamUrl = new URL(`/api/integrations/admin/tasks${path ? `/${path}` : ''}`, baseUrl)
    request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.append(key, value))
  } catch {
    return NextResponse.json({ success: false, error: 'AES_API_BASE_URL is invalid.' }, { status: 503 })
  }

  const user = authResult.session.user
  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceKey}`,
    'x-admin-email': user.email!.toLowerCase(),
    // Header values must be plain ASCII.
    'x-admin-name': (user.name || '').replace(/[^\x20-\x7E]/g, '').slice(0, 100),
  }
  let body: string | undefined
  if (method === 'POST' || method === 'PATCH') {
    body = await request.text()
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(60_000),
    })
    const contentType = response.headers.get('content-type') || 'application/json'
    const passHeaders: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': 'private, no-store, max-age=0' }
    const disposition = response.headers.get('content-disposition')
    if (disposition) passHeaders['Content-Disposition'] = disposition
    if (response.status === 401) {
      console.error('AES rejected the admin task integration key.')
      return NextResponse.json({ success: false, error: 'AES task integration credentials are invalid.' }, { status: 502 })
    }
    return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: passHeaders })
  } catch (error) {
    console.error('Failed to reach AES task service:', error)
    return NextResponse.json({ success: false, error: 'Could not reach the AES task service.' }, { status: 502 })
  }
}

export const GET = (request: NextRequest, context: RouteContext) => forward(request, context, 'GET')
export const POST = (request: NextRequest, context: RouteContext) => forward(request, context, 'POST')
export const PATCH = (request: NextRequest, context: RouteContext) => forward(request, context, 'PATCH')
export const DELETE = (request: NextRequest, context: RouteContext) => forward(request, context, 'DELETE')
