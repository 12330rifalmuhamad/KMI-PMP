import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params
  const body = await request.json()
  const { options, renameMap } = body

  if (!options) return NextResponse.json({ message: "Missing 'options'" }, { status: 400 })

  try {
    const columnIdInt = parseInt(columnId)

    await prisma.$transaction(async tx => {
      // 1. Hapus opsi lama
      await tx.mColumnOption.deleteMany({
        where: { columnId: columnIdInt }
      })

      // 2. Insert opsi baru
      await tx.mColumnOption.createMany({
        data: options.map((opt, index) => ({
          columnId: columnIdInt,
          label: opt.label,
          color: opt.color,
          sortOrder: index,
          txtInsertedBy: session.user.name
        }))
      })

      // 3. Update value yang ada di item/subitem (rename)
      if (renameMap && Object.keys(renameMap).length > 0) {
        for (const [oldLabel, newLabel] of Object.entries(renameMap)) {
          if (oldLabel !== newLabel) {
            await tx.trTaskValue.updateMany({
              where: {
                columnId: columnIdInt,
                value: oldLabel
              },
              data: { value: newLabel }
            })
          }
        }
      }
    })

    return NextResponse.json({ message: 'Labels updated successfully' })
  } catch (error) {
    console.error(`🔴 GAGAL UPDATE LABELS:`, error)

    return NextResponse.json({ message: 'Failed to update labels', error: error.message }, { status: 500 })
  }
}
