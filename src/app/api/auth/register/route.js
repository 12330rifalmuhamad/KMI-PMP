import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  try {
    const body = await request.json()
    const userName = body?.userName?.trim()
    const email = body?.email?.trim().toLowerCase()
    const password = body?.password

    if (!userName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 })
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Please enter a valid email address' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email is already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash,
        txtInsertedBy: userName
      },
      select: {
        userId: true,
        userName: true,
        email: true,
        dtmInserted: true
      }
    })

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          ...user,
          userId: user.userId.toString()
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER_ERROR]', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
