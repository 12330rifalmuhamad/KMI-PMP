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
      update: {
        value: body.txtValue,
        txtUpdatedBy: session.user.name
      },
      create: {
        taskId: parseInt(taskId),
        columnId: body.intColumn_ID,
        value: body.txtValue,
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(updatedValue)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task value' }, { status: 500 })
  }
}
