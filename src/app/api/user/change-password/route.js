import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          message: 'All password fields are required'
        },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          message: 'New passwords do not match'
        },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          message: 'New password must be at least 6 characters long'
        },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { userId: BigInt(session.user.id) },
      select: { userId: true, userName: true, passwordHash: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        passwordHash,
        txtUpdatedBy: user.userName
      }
    })

    return NextResponse.json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Failed to change password:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

