import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userId: BigInt(session.user.id) },
      select: { userId: true, userName: true, email: true }
    })

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    return NextResponse.json({
      user: {
        id: user.userId,
        name: user.userName,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = body?.name?.trim()
    const email = body?.email?.trim().toLowerCase()

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Please enter a valid email address' }, { status: 400 })
    }

    const currentUserId = BigInt(session.user.id)
    const existingEmailUser = await prisma.user.findUnique({ where: { email }, select: { userId: true } })

    if (existingEmailUser && existingEmailUser.userId !== currentUserId) {
      return NextResponse.json({ message: 'Email is already used by another account' }, { status: 409 })
    }

    const updatedUser = await prisma.user.update({
      where: { userId: currentUserId },
      data: {
        userName: name,
        email,
        txtUpdatedBy: name
      },
      select: { userId: true, userName: true, email: true }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.userId,
        name: updatedUser.userName,
        email: updatedUser.email
      }
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
