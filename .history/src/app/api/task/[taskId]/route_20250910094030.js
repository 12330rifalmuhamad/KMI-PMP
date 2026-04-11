import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}
const prisma = new PrismaClient()

// FUNGSI PATCH: Untuk meng-update judul tugas
export async function PATCH(request, { params }) {
  try {
    const { taskId } = params
    const body = await request.json()
    const { taskTitle } = body

    const updatedTask = await prisma.task.update({
      where: { taskId: parseInt(taskId) },
      data: { taskTitle: taskTitle }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task', error: error.message }, { status: 500 })
  }
}

// FUNGSI DELETE: Untuk menghapus tugas
export async function DELETE(request, { params }) {
  try {
    const { taskId } = params

    await prisma.task.delete({
      where: { taskId: parseInt(taskId) }
    })

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete task', error: error.message }, { status: 500 })
  }
}
