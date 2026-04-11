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
