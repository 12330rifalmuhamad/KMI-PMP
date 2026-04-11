import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  const { taskId } = await params

  try {
    const body = await request.json()

    // Debugging Log
    console.log(`[API LOG] Update Value Task/Subtask ID: ${taskId}`, body)

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: parseInt(taskId), // taskId ini bisa berupa ID Parent atau ID Subitem
          columnId: body.intColumn_ID
        }
      },
      update: {
        value: body.txtValue,
        txtUpdatedBy: 'system'
      },
      create: {
        taskId: parseInt(taskId),
        columnId: body.intColumn_ID,
        value: body.txtValue,
        txtInsertedBy: 'system'
      }
    })

    return NextResponse.json(updatedValue)
  } catch (error) {
    console.error('🔴 [API LOG] Failed Update Value:', error)

    return NextResponse.json({ message: 'Failed to update task value' }, { status: 500 })
  }
}
