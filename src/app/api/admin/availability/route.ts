import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

const HALF_HOUR_SLOT_PATTERN = /^(1[0-2]|[1-9]):(00|30)\s(AM|PM)$/

function normalizeHalfHourTimes(times: unknown): string[] {
  if (!Array.isArray(times)) return []
  return Array.from(
    new Set(
      times
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter((t) => HALF_HOUR_SLOT_PATTERN.test(t))
    )
  ).sort((a, b) => a.localeCompare(b))
}

export async function GET() {
  // Validate admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const rawDays = await prisma.availabilityDay.findMany({
      where: { adminEmail: authResult.session!.user!.email! },
      orderBy: { date: 'asc' }
    })

    const dayMap = new Map<string, Set<string>>()
    for (const day of rawDays) {
      const dateKey = day.date
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, new Set())
      }
      const set = dayMap.get(dateKey)!
      for (const time of normalizeHalfHourTimes(day.times)) {
        set.add(time)
      }
    }

    const days = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, times]) => ({
        date,
        times: Array.from(times).sort((a, b) => a.localeCompare(b))
      }))

    return Response.json({ days })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return Response.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Validate admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const body = await req.json()

    const items: Array<{ date: string; times: string[] | null | undefined }> = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
        ? body.items
        : body?.date
          ? [{ date: body.date, times: body.times }]
          : []

    if (!items.length) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const adminEmail = authResult.session!.user!.email!

    const deletedDates: string[] = []
    const normalizedByDate = new Map<string, string[]>()

    for (const it of items) {
      if (!it?.date) {
        return Response.json({ error: 'Invalid item in payload - date is required' }, { status: 400 })
      }

      normalizedByDate.set(it.date, normalizeHalfHourTimes(it?.times))
    }

    for (const [date, timesArr] of normalizedByDate.entries()) {
      if (timesArr.length === 0) {
        // Delete the date combination if exists for this admin
        await prisma.availabilityDay.deleteMany({
          where: {
            date,
            adminEmail: adminEmail
          }
        })
        deletedDates.push(date)
      } else {
        const existingDays = await prisma.availabilityDay.findMany({
          where: {
            date,
            adminEmail: adminEmail
          },
          orderBy: { id: 'asc' }
        })

        if (existingDays.length === 0) {
          await prisma.availabilityDay.create({
            data: {
              date,
              times: timesArr,
              adminEmail: adminEmail
            }
          })
          continue
        }

        const [keep, ...dupes] = existingDays
        await prisma.availabilityDay.update({
          where: { id: keep.id },
          data: { times: timesArr }
        })

        if (dupes.length > 0) {
          await prisma.availabilityDay.deleteMany({
            where: {
              id: { in: dupes.map((d) => d.id) }
            }
          })
        }
      }
    }

    const days = await prisma.availabilityDay.findMany({
      where: { adminEmail },
      orderBy: { date: 'asc' }
    })

    return Response.json({ days, deletedDates })
  } catch (e) {
    console.error('Availability POST error', e)
    return Response.json({ error: 'Failed to save availability' }, { status: 500 })
  }
}
