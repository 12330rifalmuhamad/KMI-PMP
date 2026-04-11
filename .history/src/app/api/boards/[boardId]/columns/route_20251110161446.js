import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// ====================================================================
// FUNGSI PUT: Untuk meng-update kolom (Rename, Reorder, Change Type)
// ====================================================================
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params

  try {
    const body = await request.json()
    const dataToUpdate = {}

    // Cek data apa saja yang dikirim oleh frontend untuk di-update
    if (body.txtColumnName) {
      dataToUpdate.columnName = body.txtColumnName
    }

    if (body.txtColumnType) {
      dataToUpdate.columnType = body.txtColumnType
    }

    if (body.sortOrder !== undefined) {
      dataToUpdate.sortOrder = body.sortOrder
    }

    dataToUpdate.txtUpdatedBy = session.user.name

    const updatedColumn = await prisma.boardColumn.update({
      where: { columnId: parseInt(columnId) },
      data: dataToUpdate
    })

    return NextResponse.json(updatedColumn)
  } catch (error) {
    console.error(`🔴 GAGAL UPDATE KOLOM ${columnId}:`, error)

    return NextResponse.json({ message: 'Failed to update column', error: error.message }, { status: 500 })
  }
}

// ====================================================================
// FUNGSI DELETE: Untuk menghapus kolom
// ====================================================================
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params

  try {
    // Menghapus kolom (data trTaskValue yang terkait akan terhapus otomatis
    // jika Anda mengatur 'onDelete: Cascade' di skema relasinya)
    await prisma.boardColumn.delete({
      where: { columnId: parseInt(columnId) }
    })

    return NextResponse.json({ message: 'Column deleted successfully' })
  } catch (error) {
    console.error(`🔴 GAGAL HAPUS KOLOM ${columnId}:`, error)

    return NextResponse.json({ message: 'Failed to delete column', error: error.message }, { status: 500 })
  }
}
