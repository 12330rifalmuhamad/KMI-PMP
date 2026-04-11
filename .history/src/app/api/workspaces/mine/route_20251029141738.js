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

    let workspaces = await prisma.workspace.findMany({
      where: { workspaceMember: { some: { userId } } },
      orderBy: { dtmInserted: 'asc' }
    })

    if (workspaces.length === 0) {
      // Create a default workspace and membership
      const ws = await prisma.workspace.create({
        data: { workspaceName: `${session.user.name || 'My'} Workspace`, txtInsertedBy: session.user.name }
      })
      await prisma.trWorkspaceMember.create({
        data: { workspaceId: ws.workspaceId, userId, role: 'owner', txtInsertedBy: session.user.name }
      })
      workspaces = [ws]
    }

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Failed to fetch user workspaces:', error)
    return NextResponse.json({ message: 'Failed to fetch workspaces', error: error?.message }, { status: 500 })
  }
}


