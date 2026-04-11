import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    // 1. Verify access
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // 2. Fetch Board Data with Subitems
    const board = await prisma.board.findUnique({
      where: { boardId: parseInt(boardId) },
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            watchedStatusColumns: { include: { statusColumn: true } }
          }
        },
        groups: {
          orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
          include: {
            items: {
              // PENTING: Hanya ambil item yang TIDAK punya parent (Top Level Items)
              // Agar subitem tidak muncul ganda (di luar dan di dalam parent)
              where: { parentId: null },
              orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
              include: {
                values: true,

                // PENTING: Include Subitems di sini
                subItems: {
                  orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
                  include: {
                    values: true // Subitem juga butuh values (status, person, dll)
                  }
                }
              }
            }
          }
        },
        widgets: true
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

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { boardName, description } = await request.json()

    const board = await prisma.board.update({
      where: { boardId: parseInt(boardId) },
      data: {
        boardName: boardName || undefined,
        description: description || undefined,
        txtUpdatedBy: session.user.name
      },

      // Include struktur yang sama persis dengan GET agar UI sync
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            watchedStatusColumns: { include: { statusColumn: true } }
          }
        },
        groups: {
          orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
          include: {
            items: {
              where: { parentId: null }, // Filter parent only
              orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
              include: {
                values: true,
                subItems: {
                  orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
                  include: { values: true }
                }
              }
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

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId, role: 'Owner' }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Only board owner can delete' }, { status: 403 })
    }

    await prisma.board.delete({ where: { boardId: parseInt(boardId) } })

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Failed to delete board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
