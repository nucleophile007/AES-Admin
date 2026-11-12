import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const start = new Date(searchParams.get('start') || '')
  const end = new Date(searchParams.get('end') || '')
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
    return NextResponse.json({ error: 'A valid start and end date are required.' }, { status: 400 })
  }
  if (end.getTime() - start.getTime() > 93 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Calendar range cannot exceed 93 days.' }, { status: 400 })
  }

  const aesApiBaseUrl = process.env.AES_API_BASE_URL
  const serviceKey = process.env.AES_ADMIN_CALENDAR_API_KEY
  if (!aesApiBaseUrl || !serviceKey) {
    console.error('AES_API_BASE_URL and AES_ADMIN_CALENDAR_API_KEY must be configured for the admin calendar.')
    return NextResponse.json({ error: 'Mentor calendar integration is not configured.' }, { status: 503 })
  }

  try {
    const baseUrl = new URL(aesApiBaseUrl)
    if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost' && baseUrl.hostname !== '127.0.0.1') {
      return NextResponse.json({ error: 'AES_API_BASE_URL must use HTTPS.' }, { status: 503 })
    }
    const upstreamUrl = new URL('/api/integrations/admin/mentor-calendar', baseUrl)
    upstreamUrl.searchParams.set('start', start.toISOString())
    upstreamUrl.searchParams.set('end', end.toISOString())
    const response = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      console.error('AES mentor calendar API returned status', response.status)
      return NextResponse.json(
        { error: response.status === 401 ? 'AES calendar integration credentials are invalid.' : 'Could not load mentor calendar data from AES.' },
        { status: response.status === 400 ? 400 : response.status === 503 ? 503 : 502 },
      )
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
  } catch (error) {
    console.error('Failed to load admin mentor calendar:', error)
    return NextResponse.json({ error: 'Failed to reach AES mentor calendar service.' }, { status: 502 })
  }
}
