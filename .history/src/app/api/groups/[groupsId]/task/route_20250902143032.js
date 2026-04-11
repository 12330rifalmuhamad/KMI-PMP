import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  const { groupId } = params

  try {
    const body = await request.json()
    const { txtTaskTitle, txtInsertedBy } = body

    if (!txtTaskTitle) {
      return NextResponse.json({ message: 'Task title is required' }, { status: 400 })
    }

    const newTask = await prisma.task.create({
      data: {
        groupId: parseInt(groupId),
        taskTitle: txtTaskTitle,
        txtInsertedBy: txtInsertedBy || 'system'
      }
    })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
