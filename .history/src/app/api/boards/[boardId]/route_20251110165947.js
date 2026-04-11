import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { boardId } = params // 'await' tidak diperlukan di sini

  try {
    const board = await prisma.board.findUnique({
      where: { boardId: parseInt(boardId) },
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },

          // PERBAIKAN: Sertakan 'options' untuk mengambil data label
          include: {
            options: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        groups: {
          orderBy: { dtmInserted: 'asc' },
          include: {
            items: {
              orderBy: { dtmInserted: 'asc' },
              include: { values: true }
            }
          }
        }
      }
    })

    if (!board) return NextResponse.json({ message: 'Board not found' }, { status: 404 })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to fetch board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = params

  try {
    const { boardName, description } = await request.json()

    const board = await prisma.board.update({
      where: { boardId: parseInt(boardId) },
      data: {
        boardName: boardName || undefined,
        description: description || undefined,
        txtUpdatedBy: session.user.name // Gunakan nama user dari sesi
      },

      // Sertakan juga 'options' di sini agar data yang dikembalikan konsisten
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        groups: {
          orderBy: { dtmInserted: 'asc' },
          include: {
            items: {
              orderBy: { dtmInserted: 'asc' },
              include: { values: true }
            }
          }
        }
      }
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to update board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = params

  try {
    await prisma.board.delete({
      where: { boardId: parseInt(boardId) }
    })

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Failed to delete board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
