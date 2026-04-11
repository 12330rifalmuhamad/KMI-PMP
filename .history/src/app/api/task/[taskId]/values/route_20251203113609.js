import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  // Session check (bisa di-uncomment jika sudah siap)
  // const session = await getServerSession(authOptions)
  // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { taskId } = params

  try {
    const body = await request.json()

    // Debugging logs
    console.log(`[API LOG] Menerima request PATCH untuk Task ID (Item/Subitem): ${taskId}`)
    console.log('[API LOG] Payload:', body)

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: parseInt(taskId),
          columnId: parseInt(body.intColumn_ID) // Pastikan diparse ke Int
        }
      },
      update: {
        value: String(body.txtValue), // Pastikan string
        txtUpdatedBy: 'system'
      },
      create: {
        taskId: parseInt(taskId),
        columnId: parseInt(body.intColumn_ID),
        value: String(body.txtValue),
        txtInsertedBy: 'system'
      }
    })

    console.log('[API LOG] Berhasil menyimpan:', updatedValue)

    return NextResponse.json(updatedValue)
  } catch (error) {
    console.error('🔴 [API LOG] GAGAL menyimpan ke DB:', error)

    return NextResponse.json({ message: 'Failed to update task value', error: error.message }, { status: 500 })
  }
}
