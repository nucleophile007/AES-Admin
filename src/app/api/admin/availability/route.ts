import { validateAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Validate admin authentication
  const authResult = await validateAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const program = searchParams.get('program')
    
    const whereClause = program ? { program } : {}
    
    const days = await prisma.availabilityDay.findMany({ 
      where: whereClause,
      orderBy: { date: 'asc' } 
    })
    return Response.json({ days })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return Response.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Validate admin authentication
  const authResult = await validateAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const body = await req.json()

    const items: Array<{ date: string; times: string[] | null | undefined; program: string }> = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
        ? body.items
        : body?.date && body?.program
          ? [{ date: body.date, times: body.times, program: body.program }]
          : []

    if (!items.length) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const ops: any[] = []
    const deletedDates: string[] = []

    for (const it of items) {
      if (!it?.date || !it?.program) {
        return Response.json({ error: 'Invalid item in payload - date and program are required' }, { status: 400 })
      }
      const timesArr = Array.isArray(it?.times) ? it!.times! : []
      if (timesArr.length === 0) {
        // delete the date/program combination if exists
        ops.push(prisma.availabilityDay.deleteMany({ 
          where: { 
            date: it.date,
            program: it.program 
          } 
        }))
        deletedDates.push(`${it.date}-${it.program}`)
      } else {
        ops.push(
          prisma.availabilityDay.upsert({
            where: { 
              date_program: {
                date: it.date,
                program: it.program
              }
            },
            update: { times: timesArr },
            create: { date: it.date, times: timesArr, program: it.program },
          })
        )
      }
    }

    const results = await prisma.$transaction(ops)

    // Upserts return records; deleteMany returns { count }. Build upserted days separately
    const days = Array.isArray(results)
      ? results.filter((r: any) => r && r.id && r.date).map((d: any) => d)
      : []

    return Response.json({ days, deletedDates })
  } catch (e) {
    console.error('Availability POST error', e)
    return Response.json({ error: 'Failed to save availability' }, { status: 500 })
  }
}
