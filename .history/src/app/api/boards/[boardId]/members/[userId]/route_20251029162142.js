import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// PATCH: change role
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId, userId } = await params
    const body = await request.json()
    const { role } = body

    if (!role) return NextResponse.json({ message: 'role is required' }, { status: 400 })

    const updated = await prisma.trBoardMember.update({
      where: { boardId_userId: { boardId: parseInt(boardId), userId: parseInt(userId) } },
      data: { role, txtUpdatedBy: session.user.name },
      include: { mUser: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update member role:', error)
    return NextResponse.json({ message: 'Failed to update role', error: error?.message }, { status: 500 })
  }
}

// DELETE: remove member
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId, userId } = await params

    await prisma.trBoardMember.delete({
      where: { boardId_userId: { boardId: parseInt(boardId), userId: parseInt(userId) } }
    })

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json({ message: 'Failed to remove member', error: error?.message }, { status: 500 })
  }
}

