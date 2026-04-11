import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

// Patch untuk BigInt, wajib ada
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// FUNGSI GET: Untuk mengambil semua board dalam satu workspace
export async function GET(request, { params }) {
  // Pastikan nama parameter cocok dengan nama folder: [workspaceId]
  const { workspaceId } = params

  try {
    const boards = await prisma.board.findMany({
      where: {
        // Pastikan nama field di sini 'workspaceId' (camelCase)
        workspaceId: parseInt(workspaceId)
      },
      orderBy: {
        // Pastikan nama field di sini 'dtmInserted'
        dtmInserted: 'desc'
      }
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error(' GAGAL MENGAMBIL BOARDS:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// FUNGSI POST: Untuk membuat board baru dalam satu workspace
export async function POST(request, { params }) {
  const { workspaceId } = params

  try {
    const body = await request.json()
    const { boardName, description } = body || {}

    if (!boardName || typeof boardName !== 'string') {
      return NextResponse.json({ message: 'boardName is required' }, { status: 400 })
    }

    const created = await prisma.board.create({
      data: {
        workspaceId: parseInt(workspaceId),
        boardName,
        description: description || null,
        txtInsertedBy: 'system'
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error(' GAGAL MEMBUAT BOARD:', error)
    
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
