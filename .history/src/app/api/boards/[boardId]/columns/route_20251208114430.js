import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Patch BigInt untuk JSON serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// Best practice: Gunakan global singleton untuk PrismaClient di dev mode
// agar tidak error "Too many connections" saat hot-reload.
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  // ==================================================================
  // FIX UTAMA: Await params sebelum destructuring (Next.js 15 requirement)
  // ==================================================================
  const { boardId } = await params

  try {
    const body = await request.json()
    const { txtColumnName, txtColumnType } = body

    // Validasi input
    if (!txtColumnName || !txtColumnType) {
      return NextResponse.json({ message: 'Column name and type are required' }, { status: 400 })
    }

    // ==================================================================
    // UPDATE: Daftar tipe kolom yang diizinkan
    // Saya tambahkan 'TAGS' agar fitur Tags berfungsi
    // ==================================================================
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
      'PROGRESS',
      'TAGS' // <--- WAJIB ADA UNTUK FITUR TAGS
    ]

    if (!allowedTypes.includes(txtColumnType)) {
      return NextResponse.json({ message: `Invalid column type: ${txtColumnType}` }, { status: 400 })
    }

    // Hitung sortOrder berikutnya
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

    return NextResponse.json({ mess age: 'Failed to create column', error: error.message }, { status: 500 })
  }
}
