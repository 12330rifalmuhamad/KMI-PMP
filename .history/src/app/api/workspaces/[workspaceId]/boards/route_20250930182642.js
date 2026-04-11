import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// FUNGSI GET: Untuk mengambil semua board dalam satu workspace (tidak berubah)
export async function GET(request, { params }) {
  const { workspaceId } = params

  try {
    const boards = await prisma.board.findMany({
      where: { workspaceId: parseInt(workspaceId) },
      orderBy: { dtmInserted: 'desc' }
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Failed to fetch boards:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// ====================================================================
// FUNGSI POST YANG DIPERBARUI
// ====================================================================
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = params

  try {
    const body = await request.json()
    const { boardName } = body

    if (!boardName) {
      return NextResponse.json({ message: 'Board name is required' }, { status: 400 })
    }

    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parseInt(workspaceId),
        boardName: boardName,
        txtInsertedBy: session.user.name,

        // SECARA OTOMATIS BUAT KOLOM DAN GRUP DEFAULT
        // Ini adalah bagian penambahannya
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
          create: [
            { groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: session.user.name },
            { groupName: 'Group Title 2', groupColor: '#A25DDC', txtInsertedBy: session.user.name }
          ]
        }
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    console.error('Failed to create board with defaults:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
