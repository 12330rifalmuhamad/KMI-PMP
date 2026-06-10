import { NextResponse } from 'next/server'

import { getCurrentUser, prisma, unauthorizedResponse } from './_utils'

export async function GET() {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  try {
    const pages = await prisma.notionPage.findMany({
      where: {
        userId: currentUser.userId,
        bitActive: 1
      },
      orderBy: [{ dtmUpdated: 'desc' }, { dtmInserted: 'desc' }],
      select: {
        pageId: true,
        pageTitle: true,
        pageIcon: true,
        pageCoverUrl: true,
        pageCoverPosition: true,
        isFavorite: true,
        sortOrder: true,
        dtmInserted: true,
        dtmUpdated: true
      }
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error('[NOTION_PAGES_GET]', error)

    return NextResponse.json({ message: 'Failed to fetch pages', error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const currentUser = await getCurrentUser()

  if (!currentUser) return unauthorizedResponse()

  try {
    const body = await request.json().catch(() => ({}))
    const pageTitle = String(body?.pageTitle || body?.title || 'New page').trim() || 'New page'

    const latestPage = await prisma.notionPage.findFirst({
      where: {
        userId: currentUser.userId,
        bitActive: 1
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const page = await prisma.notionPage.create({
      data: {
        userId: currentUser.userId,
        pageTitle,
        sortOrder: (latestPage?.sortOrder || 0) + 1,
        txtInsertedBy: currentUser.userName,
        bitActive: 1
      },
      select: {
        pageId: true,
        pageTitle: true,
        pageIcon: true,
        pageCoverUrl: true,
        pageCoverPosition: true,
        isFavorite: true,
        sortOrder: true,
        dtmInserted: true,
        dtmUpdated: true
      }
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('[NOTION_PAGES_POST]', error)

    return NextResponse.json({ message: 'Failed to create page', error: error.message }, { status: 500 })
  }
}
