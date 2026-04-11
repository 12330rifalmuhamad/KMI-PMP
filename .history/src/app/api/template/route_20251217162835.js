// app/api/templates/route.js
import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma' // Sesuaikan path prisma client Anda

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, columns } = body

    // 'columns' adalah array dari frontend yang SUDAH TERURUT posisinya
    // Kita simpan array ini mentah-mentah ke JSON
    const newTemplate = await prisma.boardTemplate.create({
      data: {
        templateName: name,
        structure: columns // Simpan array kolom beserta urutannya
      }
    })

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    console.error('Error saving template:', error)

    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}
