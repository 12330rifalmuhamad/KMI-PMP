import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// GET: list board members
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId } = await params

    const members = await prisma.trBoardMember.findMany({
      where: { boardId: parseInt(boardId) },
      orderBy: { dtmInserted: 'asc' },
      include: { mUser: true }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch board members:', error)
    return NextResponse.json({ message: 'Failed to fetch members', error: error?.message }, { status: 500 })
  }
}

// POST: add member by userId or email
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId } = await params
    const body = await request.json()
    const { userId, email, role = 'member' } = body

    if (!userId && !email) {
      return NextResponse.json({ message: 'userId or email is required' }, { status: 400 })
    }

    // Resolve user
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { userId: parseInt(userId) } }).catch(async () => {
        return await prisma.mUser.findUnique({ where: { userId: parseInt(userId) } })
      })
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } }).catch(async () => {
        return await prisma.mUser.findUnique({ where: { userEmail: email } })
      })
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Upsert membership
    const member = await prisma.trBoardMember.upsert({
      where: { boardId_userId: { boardId: parseInt(boardId), userId: parseInt(user.userId) } },
      update: { role, txtUpdatedBy: session.user.name },
      create: {
        boardId: parseInt(boardId),
        userId: parseInt(user.userId),
        role,
        txtInsertedBy: session.user.name
      },
      include: { mUser: true }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Failed to add member:', error)
    return NextResponse.json({ message: 'Failed to add member', error: error?.message }, { status: 500 })
  }
}


