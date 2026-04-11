import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  // Temporarily disable authentication check
  // const session = await getServerSession(authOptions)
  // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = params
    const body = await request.json()

    const updatedTask = await prisma.task.update({
      where: { taskId: parseInt(taskId) },
      data: { taskTitle: body.taskTitle, txtUpdatedBy: session.user.name }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = params

    await prisma.task.delete({ where: { taskId: parseInt(taskId) } })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 })
  }
}
