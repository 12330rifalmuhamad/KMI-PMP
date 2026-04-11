import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Patch BigInt agar bisa diserialisasi ke JSON
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
    // Verify user has access to this board
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const board = await prisma.board.findUnique({
      where: { boardId: parseInt(boardId) },
      include: {
        // Ambil data anggota board
        boardMember: { include: { mUser: true } },

        // Ambil data kolom
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' }
            },

            // Sertakan watchedStatusColumns untuk kolom PROGRESS
            watchedStatusColumns: {
              include: {
                statusColumn: true
              }
            }
          }
        },

        // Ambil data grup
        groups: {
          orderBy: { dtmInserted: 'asc' }, // Atau sortOrder jika sudah diimplementasikan
          include: {
            // Ambil Parent Items (Tugas Utama)
            items: {
              where: { parentId: null }, // PENTING: Hanya ambil item induk
              orderBy: { dtmInserted: 'asc' }, // Atau sortOrder
              include: {
                // Values milik parent item
                values: true,

                // PENTING: Ambil Sub-items
                subItems: {
                  orderBy: { dtmInserted: 'asc' },
                  include: {
                    values: true // Values milik sub-item
                  }
                }
              }
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

/**
 * PUT: Memperbarui detail papan (board), seperti nama atau deskripsi.
 */
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    // Verify user has access to this board
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

      // Sertakan semua data lagi agar SWR bisa me-refresh struktur lengkap dengan subitem
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' }
            },
            watchedStatusColumns: {
              include: {
                statusColumn: true
              }
            }
          }
        },
        groups: {
          orderBy: { dtmInserted: 'asc' },
          include: {
            items: {
              where: { parentId: null }, // PENTING: Filter parent only
              orderBy: { dtmInserted: 'asc' },
              include: {
                values: true,

                // PENTING: Sertakan sub-items di response update juga
                subItems: {
                  orderBy: { dtmInserted: 'asc' },
                  include: {
                    values: true
                  }
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

/**
 * DELETE: Menghapus papan (board) secara permanen.
 */
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    // Check if user is Owner of this board
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId, role: 'Owner' }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Only board owner can delete' }, { status: 403 })
    }

    await prisma.board.delete({
      where: { boardId: parseInt(boardId) }
    })

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Failed to delete board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
