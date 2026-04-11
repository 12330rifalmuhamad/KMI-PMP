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

    // =======================================================
    // PERBAIKAN: Hitung sortOrder berikutnya
    // =======================================================
    // 1. Cari sortOrder maksimum yang sudah ada di board ini
    const maxSortOrderColumn = await prisma.boardColumn.findFirst({
      where: { boardId: parseInt(boardId) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    // 2. Tentukan sortOrder baru (jika belum ada kolom, mulai dari 1)
    const nextSortOrder = (maxSortOrderColumn?.sortOrder || 0) + 1

    // =======================================================

    const newColumn = await prisma.boardColumn.create({
      data: {
        boardId: parseInt(boardId),
        columnName: txtColumnName,
        columnType: txtColumnType,
        sortOrder: nextSortOrder, // Gunakan sortOrder yang sudah dihitung
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error) {
    console.error('🔴 GAGAL MEMBUAT KOLOM:', error)

    return NextResponse.json({ message: 'Failed to create column', error: error.message }, { status: 500 })
  }
}
