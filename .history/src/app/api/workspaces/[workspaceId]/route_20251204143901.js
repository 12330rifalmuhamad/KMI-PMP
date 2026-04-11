import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  const { workspaceId } = params

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { workspaceId: parseInt(workspaceId) },
      include: {
        boards: {
          include: {
            columns: { orderBy: { sortOrder: 'asc' } },
            groups: {
              orderBy: { dtmInserted: 'asc' },
              include: {
                items: {
                  orderBy: { dtmInserted: 'asc' },
                  include: { values: true }
                }
              }
            },
            boardMember: { include: { mUser: true } }
          }
        },
        workspaceMember: { include: { mUser: true } }
      }
    })

    if (!workspace) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Failed to fetch workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const { workspaceId } = params

  try {
    const { workspaceName, description } = await request.json()

    const workspace = await prisma.workspace.update({
      where: { workspaceId: parseInt(workspaceId) },
      data: {
        workspaceName: workspaceName || undefined,
        txtUpdatedBy: 'system'
      },
      include: {
        boards: {
          include: {
            columns: { orderBy: { sortOrder: 'asc' } },
            groups: {
              orderBy: { dtmInserted: 'asc' },
              include: {
                items: {
                  orderBy: { dtmInserted: 'asc' },
                  include: { values: true }
                }
              }
            },
            boardMember: { include: { mUser: true } }
          }
        },
        workspaceMember: { include: { mUser: true } }
      }
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Failed to update workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { workspaceId } = params

  try {
    await prisma.workspace.delete({
      where: { workspaceId: parseInt(workspaceId) }
    })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Failed to delete workspace:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
