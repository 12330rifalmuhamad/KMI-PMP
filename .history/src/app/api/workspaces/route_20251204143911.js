import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    // Workspaces where the user is a direct member OR has a board membership inside
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [{ workspaceMember: { some: { userId } } }, { boards: { some: { boardMember: { some: { userId } } } } }]
      },
      orderBy: { dtmInserted: 'asc' }
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)

    return NextResponse.json({ message: 'Failed to fetch workspaces', error: error?.message }, { status: 500 })
  }
}
