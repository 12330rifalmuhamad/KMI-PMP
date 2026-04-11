import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Fix untuk BigInt serialization
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

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { boardName, description, workspaceId, templateId } = body

    // Pastikan userId valid integer
    const userId = parseInt(session.user.id)

    // Pastikan insertedBy tidak pernah null/undefined
    const currentUser = session.user.name || session.user.email || 'System'

    console.log('[POST /api/boards] Start Create:', { boardName, workspaceId, templateId, userId })

    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Board name and workspace ID are required' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    if (isNaN(parsedWorkspaceId)) {
      return NextResponse.json({ message: 'Invalid workspace ID' }, { status: 400 })
    }

    // 1. Validate workspace exists
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    // 2. Verify user access
    let workspaceAccess = await prisma.trWorkspaceMember.findFirst({
      where: { workspaceId: parsedWorkspaceId, userId }
    })

    if (!workspaceAccess) {
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
        return NextResponse.json(
          {
            message: 'Access denied. You do not have access to this workspace.'
          },
          { status: 403 }
        )
      }
    }

    // 3. LOGIKA KOLOM (TEMPLATE vs DEFAULT)
    let columnsToCreate = []

    if (templateId) {
      const template = await prisma.boardTemplate.findUnique({
        where: { templateId: parseInt(templateId) }
      })

      if (template && Array.isArray(template.structure)) {
        console.log(`[POST /api/boards] Using Template ID ${templateId}:`, template.templateName)

        // Mapping Data Template ke BoardColumn dengan SAFETY CHECK (Default Value)
        columnsToCreate = template.structure.map((col, index) => ({
          columnName: col.columnName || 'Untitled',
          columnType: col.columnType || 'TEXT',
          sortOrder: col.sortOrder ?? index, // Gunakan index jika sortOrder null
          width: col.width ?? 200, // Default width
          options: col.options ?? [], // Default empty array untuk JSON
          calculationType: col.calculationType ?? null,
          unit: col.unit ?? null,
          txtInsertedBy: currentUser // Wajib diisi (tidak boleh undefined)
        }))
      }
    }

    // Fallback Default Columns
    if (columnsToCreate.length === 0) {
      console.log('[POST /api/boards] Using Default Columns structure')
      columnsToCreate = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 1, width: 300, txtInsertedBy: currentUser },
        { columnName: 'Pemilik', columnType: 'PERSON', sortOrder: 2, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 3, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Tanggal Selesai', columnType: 'DATE', sortOrder: 4, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Prioritas', columnType: 'STATUS', sortOrder: 5, width: 150, txtInsertedBy: currentUser }
      ]
    }

    // Debugging Payload sebelum dikirim ke Prisma
    // console.log("[POST /api/boards] Final Columns Payload:", JSON.stringify(columnsToCreate, null, 2))

    // 4. Create Board
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: ws.workspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
        txtInsertedBy: currentUser, // Gunakan variabel currentUser yang pasti ada isinya
        columns: {
          create: columnsToCreate
        },
        groups: {
          create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }]
        },
        boardMember: {
          create: [{ userId: userId, role: 'Owner', txtInsertedBy: currentUser }]
        }
      },
      include: {
        workspace: {
          select: {
            workspaceId: true,
            workspaceName: true
          }
        },
        columns: true
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    // Log error lengkap agar terlihat di terminal
    console.error('[POST /api/boards] CRITICAL ERROR:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error?.message }, { status: 500 })
  }
}
