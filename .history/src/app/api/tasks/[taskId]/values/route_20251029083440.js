import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = params
    const body = await request.json()
    const { intColumn_ID, txtValue } = body

    if (!intColumn_ID || !txtValue) {
      return NextResponse.json({ message: 'intColumn_ID and txtValue are required' }, { status: 400 })
    }

    // Check if value already exists for this task and column
    const existingValue = await prisma.trTaskValue.findFirst({
      where: {
        taskId: parseInt(taskId),
        columnId: parseInt(intColumn_ID)
      }
    })

    if (existingValue) {
      // Update existing value
      const updatedValue = await prisma.trTaskValue.update({
        where: { taskValueId: existingValue.taskValueId },
        data: { value: txtValue }
      })

      return NextResponse.json(updatedValue)
    } else {
      // Create new value
      const newValue = await prisma.trTaskValue.create({
        data: {
          taskId: parseInt(taskId),
          columnId: parseInt(intColumn_ID),
          value: txtValue
        }
      })

      return NextResponse.json(newValue, { status: 201 })
    }
  } catch (error) {
    console.error('Failed to update task value:', error)

    return NextResponse.json({ message: 'Failed to update task value', error: error?.message }, { status: 500 })
  }
}
