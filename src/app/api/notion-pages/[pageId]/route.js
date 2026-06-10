import { NextResponse } from 'next/server'

import {
  findOwnedPage,
  getCurrentUser,
  notFoundResponse,
  parseBigIntParam,
  prisma,
  unauthorizedResponse
} from '../_utils'

const pageInclude = {
  blocks: {
    where: { bitActive: 1 },
    orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }]
  },
  comments: {
    where: { bitActive: 1 },
    orderBy: { dtmInserted: 'asc' },
    include: {
      mUser: {
        select: {
          userId: true,
          userName: true,
          email: true
        }
      }
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
    const page = await prisma.notionPage.findFirst({
      where: {
        pageId,
        userId: currentUser.userId,
        bitActive: 1
      },
      include: pageInclude
    })

    if (!page) return notFoundResponse()

    return NextResponse.json(page)
  } catch (error) {
    console.error('[NOTION_PAGE_GET]', error)

    return NextResponse.json({ message: 'Failed to fetch page', error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId } = await params
  const pageId = parseBigIntParam(rawPageId)

  if (!pageId) return notFoundResponse()

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    const body = await request.json()

    const data = {
      txtUpdatedBy: currentUser.userName
    }

    if (Object.prototype.hasOwnProperty.call(body, 'pageTitle')) {
      data.pageTitle = String(body.pageTitle || '').trim() || 'Untitled'
    }

    if (Object.prototype.hasOwnProperty.call(body, 'title')) {
      data.pageTitle = String(body.title || '').trim() || 'Untitled'
    }

    if (Object.prototype.hasOwnProperty.call(body, 'pageIcon')) {
      data.pageIcon = body.pageIcon ? String(body.pageIcon) : null
    }

    if (Object.prototype.hasOwnProperty.call(body, 'pageCoverUrl')) {
      data.pageCoverUrl = body.pageCoverUrl ? String(body.pageCoverUrl) : null
    }

    if (Object.prototype.hasOwnProperty.call(body, 'pageCoverPosition')) {
      data.pageCoverPosition = body.pageCoverPosition ? String(body.pageCoverPosition) : 'center'
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isFavorite')) {
      data.isFavorite = body.isFavorite ? 1 : 0
    }

    const updatedPage = await prisma.notionPage.update({
      where: { pageId },
      data,
      include: pageInclude
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    console.error('[NOTION_PAGE_PUT]', error)

    return NextResponse.json({ message: 'Failed to update page', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  const { pageId: rawPageId } = await params
  const pageId = parseBigIntParam(rawPageId)

  if (!pageId) return notFoundResponse()

  try {
    const page = await findOwnedPage(pageId, currentUser.userId, { pageId: true })

    if (!page) return notFoundResponse()

    await prisma.notionPage.update({
      where: { pageId },
      data: {
        bitActive: 0,
        txtUpdatedBy: currentUser.userName
      }
    })

    return NextResponse.json({ message: 'Page deleted successfully' })
  } catch (error) {
    console.error('[NOTION_PAGE_DELETE]', error)

    return NextResponse.json({ message: 'Failed to delete page', error: error.message }, { status: 500 })
  }
}
