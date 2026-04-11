import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { boardId } = params

  try {
    const board = await prisma.board.findUnique({
      where: { boardId: parseInt(boardId) },
      include: {
        columns: {
          orderBy: { sortOrder: 'asc' }
        },
        boardMember: {
          include: { mUser: true }
        },
        groups: {
          include: {
            items: {
              where: { parentId: null }, // Ambil hanya Parent Items
              orderBy: { createdAt: 'desc' },
              include: {
                values: true,
                subItems: {
                  // Include Sub-items di sini
                  include: {
                    values: true // Include values milik sub-items
                  },
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    return NextResponse.json(board)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
