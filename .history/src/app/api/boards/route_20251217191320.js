import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Fix untuk BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// GET: Get all boards
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
    return NextResponse.json({ message: 'Failed to fetch boards', error: error?.message }, { status: 500 })
  }
}

// POST: Create Board
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { boardName, description, workspaceId, templateId } = body

    // Safety check untuk user session
    const userId = parseInt(session.user.id)
    const currentUser = session.user.name || session.user.email || 'System'

    console.log('[POST /api/boards] Init:', { boardName, workspaceId, templateId })

    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Board name and workspace ID are required' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    // 1. Validasi Workspace
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    // 2. Cek Akses User / Auto-Add Owner
    let workspaceAccess = await prisma.trWorkspaceMember.findFirst({
      where: { workspaceId: parsedWorkspaceId, userId }
    })

    if (!workspaceAccess) {
      // Jika workspace kosong dan user adalah pembuatnya, tambahkan sebagai owner
      if (ws.workspaceMember.length === 0 && ws.txtInsertedBy === currentUser) {
        workspaceAccess = await prisma.trWorkspaceMember.create({
          data: {
            workspaceId: parsedWorkspaceId,
            userId: userId,
            role: 'Owner',
            txtInsertedBy: currentUser
          }
        })
      } else {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
    }

    // 3. LOGIKA KOLOM (Perbaikan Utama Disini)
    let columnsToCreate = []

    if (templateId) {
      const template = await prisma.boardTemplate.findUnique({
        where: { templateId: parseInt(templateId) }
      })

      if (template && template.structure) {
        console.log(`[POST /api/boards] Processing Template: ${template.templateName}`)

        let structureData = template.structure

        // Handle jika tersimpan sebagai string JSON di DB (double stringified)
        if (typeof structureData === 'string') {
          try {
            structureData = JSON.parse(structureData)
          } catch (e) {
            console.error('Failed to parse JSON structure, falling back to default')
            structureData = []
          }
        }

        // Mapping Aman: Pastikan setiap field terdefinisi dengan tipe yang benar
        if (Array.isArray(structureData)) {
          columnsToCreate = structureData
            .filter(item => item !== null && typeof item === 'object') // Filter item null
            .map((col, index) => ({
              columnName: String(col.columnName || 'Untitled'), // Paksa String
              columnType: String(col.columnType || 'TEXT'), // Paksa String
              sortOrder: Number(col.sortOrder ?? index), // Paksa Number
              width: Number(col.width || 200), // Paksa Number
              options: Array.isArray(col.options) ? col.options : [], // Pastikan Array (untuk Json)
              calculationType: col.calculationType ? String(col.calculationType) : null,
              unit: col.unit ? String(col.unit) : null,
              txtInsertedBy: currentUser // Wajib ada
            }))
        }
      }
    }

    // Fallback Default jika kolom kosong (atau template gagal di-load)
    if (columnsToCreate.length === 0) {
      console.log('[POST /api/boards] Using Default Columns')
      columnsToCreate = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 1, width: 300, txtInsertedBy: currentUser },
        { columnName: 'Person', columnType: 'PERSON', sortOrder: 2, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 3, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Date', columnType: 'DATE', sortOrder: 4, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Priority', columnType: 'STATUS', sortOrder: 5, width: 150, txtInsertedBy: currentUser }
      ]
    }

    console.log(`[POST /api/boards] Ready to insert ${columnsToCreate.length} columns`)

    // 4. Create Board Transaction
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: ws.workspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
        txtInsertedBy: currentUser,

        // Nested create untuk columns
        columns: {
          create: columnsToCreate
        },

        // Nested create untuk groups
        groups: {
          create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }]
        },

        // Nested create untuk member
        boardMember: {
          create: [{ userId: userId, role: 'Owner', txtInsertedBy: currentUser }]
        }
      },
      include: {
        workspace: { select: { workspaceId: true, workspaceName: true } },
        columns: true
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('[POST /api/boards] CRITICAL ERROR:', error)

    // Return JSON error agar frontend tidak 'Unexpected end of JSON'
    return NextResponse.json(
      { message: 'Internal Server Error', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
