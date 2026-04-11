import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Update column name/type/sortOrder/calc/unit
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params

  try {
    const body = await request.json()

    // Tambahkan txtCalculationType dan txtUnit agar bisa diupdate juga
    const { txtColumnName, txtColumnType, sortOrder, txtCalculationType, txtUnit } = body || {}

    const updated = await prisma.boardColumn.update({
      where: { columnId: parseInt(columnId) },
      data: {
        columnName: txtColumnName ?? undefined,
        columnType: txtColumnType ?? undefined,
        calculationType: txtCalculationType ?? undefined, // Tambahan
        unit: txtUnit ?? undefined, // Tambahan
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        txtUpdatedBy: session.user.name
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update column:', error)

    return NextResponse.json({ message: 'Failed to update column', error: error.message }, { status: 500 })
  }
}

// Delete a column
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params

  try {
    const id = parseInt(columnId)

    await prisma.trTaskValue.deleteMany({ where: { columnId: id } })
    await prisma.boardColumn.delete({ where: { columnId: id } })

    return NextResponse.json({ message: 'Column deleted successfully' })
  } catch (error) {
    console.error('Failed to delete column:', error)

    return NextResponse.json({ message: 'Failed to delete column', error: error.message }, { status: 500 })
  }
}
