import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

// GET /api/auth/activate
// Verify token and return user info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    // Find activation request by token
    const activationRequest = await prisma.activationRequest.findUnique({
      where: { token }
    })

    if (!activationRequest) {
      return NextResponse.json({ error: 'Invalid activation token' }, { status: 404 })
    }

    if (activationRequest.isUsed) {
      return NextResponse.json({ error: 'This activation link has already been used' }, { status: 400 })
    }

    if (new Date() > activationRequest.expiresAt) {
      return NextResponse.json({ error: 'This activation link has expired' }, { status: 400 })
    }

    // Get user data based on role
    let userData
    if (activationRequest.role === 'TEACHER') {
      userData = await prisma.teacher.findUnique({
        where: { id: activationRequest.userId }
      })
    } else if (activationRequest.role === 'STUDENT') {
      userData = await prisma.student.findUnique({
        where: { id: activationRequest.userId }
      })
    } else if (activationRequest.role === 'ADMIN') {
      userData = await prisma.admin.findUnique({
        where: { id: activationRequest.userId }
      })
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user info
    return NextResponse.json({
      user: {
        name: userData.name,
        email: userData.email,
        role: activationRequest.role,
        expiresAt: activationRequest.expiresAt
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error verifying activation token:', error)
    return NextResponse.json({ error: 'Failed to verify activation token' }, { status: 500 })
  }
}

// POST /api/auth/activate
// Activate account with password
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find activation request by token
    const activationRequest = await prisma.activationRequest.findUnique({
      where: { token }
    })

    if (!activationRequest) {
      return NextResponse.json({ error: 'Invalid activation token' }, { status: 404 })
    }

    if (activationRequest.isUsed) {
      return NextResponse.json({ error: 'This activation link has already been used' }, { status: 400 })
    }

    if (new Date() > activationRequest.expiresAt) {
      return NextResponse.json({ error: 'This activation link has expired' }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user data based on role
    if (activationRequest.role === 'TEACHER') {
      await prisma.teacher.update({
        where: { id: activationRequest.userId },
        data: {
          password: hashedPassword,
          isActivated: true
        }
      })
    } else if (activationRequest.role === 'STUDENT') {
      await prisma.student.update({
        where: { id: activationRequest.userId },
        data: {
          password: hashedPassword,
          isActivated: true
        }
      })
    } else if (activationRequest.role === 'ADMIN') {
      await prisma.admin.update({
        where: { id: activationRequest.userId },
        data: {
          password: hashedPassword
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
    }

    // Mark activation request as used
    await prisma.activationRequest.update({
      where: { id: activationRequest.id },
      data: { isUsed: true }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error activating account:', error)
    return NextResponse.json({ error: 'Failed to activate account' }, { status: 500 })
  }
}