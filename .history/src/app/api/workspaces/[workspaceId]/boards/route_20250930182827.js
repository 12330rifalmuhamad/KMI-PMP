import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// FUNGSI GET (tidak berubah)
export async function GET(request, { params }) {
  // ... (kode GET Anda)
}

// ====================================================================
// FUNGSI POST YANG DIPERBARUI
// ====================================================================
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  // Pengecekan sesi yang lebih kuat
  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized or session is invalid' }, { status: 401 })
  }

  const { workspaceId } = params

  try {
    const body = await request.json()
    const { boardName } = body

    // Log ini akan menunjukkan apa yang sebenarnya dikirim oleh frontend
    console.log('[API LOG] Menerima payload:', body)

    if (!boardName) {
      return NextResponse.json({ message: 'Board name is required in the payload' }, { status: 400 })
    }

    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parseInt(workspaceId),
        boardName: boardName,
        txtInsertedBy: session.user.name,

        // Membuat kolom dan grup default
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
        }
      }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    // PERBAIKAN: Cara mencatat error yang lebih aman
    console.error('🔴 GAGAL MEMBUAT BOARD:', error.message, error.stack)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
