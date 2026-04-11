import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

/**
 * GET: Mengambil data satu papan (board) secara spesifik berdasarkan ID.
 * Termasuk semua relasi yang diperlukan untuk menampilkannya di TableView.
 */
export async function GET(request, { params }) {
  const { boardId } = params

  try {
    const board = await prisma.board.findUnique({
      where: { boardId: parseInt(boardId) },
      include: {
        // Ambil data anggota board
        boardMember: { include: { mUser: true } },

        // Ambil data kolom
        columns: {
          orderBy: { sortOrder: 'asc' },

          // PENTING: Sertakan 'options' untuk mengambil data label kustom
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
          orderBy: { dtmInserted: 'asc' },
          include: {
            // Ambil data item (tugas) di dalam grup
            items: {
              orderBy: { dtmInserted: 'asc' },

              // Ambil data nilai (values) di dalam item
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

/**
 * PUT: Memperbarui detail papan (board), seperti nama atau deskripsi.
 */
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = params

  try {
    const { boardName, description } = await request.json()

    const board = await prisma.board.update({
      where: { boardId: parseInt(boardId) },
      data: {
        boardName: boardName || undefined,
        description: description || undefined,
        txtUpdatedBy: session.user.name
      },

      // Sertakan semua data lagi agar SWR bisa me-refresh
      include: {
        boardMember: { include: { mUser: true } },
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

/**
 * DELETE: Menghapus papan (board) secara permanen.
 */
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = params

  try {
    // TODO: Tambahkan otorisasi untuk mengecek apakah user ini adalah 'Owner'

    await prisma.board.delete({
      where: { boardId: parseInt(boardId) }
    })

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Failed to delete board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
