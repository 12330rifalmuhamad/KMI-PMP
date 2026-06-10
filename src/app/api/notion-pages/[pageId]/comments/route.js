import { NextResponse } from 'next/server'

import {
  findOwnedPage,
  getCurrentUser,
  notFoundResponse,
  parseBigIntParam,
  prisma,
  unauthorizedResponse
} from '../../_utils'

const commentInclude = {
  mUser: {
    select: {
      userId: true,
      userName: true,
      email: true
    }
  }
}

export async function GET(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId } = await params
  const pageId = parseBigIntParam(rawPageId)

  if (!pageId) return notFoundResponse()

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    const comments = await prisma.trNotionPageComment.findMany({
      where: {
        pageId,
        bitActive: 1
      },
      orderBy: { dtmInserted: 'asc' },
      include: commentInclude
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('[NOTION_COMMENTS_GET]', error)

    return NextResponse.json({ message: 'Failed to fetch comments', error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId } = await params
  const pageId = parseBigIntParam(rawPageId)

  if (!pageId) return notFoundResponse()

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    const body = await request.json()
    const commentContent = String(body?.commentContent || body?.content || '').trim()

    if (!commentContent) {
      return NextResponse.json({ message: 'Comment is required' }, { status: 400 })
    }

    const comment = await prisma.$transaction(async tx => {
      const createdComment = await tx.trNotionPageComment.create({
        data: {
          pageId,
          userId: currentUser.userId,
          commentContent,
          txtInsertedBy: currentUser.userName,
          bitActive: 1
        },
        include: commentInclude
      })

      await tx.notionPage.update({
        where: { pageId },
        data: {
          txtUpdatedBy: currentUser.userName
        }
      })

      return createdComment
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('[NOTION_COMMENTS_POST]', error)

    return NextResponse.json({ message: 'Failed to create comment', error: error.message }, { status: 500 })
  }
}
