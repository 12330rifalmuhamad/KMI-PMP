import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Patch BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Helper: Cek akses workspace dan status aktif
async function checkWorkspaceAccess(workspaceId, userId) {
  if (!workspaceId || !userId) return null

  const member = await prisma.trWorkspaceMember.findFirst({
    where: {
      workspaceId: parseInt(workspaceId),
      userId: parseInt(userId),
      bitActive: 1, // Pastikan member aktif
      workspace: {
        bitActive: 1 // Pastikan workspace juga aktif
      }
    },
    include: {
      workspace: true // Sertakan data workspace untuk pengecekan
    }
  })

  return member
}

// GET: Ambil detail workspace
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    // Cek akses member
    const member = await checkWorkspaceAccess(workspaceId, userId)

    if (!member) {
      return NextResponse.json({ message: 'Workspace not found or access denied' }, { status: 404 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        workspaceId: parseInt(workspaceId),
        bitActive: 1 // Hanya ambil workspace aktif
      },
      include: {
        workspaceMember: {
          where: { bitActive: 1 }, // Hanya ambil member aktif
          include: {
            mUser: {
              select: { userId: true, userName: true, email: true }
            }
          }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// PUT: Update workspace (Rename)
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Hanya Owner atau Admin yang boleh rename (sesuaikan dengan role Anda)
    if (!member || (member.role !== 'Owner' && member.role !== 'Admin')) {
      return NextResponse.json({ message: 'Access denied. Only Owner/Admin can update workspace.' }, { status: 403 })
    }

    const body = await request.json()
    const { workspaceName } = body

    if (!workspaceName) {
      return NextResponse.json({ message: 'Workspace name is required' }, { status: 400 })
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        workspaceName: workspaceName,
        txtUpdatedBy: session.user.name,
        dtmUpdated: new Date()
      }
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

// DELETE: Soft Delete Workspace
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Strict Check: Hanya Owner yang boleh menghapus workspace
    if (!member || member.role !== 'Owner') {
      return NextResponse.json({ message: 'Access denied. Only owners can delete workspaces.' }, { status: 403 })
    }

    // Lakukan Soft Delete (set bitActive = 0)
    // Ini lebih aman daripada delete permanen untuk integritas data historis
    await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        bitActive: 0,
        txtUpdatedBy: session.user.name,
        dtmUpdated: new Date()
      }
    })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
