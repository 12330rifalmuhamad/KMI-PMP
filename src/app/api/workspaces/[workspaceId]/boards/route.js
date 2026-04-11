import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// FUNGSI GET: Untuk mengambil semua board dalam satu workspace
export async function GET(request, { params }) {
  const { workspaceId } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = parseInt(session.user.id)

    // Verify user has access to this workspace
    const workspaceAccess = await prisma.trWorkspaceMember.findFirst({
      where: { workspaceId: parseInt(workspaceId), userId }
    })

    if (!workspaceAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const ws = await prisma.workspace.findUnique({ where: { workspaceId: parseInt(workspaceId) } })

    if (!ws) {
      // Jika workspace tidak ditemukan, kembalikan list kosong agar UI tidak error
      return NextResponse.json([])
    }

    const boards = await prisma.board.findMany({
      where: {
        workspaceId: parseInt(workspaceId),
        boardMember: { some: { userId } }
      },
      orderBy: { dtmInserted: 'asc' }
    })

    // JALUR SUKSES: Selalu kembalikan respons jika berhasil
    return NextResponse.json(boards)
  } catch (error) {
    console.error('Failed to fetch boards:', error)

    // JALUR GAGAL: Selalu kembalikan respons jika ada error
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// FUNGSI POST: Untuk membuat board baru
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized or session is invalid' }, { status: 401 })
  }

  const { workspaceId } = await params
  const userId = parseInt(session.user.id)

  console.log('[POST /api/workspaces/[workspaceId]/boards] Request:', {
    workspaceId,
    userId,
    sessionUser: session.user
  })

  try {
    const parsedWorkspaceId = parseInt(workspaceId)

    // Validate workspace exists first
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    // Verify user has access to this workspace
    let workspaceAccess = await prisma.trWorkspaceMember.findFirst({
      where: { workspaceId: parsedWorkspaceId, userId }
    })

    console.log('[POST /api/workspaces/[workspaceId]/boards] Workspace access check:', {
      workspaceId: parsedWorkspaceId,
      userId,
      hasAccess: !!workspaceAccess,
      workspaceCreator: ws.txtInsertedBy,
      sessionUserName: session.user.name,
      workspaceMembersCount: ws.workspaceMember.length
    })

    if (!workspaceAccess) {
      // If workspace has no members and user is the creator, add them as Owner
      if (ws.workspaceMember.length === 0 && ws.txtInsertedBy === session.user.name) {
        console.log(
          '[POST /api/workspaces/[workspaceId]/boards] Adding user as workspace member (creator but not member)'
        )
        workspaceAccess = await prisma.trWorkspaceMember.create({
          data: {
            workspaceId: parsedWorkspaceId,
            userId: userId,
            role: 'Owner',
            txtInsertedBy: session.user.name
          }
        })
      } else {
        return NextResponse.json(
          {
            message:
              'Access denied. You do not have access to this workspace. Please ensure you are a member of this workspace.'
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { boardName } = body

    if (!boardName) {
      return NextResponse.json({ message: 'Board name is required in the payload' }, { status: 400 })
    }

    const newBoard = await prisma.board.create({
      data: {
        workspaceId: ws.workspaceId,
        boardName: boardName,
        txtInsertedBy: session.user.name,
        columns: {
          create: [
            { columnName: 'Item', columnType: 'TEXT', sortOrder: 1, txtInsertedBy: session.user.name },
            { columnName: 'Pemilik', columnType: 'PERSON', sortOrder: 2, txtInsertedBy: session.user.name },
            { columnName: 'Status', columnType: 'STATUS', sortOrder: 3, txtInsertedBy: session.user.name },
            { columnName: 'Tanggal Selesai', columnType: 'DATE', sortOrder: 4, txtInsertedBy: session.user.name },
            { columnName: 'Prioritas', columnType: 'STATUS', sortOrder: 5, txtInsertedBy: session.user.name }
          ]
        },
        groups: {
          create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: session.user.name }]
        },
        boardMember: {
          create: [{ userId: userId, role: 'Owner', txtInsertedBy: session.user.name }]
        }
      }
    })

    // JALUR SUKSES
    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('Failed to create board with defaults:', error.message)

    // JALUR GAGAL
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
