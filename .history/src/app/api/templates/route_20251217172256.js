// src/app/api/templates/route.js
import { NextResponse } from 'next/server'

// --- PERBAIKAN DI SINI ---
// Ubah import agar mengarah ke file db.js yang baru kita buat di folder libs
import prisma from '@/libs/db'

// -------------------------

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

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('SERVER ERROR SAVING TEMPLATE:', error)

    return NextResponse.json({ error: 'Failed to save template', details: error.message }, { status: 500 })
  }
}
