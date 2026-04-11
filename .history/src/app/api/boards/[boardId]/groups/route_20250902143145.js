import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  const { boardId } = params

  try {
    const body = await request.json()
    const { txtGroupName, txtGroupColor, txtInsertedBy } = body

    if (!txtGroupName) {
      return NextResponse.json({ message: 'Group name is required' }, { status: 400 })
    }

    const newGroup = await prisma.group.create({
      data: {
        boardId: parseInt(boardId),
        groupName: txtGroupName,
        groupColor: txtGroupColor,
        txtInsertedBy: txtInsertedBy || 'system'
      }
    })

    return NextResponse.json(newGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create group:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
