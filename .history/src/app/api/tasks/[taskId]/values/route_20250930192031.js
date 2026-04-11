import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Alias handler to match frontend path /api/tasks/[taskId]/values
export async function PATCH(request, { params }) {
  const { taskId } = params

  try {
    const body = await request.json()

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: parseInt(taskId),
          columnId: body.intColumn_ID
        }
      },
      update: { value: body.txtValue, txtUpdatedBy: 'system' },
      create: {
        taskId: parseInt(taskId),
        columnId: body.intColumn_ID,
        value: body.txtValue,
        txtInsertedBy: 'system'
      }
    })

    return NextResponse.json(updatedValue)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task value' }, { status: 500 })
  }
}
