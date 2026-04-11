// app/api/templates/route.js
import { NextResponse } from 'next/server'

// PERHATIAN: Sesuaikan path ini dengan lokasi file prisma client Anda.
// Biasanya di '@/lib/prisma' atau '@/utils/prisma' atau '@/prisma/client'
import prisma from 'src/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, columns } = body

    // Validasi sederhana
    if (!name || !columns) {
      return NextResponse.json({ error: 'Template name and columns are required' }, { status: 400 })
    }

    console.log('Saving template to DB:', name)

    // Simpan ke Database
    const newTemplate = await prisma.boardTemplate.create({
      data: {
        templateName: name,
        structure: columns // Array kolom disimpan otomatis sebagai JSON
      }
    })

    console.log('Success save template ID:', newTemplate.templateId)

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('SERVER ERROR SAVING TEMPLATE:', error)

    return NextResponse.json({ error: 'Failed to save template', details: error.message }, { status: 500 })
  }
}
