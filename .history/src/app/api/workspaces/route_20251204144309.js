import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Patch BigInt agar bisa di-convert ke JSON
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// ============================================================================
// GET: Mengambil daftar workspace (Code lama Anda)
// ============================================================================
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    // Workspaces where the user is a direct member OR has a board membership inside
    const workspaces = await prisma.workspace.findMany({
      where: {
        // Tambahkan filter bitActive agar workspace yang dihapus tidak muncul
        bitActive: 1,
        OR: [
          { workspaceMember: { some: { userId, bitActive: 1 } } },
          { boards: { some: { boardMember: { some: { userId, bitActive: 1 } } } } }
        ]
      },
      orderBy: { dtmInserted: 'asc' }
    })

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)

    return NextResponse.json({ message: 'Failed to fetch workspaces', error: error?.message }, { status: 500 })
  }
}

// ============================================================================
// POST: Membuat Workspace Baru (TAMBAHAN BARU)
// ============================================================================
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { workspaceName } = body

    if (!workspaceName) {
      return NextResponse.json({ message: 'Workspace name is required' }, { status: 400 })
    }

    // Gunakan transaksi Database untuk menjamin konsistensi:
    // 1. Buat Workspace
    // 2. Masukkan User pembuat sebagai 'Owner' di trWorkspaceMember
    const result = await prisma.$transaction(async tx => {
      // A. Create Workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          workspaceName: workspaceName,
          txtInsertedBy: session.user.name,
          bitActive: 1
        }
      })

      // B. Add Creator as Member (Owner)
      // PENTING: Tanpa ini, user tidak akan bisa melihat workspace yang baru dia buat
      await tx.trWorkspaceMember.create({
        data: {
          workspaceId: newWorkspace.workspaceId,
          userId: parseInt(session.user.id),
          role: 'Owner',
          txtInsertedBy: session.user.name,
          bitActive: 1
        }
      })

      return newWorkspace
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
