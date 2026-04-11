import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { boardId } = params

  try {
    const board = await prisma.board.findUnique({
      where: {
        boardId: parseInt(boardId)
      },
      include: {
        boardMember: {
          include: {
            mUser: true
          }
        },
        columns: { orderBy: { sortOrder: 'asc' } },
        groups: {
          orderBy: { dtmInserted: 'asc' },
          include: {
            items: {
              orderBy: { dtmInserted: 'asc' },
              include: {
                values: true
              }
            }
          }
        }
      }
    })

    if (!board) {
      // Jika ID board tidak ada di DB, kirim 404
      return NextResponse.json({ message: 'Board not found' }, { status: 404 })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error(' GAGAL MENGAMBIL BOARD:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
