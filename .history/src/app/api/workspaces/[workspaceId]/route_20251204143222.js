import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Helper to check access
async function checkWorkspaceAccess(workspaceId, userId) {
  const member = await prisma.trWorkspaceMember.findFirst({
    where: {
      workspaceId: parseInt(workspaceId),
      userId: parseInt(userId)
    }
  })

  return member
}

// GET: Fetch details of a specific workspace
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    if (!member) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { workspaceId: parseInt(workspaceId) },
      include: {
        workspaceMember: {
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

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: Update workspace details (e.g., Rename)
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Optional: Check if user is Admin/Owner if you want to restrict renaming
    if (!member) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { workspaceName } = body

    if (!workspaceName) {
      return NextResponse.json({ message: 'Workspace name is required' }, { status: 400 })
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        workspaceName,
        txtUpdatedBy: session.user.name,
        dtmUpdated: new Date()
      }
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error) {
    console.error('Error updating workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Delete a workspace
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId } = params
  const userId = parseInt(session.user.id)

  try {
    const member = await checkWorkspaceAccess(workspaceId, userId)

    // Strict Check: Only 'Owner' can delete a workspace
    if (!member || member.role !== 'Owner') {
      return NextResponse.json({ message: 'Access denied. Only owners can delete workspaces.' }, { status: 403 })
    }

    // Delete related data first (Transaction is safer, but cascade delete in schema is best)
    // Assuming Prisma Schema has onDelete: Cascade, we just delete the workspace.
    // If not, we might need to delete members/boards manually first.

    await prisma.workspace.delete({
      where: { workspaceId: parseInt(workspaceId) }
    })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
