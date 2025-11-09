import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

// @ts-ignore - Prisma extension types issue
const db = prisma as any

// GET /api/admin/chat - Fetch chat messages
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipientId = searchParams.get('recipientId')
    const recipientRole = searchParams.get('recipientRole')

    if (!recipientId || !recipientRole) {
      return NextResponse.json(
        { error: 'recipientId and recipientRole are required' },
        { status: 400 }
      )
    }

    // Fetch messages between admin and the recipient
    const messages = await db.message.findMany({
      where: {
        OR: [
          {
            senderRole: 'admin',
            recipientId: parseInt(recipientId),
            recipientRole: recipientRole,
          },
          {
            senderId: parseInt(recipientId),
            senderRole: recipientRole,
            recipientRole: 'admin',
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Mark messages as read
    await db.message.updateMany({
      where: {
        senderId: parseInt(recipientId),
        senderRole: recipientRole,
        recipientRole: 'admin',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/admin/chat - Send a message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, recipientRole, content } = body

    if (!recipientId || !recipientRole || !content) {
      return NextResponse.json(
        { error: 'recipientId, recipientRole, and content are required' },
        { status: 400 }
      )
    }

    // Create a unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const message = await db.message.create({
      data: {
        id: messageId,
        senderId: 0, // Admin sender ID (could be fetched from session if needed)
        senderRole: 'admin',
        recipientId: parseInt(recipientId),
        recipientRole: recipientRole,
        content: content,
        updatedAt: new Date(),
        isRead: false,
      },
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
