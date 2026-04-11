import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  const { taskId } = params

  try {
    const body = await request.json()
    const { intColumn_ID, txtValue, txtUpdatedBy } = body

    if (intColumn_ID === undefined || txtValue === undefined) {
      return NextResponse.json({ message: 'Column ID and value are required' }, { status: 400 })
    }

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: parseInt(taskId),
          columnId: intColumn_ID
        }
      },
      update: {
        value: txtValue,
        txtUpdatedBy: txtUpdatedBy || 'system'
      },
      create: {
        taskId: parseInt(taskId),
        columnId: intColumn_ID,
        value: txtValue,
        txtInsertedBy: txtUpdatedBy || 'system'
      }
    })

    return NextResponse.json(updatedValue, { status: 200 })
  } catch (error) {
    console.error('Failed to update task value:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
