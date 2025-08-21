import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Validate admin authentication
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await context.params
    const numId = Number(id)
    if (Number.isNaN(numId)) {
      return Response.json({ error: 'Invalid registration ID' }, { status: 400 })
    }

    const body = await req.json()
    const { approved } = body

    if (typeof approved !== 'boolean') {
      return Response.json({ error: 'approved field must be a boolean' }, { status: 400 })
    }

    // Check if registration exists
    const existingReg = await prisma.webinarRegistration.findUnique({ where: { id: numId } })
    if (!existingReg) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Update the registration
    const updatedReg = await prisma.webinarRegistration.update({
      where: { id: numId },
      data: { approved }
    })

    // If approving and it wasn't approved before, remove the time slot from availability
    if (approved && !existingReg.approved && existingReg.preferredTime && existingReg.program) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        
        const day = await prisma.availabilityDay.findUnique({ 
          where: { 
            date_program: {
              date: date,
              program: existingReg.program
            }
          } 
        })
        if (day) {
          const currentTimes = (day.times as string[]) || []
          const nextTimes = currentTimes.filter((t) => t !== time)
          
          if (nextTimes.length > 0) {
            await prisma.availabilityDay.update({ 
              where: { id: day.id }, 
              data: { times: nextTimes } 
            })
          } else {
            await prisma.availabilityDay.delete({ where: { id: day.id } })
          }
        }
      }
    }

    // If un-approving and it was approved before, add the time slot back to availability
    if (!approved && existingReg.approved && existingReg.preferredTime && existingReg.program) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        
        const day = await prisma.availabilityDay.findUnique({ 
          where: { 
            date_program: {
              date: date,
              program: existingReg.program
            }
          } 
        })
        if (day) {
          const currentTimes = (day.times as string[]) || []
          if (!currentTimes.includes(time)) {
            await prisma.availabilityDay.update({ 
              where: { id: day.id }, 
              data: { times: [...currentTimes, time].sort() } 
            })
          }
        } else {
          // Create new availability day with this time and program
          await prisma.availabilityDay.create({
            data: { date, times: [time], program: existingReg.program }
          })
        }
      }
    }

    return Response.json({ 
      registration: updatedReg,
      message: approved ? 'Registration approved successfully' : 'Registration approval removed'
    })
  } catch (error) {
    console.error('Error updating registration:', error)
    return Response.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}
