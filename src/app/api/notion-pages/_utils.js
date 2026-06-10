import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const globalForPrisma = globalThis

export const prisma = globalForPrisma.kmiNotionPrisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.kmiNotionPrisma = prisma

export const allowedBlockTypes = new Set([
  'paragraph',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'quote',
  'code',
  'todo',
  'bulleted',
  'numbered',
  'toggle',
  'image'
])

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) return null

  return {
    session,
    userId: BigInt(String(session.user.id)),
    userName: session.user.name || session.user.email || 'system'
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse(message = 'Access denied') {
  return NextResponse.json({ message }, { status: 403 })
}

export function notFoundResponse(message = 'Page not found') {
  return NextResponse.json({ message }, { status: 404 })
}

export function parseBigIntParam(value) {
  if (!value || !/^\d+$/.test(String(value))) return null

  return BigInt(String(value))
}

export async function findOwnedPage(pageId, userId, select = undefined) {
  return prisma.notionPage.findFirst({
    where: {
      pageId,
      userId,
      bitActive: 1
    },
    ...(select ? { select } : {})
  })
}

export function normalizeMetadata(metadata) {
  if (metadata === undefined) return undefined
  if (metadata === null) return null
  if (typeof metadata === 'string') return metadata

  return JSON.stringify(metadata)
}

export function normalizeBlockType(blockType) {
  const type = String(blockType || 'paragraph')

  return allowedBlockTypes.has(type) ? type : 'paragraph'
}
