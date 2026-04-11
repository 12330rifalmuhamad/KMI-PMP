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
  const { statusColumnIds } = await request.json() // Harapannya menerima array [id1, id2]

  if (!Array.isArray(statusColumnIds)) {
    return NextResponse.json({ message: "Payload harus berupa array 'statusColumnIds'" }, { status: 400 })
  }

  const columnIdInt = parseInt(columnId)

  try {
    await prisma.$transaction(async tx => {
      // 1. Hapus semua pengaturan lama untuk kolom progress ini
      await tx.mColumnProgressLink.deleteMany({
        where: { progressColumnId: columnIdInt }
      })

      // 2. Buat pengaturan baru
      if (statusColumnIds.length > 0) {
        await tx.mColumnProgressLink.createMany({
          data: statusColumnIds.map(statusId => ({
            progressColumnId: columnIdInt,
            statusColumnId: parseInt(statusId)
          }))
        })
      }
    })

    return NextResponse.json({ message: 'Pengaturan progress berhasil disimpan' })
  } catch (error) {
    console.error('🔴 GAGAL MENYIMPAN PENGATURAN PROGRESS:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
