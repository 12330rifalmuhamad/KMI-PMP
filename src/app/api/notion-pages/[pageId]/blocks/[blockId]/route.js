import { NextResponse } from 'next/server'

import {
  findOwnedPage,
  getCurrentUser,
  normalizeBlockType,
  normalizeMetadata,
  notFoundResponse,
  parseBigIntParam,
  prisma,
  unauthorizedResponse
} from '../../../_utils'

async function findOwnedBlock(pageId, blockId, userId) {
  const page = await findOwnedPage(pageId, userId, { pageId: true })

  if (!page) return null

  return prisma.trNotionPageBlock.findFirst({
    where: {
      blockId,
      pageId,
      bitActive: 1
    }
  })
}

export async function PUT(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId, blockId: rawBlockId } = await params
  const pageId = parseBigIntParam(rawPageId)
  const blockId = parseBigIntParam(rawBlockId)

  if (!pageId || !blockId) return notFoundResponse('Block not found')

  try {
    const block = await findOwnedBlock(pageId, blockId, currentUser.userId)

    if (!block) return notFoundResponse('Block not found')

    const body = await request.json()

    const data = {
      txtUpdatedBy: currentUser.userName
    }

    if (Object.prototype.hasOwnProperty.call(body, 'blockType') || Object.prototype.hasOwnProperty.call(body, 'type')) {
      data.blockType = normalizeBlockType(body.blockType || body.type)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'content')) {
      data.content = body.content === null ? null : String(body.content)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'metadataJson') || Object.prototype.hasOwnProperty.call(body, 'metadata')) {
      data.metadataJson = normalizeMetadata(body.metadataJson ?? body.metadata)
    }

    if (Object.prototype.hasOwnProperty.call(body, 'blockColor')) {
      data.blockColor = body.blockColor ? String(body.blockColor) : 'default'
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isChecked')) {
      data.isChecked = body.isChecked ? 1 : 0
    }

    if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
      data.sortOrder = Number(body.sortOrder) || 0
    }

    const updatedBlock = await prisma.$transaction(async tx => {
      const result = await tx.trNotionPageBlock.update({
        where: { blockId },
        data
      })

      await tx.notionPage.update({
        where: { pageId },
        data: {
          txtUpdatedBy: currentUser.userName
        }
      })

      return result
    })

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('[NOTION_BLOCK_PUT]', error)

    return NextResponse.json({ message: 'Failed to update block', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId, blockId: rawBlockId } = await params
  const pageId = parseBigIntParam(rawPageId)
  const blockId = parseBigIntParam(rawBlockId)

  if (!pageId || !blockId) return notFoundResponse('Block not found')

  try {
    const block = await findOwnedBlock(pageId, blockId, currentUser.userId)

    if (!block) return notFoundResponse('Block not found')

    await prisma.$transaction(async tx => {
      await tx.trNotionPageBlock.update({
        where: { blockId },
        data: {
          bitActive: 0,
          txtUpdatedBy: currentUser.userName
        }
      })

      await tx.notionPage.update({
        where: { pageId },
        data: {
          txtUpdatedBy: currentUser.userName
        }
      })
    })

    return NextResponse.json({ message: 'Block deleted successfully' })
  } catch (error) {
    console.error('[NOTION_BLOCK_DELETE]', error)

    return NextResponse.json({ message: 'Failed to delete block', error: error.message }, { status: 500 })
  }
}
