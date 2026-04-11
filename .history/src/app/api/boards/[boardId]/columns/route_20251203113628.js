import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = params

  try {
    const body = await request.json()
    const { txtColumnName, txtColumnType } = body

    if (!txtColumnName || !txtColumnType) {
      return NextResponse.json({ message: 'Column name and type are required' }, { status: 400 })
    }

    const allowedTypes = [
      'TEXT',
      'PERSON',
      'STATUS',
      'DATE',
      'NUMBER',
      'CHECKBOX',
      'FILES',
      'LINK',
      'DROPDOWN',
      'TIMELINE',
      'FORMULA',
      'CONNECT',
      'DOC',
      'PROGRESS'
    ]

    if (!allowedTypes.includes(txtColumnType)) {
      return NextResponse.json({ message: `Invalid column type: ${txtColumnType}` }, { status: 400 })
    }

    // Hitung sortOrder
    const maxSortOrderColumn = await prisma.boardColumn.findFirst({
      where: { boardId: parseInt(boardId) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const nextSortOrder = (maxSortOrderColumn?.sortOrder || 0) + 1

    const newColumn = await prisma.boardColumn.create({
      data: {
        boardId: parseInt(boardId),
        columnName: txtColumnName,
        columnType: txtColumnType,
        sortOrder: nextSortOrder,
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error) {
    console.error('🔴 GAGAL MEMBUAT KOLOM:', error)

    return NextResponse.json({ message: 'Failed to create column', error: error.message }, { status: 500 })
  }
}
