import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Fix BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    const boards = await prisma.board.findMany({
      where: { boardMember: { some: { userId: userId } } },
      orderBy: { dtmInserted: 'desc' },
      include: { workspace: { select: { workspaceId: true, workspaceName: true } } }
    })

    return NextResponse.json(boards)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch boards', error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { boardName, description, workspaceId, templateId } = body || {}
    const userId = parseInt(session.user.id)
    const currentUser = session.user.name

    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    // 1. Cek Workspace
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })

    // 2. Cek Akses (Auto-Add Owner jika workspace baru)
    let hasAccess = ws.workspaceMember.some(m => m.userId === userId && m.bitActive === 1)

    if (!hasAccess && ws.workspaceMember.length === 0 && ws.txtInsertedBy === currentUser) {
      console.log('Auto-adding owner to workspace...')
      await prisma.trWorkspaceMember.create({
        data: { workspaceId: parsedWorkspaceId, userId, role: 'Owner', txtInsertedBy: currentUser, bitActive: 1 }
      })
      hasAccess = true
    }

    if (!hasAccess) return NextResponse.json({ message: 'Access denied' }, { status: 403 })

    // 3. Siapkan Kolom
    let columnsToCreate = []

    if (templateId) {
      try {
        const template = await prisma.boardTemplate.findUnique({ where: { templateId: parseInt(templateId) } })

        if (template?.structure) {
          let structureData = template.structure

          if (typeof structureData === 'string') structureData = JSON.parse(structureData)

          if (Array.isArray(structureData)) {
            columnsToCreate = structureData
              .filter(c => c && typeof c === 'object')
              .map((col, index) => ({
                columnName: String(col.columnName || 'Untitled'),
                columnType: String(col.columnType || 'TEXT'),
                sortOrder: Number(col.sortOrder ?? index + 1),

                // HAPUS width jika schema.prisma Anda belum ada kolom 'width'
                // width: Number(col.width || 200),
                options: Array.isArray(col.options) ? col.options : [],
                calculationType: col.calculationType ? String(col.calculationType) : null,
                unit: col.unit ? String(col.unit) : null,
                txtInsertedBy: currentUser
              }))
          }
        }
      } catch (e) {
        console.warn('Template parsing warning:', e.message)
      }
    }

    // Default Columns
    if (columnsToCreate.length === 0) {
      columnsToCreate = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 1, txtInsertedBy: currentUser },
        { columnName: 'Person', columnType: 'PERSON', sortOrder: 2, txtInsertedBy: currentUser },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 3, txtInsertedBy: currentUser },
        { columnName: 'Date', columnType: 'DATE', sortOrder: 4, txtInsertedBy: currentUser },
        { columnName: 'Priority', columnType: 'STATUS', sortOrder: 5, txtInsertedBy: currentUser }
      ]
    }

    // 4. Create Board
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parsedWorkspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
        txtInsertedBy: currentUser,
        columns: { create: columnsToCreate },
        groups: { create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }] },
        boardMember: { create: [{ userId, role: 'Owner', txtInsertedBy: currentUser }] }
      },
      include: { workspace: { select: { workspaceId: true, workspaceName: true } } }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    // --- SAFE ERROR LOGGING ---
    // Log pesan error yang aman dibaca
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('SERVER ERROR [POST /api/boards]:', errorMessage)

    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 })
  }
}
