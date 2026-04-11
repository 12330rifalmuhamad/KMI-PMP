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
// GET: Mengambil daftar workspace
// ============================================================================
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    // Workspaces where the user is a direct member OR has a board membership inside
    const workspaces = await prisma.workspace.findMany({
      where: {
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
    // Safe logging
    const errorMessage = error?.message || 'Unknown error'

    console.error('Failed to fetch workspaces:', errorMessage)

    return NextResponse.json({ message: 'Failed to fetch workspaces', error: errorMessage }, { status: 500 })
  }
}

// ============================================================================
// POST: Membuat Workspace Baru
// ============================================================================
export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Safe Body Parsing (Mencegah crash jika body kosong/invalid)
    const body = await request.json().catch(() => null)

    if (!body || !body.workspaceName) {
      return NextResponse.json({ message: 'Workspace name is required' }, { status: 400 })
    }

    const { workspaceName } = body
    const userId = parseInt(session.user.id)
    const userName = session.user.name || 'system'

    // 2. Gunakan Transaksi
    const result = await prisma.$transaction(async tx => {
      // A. Create Workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          workspaceName: workspaceName,
          txtInsertedBy: userName,
          bitActive: 1,

          // Opsional: Langsung buat relasi member di sini (lebih efisien)
          workspaceMember: {
            create: {
              userId: userId,
              role: 'Owner',
              txtInsertedBy: userName,
              bitActive: 1
            }
          }
        },

        // Include member agar frontend bisa langsung update state tanpa refetch
        include: {
          workspaceMember: true
        }
      })

      // Jika menggunakan nested create di atas (baris 76-83),
      // langkah B di bawah ini tidak diperlukan lagi.
      // Namun, jika ingin tetap dipisah seperti kode lama Anda, itu juga boleh.
      // Kode di atas sudah menggabungkan keduanya.

      return newWorkspace
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    // 3. SAFE ERROR LOGGING (PENTING UNTUK MENGATASI ERROR ANDA)
    // Kita pastikan tidak melempar null ke console.error
    const safeError = error || new Error('Unknown error occurred')

    console.error('Failed to create workspace:', safeError)

    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: safeError.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
