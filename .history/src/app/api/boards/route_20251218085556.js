import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Fix untuk BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

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

// POST: Create a new board in a workspace (With Template Support)
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized or session is invalid' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Ambil templateId dari body
    const { boardName, description, workspaceId, templateId } = body
    const userId = parseInt(session.user.id)
    const currentUser = session.user.name

    console.log('[POST /api/boards] Request:', { boardName, workspaceId, templateId, userId })

    // 1. Validasi Input Dasar
    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Board name and workspace ID are required' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    if (isNaN(parsedWorkspaceId) || isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid ID parameters' }, { status: 400 })
    }

    // 2. Validasi Workspace Exists
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    // 3. Cek Akses / Auto-Add Owner (Fix untuk Workspace Lama)
    let workspaceAccess = await prisma.trWorkspaceMember.findFirst({
      where: { workspaceId: parsedWorkspaceId, userId, bitActive: 1 }
    })

    if (!workspaceAccess) {
      // Logic khusus: Jika workspace kosong & user adalah pembuatnya -> Jadikan Owner
      // Tambahan: Cek juga ws.workspaceMember.length === 0 untuk keamanan
      const isCreator = ws.txtInsertedBy === currentUser
      const isEmpty = ws.workspaceMember.length === 0

      if (isCreator && isEmpty) {
        console.log('[POST /api/boards] Auto-fixing workspace owner...')
        workspaceAccess = await prisma.trWorkspaceMember.create({
          data: {
            workspaceId: parsedWorkspaceId,
            userId: userId,
            role: 'Owner',
            txtInsertedBy: currentUser,
            bitActive: 1
          }
        })
      } else {
        return NextResponse.json({ message: 'Access denied. You are not a member of this workspace.' }, { status: 403 })
      }
    }

    // 4. Siapkan Struktur Kolom (Template vs Default)
    let columnsToCreate = []

    // A. Jika ada templateId, coba ambil dari DB
    if (templateId) {
      const template = await prisma.boardTemplate.findUnique({
        where: { templateId: parseInt(templateId) }
      })

      if (template?.structure) {
        console.log(`[POST /api/boards] Using template: ${template.templateName}`)

        let structureData = template.structure

        // Handle double-stringified JSON (jaga-jaga)
        if (typeof structureData === 'string') {
          try {
            structureData = JSON.parse(structureData)
          } catch (e) {
            console.warn('Failed to parse template JSON, falling back to default')
            structureData = []
          }
        }

        // Mapping data template ke format Prisma Create
        if (Array.isArray(structureData)) {
          columnsToCreate = structureData
            .filter(col => col && typeof col === 'object') // Filter null
            .map((col, index) => ({
              columnName: String(col.columnName || 'Untitled'),
              columnType: String(col.columnType || 'TEXT'),
              sortOrder: Number(col.sortOrder ?? index + 1),
              width: Number(col.width || 200),

              // Pastikan options valid array (penting untuk Status/Dropdown)
              options: Array.isArray(col.options) ? col.options : [],
              calculationType: col.calculationType ? String(col.calculationType) : null,
              unit: col.unit ? String(col.unit) : null,
              txtInsertedBy: currentUser
            }))
        }
      }
    }

    // B. Fallback: Jika tidak ada template atau template kosong, gunakan Default
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

    // 5. Eksekusi Create Board
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: ws.workspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
        txtInsertedBy: currentUser,

        // Buat kolom berdasarkan hasil logika di atas
        columns: {
          create: columnsToCreate
        },

        // Default Group
        groups: {
          create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }]
        },

        // Daftarkan user sebagai Owner board
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
        columns: true // Return kolom agar frontend bisa langsung render
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('[POST /api/boards] Error:', error)

    // Return error message yang aman
    return NextResponse.json(
      { message: 'Internal Server Error', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
