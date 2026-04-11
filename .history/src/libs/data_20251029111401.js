import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Patch untuk BigInt agar bisa di-pass antar Server/Client Component jika perlu
BigInt.prototype.toJSON = function () {
  return this.toString()
}

export async function getBoardsForWorkspace(workspaceId) {
  try {
    // Validate workspaceId parameter
    if (!workspaceId || workspaceId === null || workspaceId === undefined) {
      console.error('Invalid workspaceId provided:', workspaceId)
      return []
    }

    const boards = await prisma.board.findMany({
      where: { workspaceId: parseInt(workspaceId) },
      orderBy: { dtmInserted: 'desc' }
    })

    return boards
  } catch (error) {
    console.error('Database Error: Failed to fetch boards.', error)

    // Kembalikan array kosong jika gagal agar UI tidak crash
    return []
  }
}

// Anda bisa menambahkan fungsi data lain di sini di masa depan
// export async function getBoardById(boardId) { ... }
