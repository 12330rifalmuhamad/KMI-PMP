import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Alias plural endpoint to create a task within a group
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { groupId } = params

  try {
    const body = await request.json()
    const title = body?.txtTaskTitle

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ message: 'txtTaskTitle is required' }, { status: 400 })
    }

    const newTask = await prisma.task.create({
      data: {
        groupId: parseInt(groupId),
        taskTitle: title,
        txtInsertedBy: session.user.name || 'system'
      }
    })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 })
  }
}


