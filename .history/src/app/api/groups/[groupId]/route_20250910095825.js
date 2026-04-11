import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}
const prisma = new PrismaClient()

// FUNGSI PATCH: Untuk meng-update nama grup
export async function PATCH(request, { params }) {
  try {
    const { groupId } = params
    const body = await request.json()
    const { groupName } = body

    const updatedGroup = await prisma.group.update({
      where: { groupId: parseInt(groupId) },
      data: { groupName: groupName }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update group', error: error.message }, { status: 500 })
  }
}

// FUNGSI DELETE: Untuk menghapus grup (beserta semua tugas di dalamnya)
export async function DELETE(request, { params }) {
  try {
    const { groupId } = params

    await prisma.group.delete({
      where: { groupId: parseInt(groupId) }
    })

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete group', error: error.message }, { status: 500 })
  }
}
