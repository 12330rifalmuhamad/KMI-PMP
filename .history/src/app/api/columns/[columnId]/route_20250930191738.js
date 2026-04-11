import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PUT(request, { params }) {
  const { columnId } = params

  try {
    const body = await request.json()

    const updated = await prisma.boardColumn.update({
      where: { columnId: parseInt(columnId) },
      data: { columnName: body.txtColumnName, txtUpdatedBy: 'system' }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update column' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { columnId } = params

  try {
    await prisma.boardColumn.delete({ where: { columnId: parseInt(columnId) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete column' }, { status: 500 })
  }
}

