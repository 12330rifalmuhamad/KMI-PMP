import { NextResponse } from 'next/server'

import {
  findOwnedPage,
  getCurrentUser,
  notFoundResponse,
  parseBigIntParam,
  prisma,
  unauthorizedResponse
} from '../../../_utils'

export async function DELETE(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId, commentId: rawCommentId } = await params
  const pageId = parseBigIntParam(rawPageId)
  const commentId = parseBigIntParam(rawCommentId)

  if (!pageId || !commentId) return notFoundResponse('Comment not found')

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    const comment = await prisma.trNotionPageComment.findFirst({
      where: {
        commentId,
        pageId,
        bitActive: 1
      }
    })

    if (!comment) return notFoundResponse('Comment not found')

    await prisma.trNotionPageComment.update({
      where: { commentId },
      data: {
        bitActive: 0,
        txtUpdatedBy: currentUser.userName
      }
    })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('[NOTION_COMMENT_DELETE]', error)

    return NextResponse.json({ message: 'Failed to delete comment', error: error.message }, { status: 500 })
  }
}
