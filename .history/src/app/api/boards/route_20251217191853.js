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
// POST: Create Board
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Pastikan boardName string untuk menghindari error .trim()
    const { boardName, description, workspaceId, templateId } = body || {}

    const userId = parseInt(session.user.id)
    const currentUser = session.user.name || session.user.email || 'System'

    // 1. Validasi Input Dasar
    if (!boardName || typeof boardName !== 'string' || !workspaceNameId) {
      // Perbaikan: Cek workspaceId juga
      if (!workspaceId) {
        return NextResponse.json({ message: 'Board name and workspace ID are required' }, { status: 400 })
      }
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    // 2. Validasi Workspace & Akses
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    // Cek apakah user adalah member workspace atau owner
    let isMember = ws.workspaceMember.some(m => m.userId === userId && m.bitActive === 1)

    // Auto-add owner jika workspace baru/kosong (opsional, sesuaikan logika bisnis)
    if (!isMember && ws.workspaceMember.length === 0 && ws.txtInsertedBy === currentUser) {
      await prisma.trWorkspaceMember.create({
        data: {
          workspaceId: parsedWorkspaceId,
          userId: userId,
          role: 'Owner',
          txtInsertedBy: currentUser,
          bitActive: 1
        }
      })
      isMember = true
    }

    if (!isMember) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // 3. Persiapkan Kolom (Template / Default)
    let columnsToCreate = []

    if (templateId) {
      const template = await prisma.boardTemplate.findUnique({
        where: { templateId: parseInt(templateId) }
      })

      if (template?.structure) {
        let structureData = template.structure

        // Handle double-stringified JSON
        if (typeof structureData === 'string') {
          try {
            structureData = JSON.parse(structureData)
          } catch (e) {
            console.warn('Failed to parse template structure JSON')
            structureData = []
          }
        }

        if (Array.isArray(structureData)) {
          columnsToCreate = structureData
            .filter(item => item && typeof item === 'object')
            .map((col, index) => ({
              columnName: String(col.columnName || 'Untitled'),
              columnType: String(col.columnType || 'TEXT'),
              sortOrder: Number(col.sortOrder ?? index),
              width: Number(col.width || 200),

              // Pastikan options adalah array valid (bukan null) karena Prisma Json butuh valid JSON value
              options: Array.isArray(col.options) ? col.options : [],
              calculationType: col.calculationType ? String(col.calculationType) : null,
              unit: col.unit ? String(col.unit) : null,
              txtInsertedBy: currentUser
            }))
        }
      }
    }

    // Fallback Default Columns
    if (columnsToCreate.length === 0) {
      columnsToCreate = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 1, width: 300, txtInsertedBy: currentUser },
        { columnName: 'Person', columnType: 'PERSON', sortOrder: 2, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 3, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Date', columnType: 'DATE', sortOrder: 4, width: 150, txtInsertedBy: currentUser },
        { columnName: 'Priority', columnType: 'STATUS', sortOrder: 5, width: 150, txtInsertedBy: currentUser }
      ]
    }

    // 4. Create Board
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parsedWorkspaceId,
        boardName: boardName.trim(),
        description: description || null,
        txtInsertedBy: currentUser,

        // Create Related Data
        columns: { create: columnsToCreate },
        groups: { create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }] },
        boardMember: { create: [{ userId: userId, role: 'Owner', txtInsertedBy: currentUser }] }
      },
      include: {
        workspace: { select: { workspaceId: true, workspaceName: true } }
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    // SAFE LOGGING: Hindari error saat logging error
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'

    console.error('[POST /api/boards] Transaction Failed:', errorMsg)

    // Opsional: Log stack trace jika ada
    if (error?.stack) console.error(error.stack)

    return NextResponse.json({ message: 'Internal Server Error', error: errorMsg }, { status: 500 })
  }
}
