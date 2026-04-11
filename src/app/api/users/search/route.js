import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Fix BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export async function GET(request) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { userName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        bitActive: 1
      },
      take: 5,
      select: {
        userId: true,
        userName: true,
        email: true,
        // image: true // Uncomment if User model has image field in schema, otherwise omitted
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Search Users Error:', error)

    return NextResponse.json({ message: 'Failed to search users' }, { status: 500 })
  }
}
