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

    // 1. Verify Task Exists
    const taskExists = await prisma.task.findUnique({
      where: { taskId: BigInt(taskId) }
    })

    if (!taskExists) {
      console.warn(`[API LOG] Task ${taskId} not found. Skipping update.`)
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: BigInt(taskId), 
          columnId: BigInt(body.intColumn_ID)
        }
      },
      update: {
        value: body.txtValue,
        txtUpdatedBy: 'system'
      },
      create: {
        taskId: BigInt(taskId),
        columnId: BigInt(body.intColumn_ID),
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
