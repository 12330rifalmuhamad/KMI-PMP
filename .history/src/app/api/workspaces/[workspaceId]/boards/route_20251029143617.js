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
  // Pastikan Anda menggunakan nama parameter yang benar sesuai nama folder
  const { workspaceId } = params

  // Pengecekan sesi untuk keamanan
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ws = await prisma.workspace.findUnique({ where: { workspaceId: parseInt(workspaceId) } })

    if (!ws) {
      return NextResponse.json({ message: 'Invalid workspaceId' }, { status: 400 })
    }

    const boards = await prisma.board.findMany({
      where: {
        workspaceId: parseInt(workspaceId),
        boardMember: session?.user?.id ? { some: { userId: parseInt(session.user.id) } } : undefined
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

  // Tidak boleh ada kode lagi di sini, karena semua kemungkinan sudah ditangani di atas
}

// FUNGSI POST: Untuk membuat board baru
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized or session is invalid' }, { status: 401 })
  }

  const { workspaceId } = params

  try {
    const body = await request.json()
    const { boardName } = body

    if (!boardName) {
      return NextResponse.json({ message: 'Board name is required in the payload' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    // Validate workspace exists
    const ws = await prisma.workspace.findUnique({ where: { workspaceId: parsedWorkspaceId } })

    if (!ws) {
      return NextResponse.json({ message: 'Invalid workspaceId' }, { status: 400 })
    }

    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parsedWorkspaceId,
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
          create: [{ userId: parseInt(session.user.id), role: 'Owner', txtInsertedBy: session.user.name }]
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
