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
} from '../../_utils'

export async function POST(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId } = await params
  const pageId = parseBigIntParam(rawPageId)

  if (!pageId) return notFoundResponse()

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    const body = await request.json().catch(() => ({}))
    const afterBlockId = parseBigIntParam(body?.afterBlockId)
    const blockType = normalizeBlockType(body?.blockType || body?.type)
    const metadataJson = normalizeMetadata(body?.metadataJson ?? body?.metadata)

    const block = await prisma.$transaction(async tx => {
      let sortOrder = body?.sortOrder ? Number(body.sortOrder) : null

      if (!sortOrder && afterBlockId) {
        const afterBlock = await tx.trNotionPageBlock.findFirst({
          where: {
            blockId: afterBlockId,
            pageId,
            bitActive: 1
          },
          select: { sortOrder: true }
        })

        sortOrder = (afterBlock?.sortOrder || 0) + 1

        await tx.trNotionPageBlock.updateMany({
          where: {
            pageId,
            bitActive: 1,
            sortOrder: {
              gte: sortOrder
            }
          },
          data: {
            sortOrder: {
              increment: 1
            }
          }
        })
      }

      if (!sortOrder) {
        const latestBlock = await tx.trNotionPageBlock.findFirst({
          where: {
            pageId,
            bitActive: 1
          },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true }
        })

        sortOrder = (latestBlock?.sortOrder || 0) + 1
      }

      const createdBlock = await tx.trNotionPageBlock.create({
        data: {
          pageId,
          blockType,
          content: body?.content ? String(body.content) : '',
          metadataJson,
          blockColor: body?.blockColor ? String(body.blockColor) : 'default',
          isChecked: body?.isChecked ? 1 : 0,
          sortOrder,
          txtInsertedBy: currentUser.userName,
          bitActive: 1
        }
      })

      await tx.notionPage.update({
        where: { pageId },
        data: {
          txtUpdatedBy: currentUser.userName
        }
      })

      return createdBlock
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    console.error('[NOTION_BLOCK_POST]', error)

    return NextResponse.json({ message: 'Failed to create block', error: error.message }, { status: 500 })
  }
}
