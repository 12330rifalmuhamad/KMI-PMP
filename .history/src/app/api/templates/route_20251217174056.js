// src/app/api/templates/route.js
import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

// --- TAMBAHKAN BARIS INI ---
const prisma = new PrismaClient()

// ---------------------------

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, columns } = body

    if (!name || !columns) {
      return NextResponse.json({ error: 'Template name and columns are required' }, { status: 400 })
    }

    console.log('Saving template to DB:', name)

    const newTemplate = await prisma.boardTemplate.create({
      data: {
        templateName: name,
        structure: columns
      }
    })

    console.log('Success save template ID:', newTemplate.templateId)

    // Opsional: Putuskan koneksi setelah selesai (walaupun Next.js biasanya mengurusnya)
    await prisma.$disconnect()

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('SERVER ERROR SAVING TEMPLATE:', error)

    return NextResponse.json({ error: 'Failed to save template', details: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const templates = await prisma.boardTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        templateId: true,
        templateName: true

        // Kita tidak perlu load 'structure' di sini agar ringan,
        // structure hanya diambil saat create board
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
