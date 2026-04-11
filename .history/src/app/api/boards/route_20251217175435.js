import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// GET: Get all boards where user is a member
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    // Get all boards where user is a member
    const boards = await prisma.board.findMany({
      where: {
        boardMember: {
          some: {
            userId: userId
          }
        }
      },
      orderBy: { dtmInserted: 'desc' },
      include: {
        workspace: {
          select: {
            workspaceId: true,
            workspaceName: true
          }
        }
      }
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Failed to fetch boards:', error)

    return NextResponse.json({ message: 'Failed to fetch boards', error: error?.message }, { status: 500 })
  }
}

// POST: Create a new board in a workspace
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized or session is invalid' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { boardName, description, workspaceId } = body
    const userId = parseInt(session.user.id)

    console.log('[POST /api/boards] Request body:', { boardName, workspaceId, userId, sessionUser: session.user })

    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Board name and workspace ID are required' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    if (isNaN(parsedWorkspaceId)) {
      return NextResponse.json({ message: 'Invalid workspace ID' }, { status: 400 })
    }

    if (isNaN(userId)) {
      console.error('[POST /api/boards] Invalid userId:', session.user.id)
      return NextResponse.json({ message: 'Invalid user session' }, { status: 401 })
    }

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

    console.log('[POST /api/boards] Workspace access check:', {
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
        console.log('[POST /api/boards] Adding user as workspace member (creator but not member)')
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

    const newBoard = await prisma.board.create({
      data: {
        workspaceId: ws.workspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
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
      },
      include: {
        workspace: {
          select: {
            workspaceId: true,
            workspaceName: true
          }
        }
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('Failed to create board:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error?.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, workspaceId, templateId } = body // Terima templateId dari frontend

    // 1. Tentukan Kolom Awal
    let columnsToCreate = []

    if (templateId) {
      // KASUS A: User memilih Template
      const template = await prisma.boardTemplate.findUnique({
        where: { templateId: parseInt(templateId) }
      })

      if (template && template.structure) {
        // Map data JSON template ke format create Prisma
        // Pastikan nama field sesuai dengan schema BoardColumn Anda
        columnsToCreate = template.structure.map(col => ({
          columnName: col.columnName,
          columnType: col.columnType,
          sortOrder: col.sortOrder,
          width: col.width,
          options: col.options || [] // JSON array
          // properti lain sesuaikan...
        }))
      }
    }

    // KASUS B: Default (Jika tidak pilih template atau template tidak ketemu)
    if (columnsToCreate.length === 0) {
      columnsToCreate = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 0, width: 300 },
        { columnName: 'Person', columnType: 'PERSON', sortOrder: 1, width: 150 },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 2, width: 150 },
        { columnName: 'Date', columnType: 'DATE', sortOrder: 3, width: 150 }
      ]
    }

    // 2. Buat Board beserta Kolom-kolomnya
    const newBoard = await prisma.board.create({
      data: {
        title: title,
        workspaceId: parseInt(workspaceId),
        // Relasi nested create untuk kolom
        columns: {
          create: columnsToCreate
        }
      },
      include: {
        columns: true // Return data kolom agar frontend bisa langsung update
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('Create Board Error:', error)
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
  }
}
